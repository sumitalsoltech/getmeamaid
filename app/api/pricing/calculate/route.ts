import { NextRequest, NextResponse } from 'next/server';
import { resolvePricingRules } from '@/lib/pricingResolver';
import { getMysql } from '@/lib/mysql';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      serviceLevel, // e.g. "Standard Maintenance Curation" or "Deep Clean" or "Move In/Out"
      bedrooms = 1,
      bathrooms = 1,
      squareFootage = 0,
      addons = [], // e.g. ["Deep Oven Curation", "Premium Lavender-Sage Scent Selection"] or [{ name: "", quantity: 1 }]
      urgency = "", // e.g. "Same-day", "Next-day", "Saturday", "Normal"
      postalCode = "", // e.g. "M5V"
      homeType = "", // "Apartment / Condo", "House / Estate", "Office / Commercial"
      couponCode = ""
    } = body;

    const rules = (await resolvePricingRules()).filter(r => r.is_active);
    let manualQuoteFlag = false;
    let manualQuoteMessage = "";

    // 1. Service Base Price
    let basePrice = 140;
    const mysql = getMysql();
    const { data: dbServices, error: dbError } = await mysql.from('services').select('*');
    
    let foundInDb = false;
    if (!dbError && dbServices && Array.isArray(dbServices)) {
      let searchKey = serviceLevel?.toLowerCase() || "";
      if (searchKey === 'deep clean') searchKey = 'deep restoration suite';
      if (searchKey === 'move in/out' || searchKey === 'move in / out') searchKey = 'move in / out choreography';
      if (searchKey === 'standard clean' || searchKey === 'standard') searchKey = 'standard maintenance curation';

      const targetService = dbServices.find(
        (s: any) => {
          const tLower = s.title?.toLowerCase() || "";
          const slugLower = s.slug?.toLowerCase() || "";
          return tLower === searchKey || 
                 slugLower === searchKey.replace(/\s+/g, '-') ||
                 (tLower.length > 5 && searchKey.includes(tLower)) || 
                 (searchKey.length > 5 && tLower.includes(searchKey));
        }
      );

      if (targetService && targetService.rate !== undefined) {
        basePrice = Number(targetService.rate);
        foundInDb = true;
      }
    }

    if (!foundInDb) {
      const baseRule = rules.find(r => r.rule_type === 'service_base' && r.match_key.toLowerCase() === serviceLevel?.toLowerCase());
      if (baseRule) {
        basePrice = baseRule.price_adjustment;
      } else {
        // Fallback
        if (serviceLevel === 'Deep Clean' || serviceLevel === 'Deep Restoration Suite') basePrice = 210;
        else if (serviceLevel === 'Move In/Out' || serviceLevel === 'Move In / Out Choreography') basePrice = 340;
      }
    }

    // 2. Property / Job Size Charge
    let sizeCharge = 0;
    const numBeds = Number(bedrooms) || 1;
    const numBaths = Number(bathrooms) || 1;

    // We scan size charge rules to find matched select option (e.g. "1 Bedroom", "2 Bedroom", "4+ Bedroom")
    const sizeRules = rules.filter(r => r.rule_type === 'size_charge');
    let matchedSpecificSize = false;
    
    for (const rule of sizeRules) {
      const matchKeyLower = rule.match_key.toLowerCase();
      const isBedRule = matchKeyLower.includes('bed');
      if (isBedRule) {
        const isMatch = (numBeds === 1 && matchKeyLower.includes('1')) ||
                        (numBeds === 2 && matchKeyLower.includes('2')) ||
                        (numBeds === 3 && matchKeyLower.includes('3')) ||
                        (numBeds >= 4 && (matchKeyLower.includes('4+') || matchKeyLower.includes('4')));
        if (isMatch) {
          matchedSpecificSize = true;
          if (rule.manual_quote || rule.adjustment_type === 'manual') {
            manualQuoteFlag = true;
            manualQuoteMessage = rule.message || `Property scale "${rule.name}" requires on-site concierge review.`;
          } else {
            if (rule.adjustment_type === 'percentage') {
              sizeCharge += Math.round(basePrice * (rule.price_adjustment / 100));
            } else {
              sizeCharge += rule.price_adjustment;
            }
          }
          break;
        }
      }
    }

    if (!matchedSpecificSize) {
      const bedRule = rules.find(r => r.rule_type === 'size_charge' && r.match_key.toLowerCase() === 'bedrooms');
      if (numBeds > 1 && bedRule) {
        sizeCharge += (numBeds - 1) * bedRule.price_adjustment;
      } else if (numBeds > 1) {
        sizeCharge += (numBeds - 1) * 20;
      }
    }

    // Bathrooms Charge
    const bathRule = rules.find(r => r.rule_type === 'size_charge' && r.match_key.toLowerCase() === 'bathrooms');
    if (numBaths > 1 && bathRule) {
      sizeCharge += (numBaths - 1) * bathRule.price_adjustment;
    } else if (numBaths > 1) {
      sizeCharge += (numBaths - 1) * 30;
    }

    // 3. Add-on Pricing
    let addOnTotal = 0;
    if (Array.isArray(addons)) {
      addons.forEach((ad: any) => {
        const adName = typeof ad === 'string' ? ad : (ad.name || ad.id || "");
        const adQty = typeof ad === 'string' ? 1 : (Number(ad.quantity) || 1);
        if (!adName) return;

        const addonRule = rules.find(r => r.rule_type === 'addon_pricing' && r.match_key.toLowerCase() === adName.toLowerCase());
        if (addonRule) {
          const unitPrice = addonRule.price_adjustment;
          if (addonRule.quantity_allowed && adQty > 1) {
            addOnTotal += unitPrice * adQty;
          } else {
            addOnTotal += unitPrice;
          }
        } else {
          // Fallbacks
          let fallbackPrice = 0;
          if (adName.includes('Oven')) fallbackPrice = 40;
          else if (adName.includes('Lavender')) fallbackPrice = 15;
          else if (adName.includes('Window')) fallbackPrice = 50;
          else if (adName.includes('Refrigerator')) fallbackPrice = 40;
          else fallbackPrice = 25;

          addOnTotal += fallbackPrice * adQty;
        }
      });
    }

    // 4. Urgency Charge
    let urgencyCharge = 0;
    if (urgency && urgency !== "Normal") {
      const urgRule = rules.find(r => r.rule_type === 'urgency_charge' && r.match_key.toLowerCase() === urgency.toLowerCase());
      if (urgRule) {
        if (urgRule.adjustment_type === 'percentage') {
          urgencyCharge = Math.round((basePrice + sizeCharge + addOnTotal) * (urgRule.price_adjustment / 100));
        } else {
          urgencyCharge = urgRule.price_adjustment;
        }
      } else {
        if (urgency === 'Same-day') {
          urgencyCharge = Math.round((basePrice + sizeCharge + addOnTotal) * 0.20);
        } else if (urgency === 'Next-day') {
          urgencyCharge = Math.round((basePrice + sizeCharge + addOnTotal) * 0.10);
        }
      }
    }

    // 5. Location / Travel Charge
    let locationCharge = 0;
    let locationAvailable = true;
    const cleanPostal = postalCode.trim().toUpperCase();
    
    if (cleanPostal) {
      const locationRules = rules.filter(r => r.rule_type === 'location_charge');
      const matchedLoc = locationRules.find(r => {
        const areaCodes = (r.postal_code || r.match_key || "").toUpperCase().split(',').map((x: string) => x.trim());
        return areaCodes.some((code: string) => cleanPostal.startsWith(code) || cleanPostal.includes(code));
      });

      if (matchedLoc) {
        if (matchedLoc.service_available === false || matchedLoc.adjustment_type === 'unavailable') {
          locationAvailable = false;
          manualQuoteFlag = true;
          manualQuoteMessage = matchedLoc.message || `We do not support service in the "${matchedLoc.name}" area at this time.`;
        } else if (matchedLoc.manual_quote || matchedLoc.adjustment_type === 'manual') {
          manualQuoteFlag = true;
          manualQuoteMessage = matchedLoc.message || `Location "${matchedLoc.name}" is subject to active concierge reviews.`;
        } else {
          if (matchedLoc.adjustment_type === 'percentage') {
            locationCharge = Math.round((basePrice + sizeCharge + addOnTotal + urgencyCharge) * (matchedLoc.price_adjustment / 100));
          } else {
            locationCharge = matchedLoc.price_adjustment;
          }
        }
      } else {
        // Fallback checks
        const isOutsideZone = !cleanPostal.startsWith('M');
        if (isOutsideZone) {
          const fallbackLocRule = rules.find(r => r.rule_type === 'location_charge' && r.match_key === 'Outside Zone');
          locationCharge = fallbackLocRule ? fallbackLocRule.price_adjustment : 35;
        }
      }
    }

    // Subtotal before Min Order & Coupons & Taxes
    let subtotal = basePrice + sizeCharge + addOnTotal + urgencyCharge + locationCharge;

    // 6. Minimum Order Value
    let minOrderAdjustment = 0;
    const minRule = rules.find(r => r.rule_type === 'min_order');
    if (minRule) {
      const minThreshold = minRule.price_adjustment;
      if (subtotal < minThreshold) {
        minOrderAdjustment = minThreshold - subtotal;
        subtotal = minThreshold;
      }
    } else {
      if (subtotal < 120) {
        minOrderAdjustment = 120 - subtotal;
        subtotal = 120;
      }
    }

    // 7. Coupon Discount
    let discountAmount = 0;
    const cleanCoupon = couponCode.trim().toUpperCase();
    if (cleanCoupon) {
      if (cleanCoupon === 'PRISTINE15' || cleanCoupon === 'FIRST10') {
        discountAmount = Math.round(subtotal * 0.15);
      } else if (cleanCoupon === 'WELCOME100') {
        discountAmount = Math.min(100, subtotal);
      }
    }

    // Taxes/Fees
    const trustFee = Math.round(subtotal * 0.05 * 100) / 100;
    const tax = Math.round(subtotal * 0.13 * 100) / 100;

    // 8. Final Estimated Price
    let finalEstimatedPrice = Math.round((subtotal + trustFee + tax - discountAmount) * 100) / 100;
    if (finalEstimatedPrice < 0) finalEstimatedPrice = 0;

    // --- Dynamic manual quote regulations ---
    const manualRules = rules.filter(r => r.rule_type === 'manual_quote');
    manualRules.forEach(rule => {
      const key = rule.match_key.toLowerCase();
      
      const isLargeSize = key === 'large_size' && (numBeds > 4 || numBaths > 4 || Number(squareFootage) > 4000);
      const isCommercial = key === 'commercial' && (homeType.toLowerCase().includes('commercial') || homeType.toLowerCase().includes('office'));
      
      if (isLargeSize || isCommercial) {
        manualQuoteFlag = true;
        if (rule.message) {
          manualQuoteMessage = rule.message;
        }
      }
    });

    if (numBeds > 4 || numBaths > 4 || Number(squareFootage) > 4000) {
      if (!manualQuoteFlag) {
        manualQuoteFlag = true;
        manualQuoteMessage = "Service size exceeds established thresholds. Requires custom team calculation.";
      }
    }

    if (homeType.toLowerCase().includes('commercial') || homeType.toLowerCase().includes('office')) {
      if (!manualQuoteFlag) {
        manualQuoteFlag = true;
        manualQuoteMessage = "Commercial listings require specialized on-site assessment.";
      }
    }

    return NextResponse.json({
      success: true,
      priceBreakdown: {
        basePrice,
        sizeCharge,
        addOnTotal,
        urgencyCharge,
        locationCharge,
        subtotal,
        minOrderAdjustment,
        trustFee,
        tax,
        couponCode: cleanCoupon || null,
        discountAmount,
        finalEstimatedPrice,
        manualQuoteFlag,
        manualQuoteMessage: manualQuoteFlag 
          ? (manualQuoteMessage || `Estimated price starts from $${basePrice}. Final quote will be shared by email after concierge review.`)
          : ""
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
