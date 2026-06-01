import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'pristine_jwt_atelier_secret_key_998811';

// mapping slug -> permission key
const ROUTE_PERMISSIONS: Record<string, string> = {
  'dashboard': 'view_dashboard',
  'orders': 'view_orders',
  'job-allocation': 'assign_jobs',
  'staff-jobs': 'view_staff_jobs',
  'customers': 'view_customers',
  'staff': 'manage_staff',
  'roles': 'manage_roles',
  'services': 'manage_services',
  'pricing': 'manage_pricing',
  'coupons': 'manage_coupons',
  'slots': 'view_slots',
  'tickets': 'manage_tickets',
  'invoices': 'download_invoices',
  'reports': 'view_reports',
  'emails': 'manage_email_templates',
  'cms': 'manage_cms',
  'settings': 'manage_settings',
  'database': 'manage_settings',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect routes starting with /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Bypass root /admin (login/redirect shell) and /admin/unauthorized page
  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/unauthorized') {
    return NextResponse.next();
  }

  const token = req.cookies.get('pristine_admin_token')?.value;

  if (!token) {
    // Not authenticated, redirect to admin login page
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const roleId = Number(payload.role_id);
    const userPermissions = (payload.permissions as string[]) || [];
    const userType = payload.type;

    // Super Admin (role_id === 1) or userType === 'admin' has full access
    if (roleId === 1 || userType === 'admin') {
      return NextResponse.next();
    }

    // Get the sub-path slug e.g. /admin/dashboard -> dashboard
    const subPath = pathname.substring('/admin/'.length).split('/')[0];
    const requiredPermission = ROUTE_PERMISSIONS[subPath];

    if (requiredPermission) {
      if (!userPermissions.includes(requiredPermission)) {
        // Redirect to the admin unauthorized page
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error('[Middleware] JWT verification failed:', err);
    // Delete invalid token cookie and redirect to login
    const response = NextResponse.redirect(new URL('/admin', req.url));
    response.cookies.delete('pristine_admin_token');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
