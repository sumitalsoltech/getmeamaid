import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getMysql } from '@/lib/mysql';
import { getLocalVouchers, saveLocalVoucher, GiftCardRecord } from '@/lib/dbStore';

export async function GET(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('gift_cards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        return NextResponse.json({ giftCards: data.length > 0 ? data : getLocalVouchers() });
      }
      console.error('MySQL gift cards fetch error, falling back to memory:', error);
    }
    
    return NextResponse.json({ giftCards: getLocalVouchers() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, fromName, toName, recipientEmail } = body;

    const cleanRecipientEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';
    const safeAmount = Number(amount);
    if (!cleanRecipientEmail || !cleanRecipientEmail.includes('@') || !fromName || !toName || isNaN(safeAmount) || safeAmount <= 0) {
      return NextResponse.json({ error: 'Missing or invalid required gift card fields. Please enter a valid recipient email and positive numerical amount.' }, { status: 400 });
    }

    const voucherCode = `GFT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newVoucher: GiftCardRecord = {
      id: voucherCode,
      amount: safeAmount,
      from_name: fromName,
      to_name: toName,
      recipient_email: cleanRecipientEmail,
      created_at: new Date().toISOString()
    };

    // 1. Save in MySQL (if active)
    let savedInMysql = false;
    let dbError = null;
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { error } = await mysqlClient.from('gift_cards').insert([newVoucher]);
      if (!error) {
        savedInMysql = true;
      } else {
        dbError = error;
        console.error('MySQL gift cards insert error detail:', JSON.stringify(error));
      }
    }

    // Keep memory fallback
    saveLocalVoucher(newVoucher);

    // 2. Setup SMTP Transporter with Mailtrap settings
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.MAILTRAP_SMTP_PORT) || 2525,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER || "1df975b5e35782",
        pass: process.env.MAILTRAP_SMTP_PASS || "b7dc1e0a878045"
      }
    });

    const mailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>getmeamaid Elegant Gift Voucher</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f172a;
            padding: 40px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
          }
          .subtitle {
            font-size: 10px;
            letter-spacing: 0.3em;
            color: #fbbf24;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .voucher-body {
            padding: 48px;
            text-align: center;
          }
          .voucher-title {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #d97706;
            margin-bottom: 32px;
          }
          .amount-circle {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            background-color: #fef3c7;
            border: 2px dashed #b45309;
            margin: 0 auto 32px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          .amount {
            font-size: 36px;
            font-weight: 900;
            color: #92400e;
          }
          .amount-label {
            font-size: 10px;
            font-weight: 700;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-top: 2px;
          }
          .gift-details {
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 24px;
          }
          .code-box {
            background: #f1f5f9;
            padding: 16px 24px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 18px;
            letter-spacing: 0.1em;
            font-weight: 700;
            color: #0f172a;
            display: inline-block;
            margin-top: 12px;
            border: 1px solid #cbd5e1;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">getmeamaid</h1>
            <div class="subtitle">Premium Home Care</div>
          </div>
          <div class="voucher-body">
            <div class="voucher-title">Atelier Care Gift Voucher</div>
            
            <div class="amount-circle">
              <span class="amount">$${amount}</span>
              <span class="amount-label">Restoration Credit</span>
            </div>
            
            <p class="gift-details">
              Dearest <strong>${toName}</strong>,<br/><br/>
              An elegant gift of professional home restoring services has been granted to you by <strong>${fromName}</strong>. 
              This credit is valid for any standard maintenance, deep restoration, or bespoke home care suites.
            </p>
            
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em;">Secure Code Voucher</div>
              <div class="code-box">${voucherCode}</div>
            </div>
          </div>
          <div class="footer">
            To redeem, enter this voucher code in checkout booking panel, or call +1 (800) 587-0320.<br/>
            &copy; ${new Date().getFullYear()} getmeamaid Co. • 100 King Street West, Toronto, ON M5X 1A9
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"getmeamaid Vouchers" <vouchers@getmeamaid.com>',
      to: cleanRecipientEmail,
      subject: `🎁 A getmeamaid Gift Voucher of $${amount} has been crafted for you!`,
      html: mailHtml,
    });

    return NextResponse.json({
      success: true,
      voucherCode,
      savedInMysql,
      dbError
    });
  } catch (err: any) {
    console.error('API Gift Cards POST error:', err);
    return NextResponse.json({ error: err.message || 'Unknown server error.' }, { status: 500 });
  }
}
