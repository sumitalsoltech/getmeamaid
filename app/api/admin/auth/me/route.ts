import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getMysql, getPool } from '@/lib/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'pristine_jwt_atelier_secret_key_998811';

const ALL_PERMISSIONS = [
  'view_orders', 'edit_orders', 'update_order_status', 'assign_jobs', 
  'view_customers', 'manage_services', 'manage_pricing', 'manage_coupons', 
  'view_reports', 'download_invoices', 'manage_tickets', 'manage_staff', 
  'manage_roles', 'manage_email_templates', 'view_dashboard', 'manage_cms', 
  'manage_settings', 'view_slots', 'view_staff_jobs'
];

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('pristine_admin_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session token.' }, { status: 401 });
    }

    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ success: false, error: 'Database connection failed.' }, { status: 500 });
    }

    let permissions: string[] = [];
    let roleName = 'Super Admin';

    const { data: roleList } = await mysqlClient
      .from('roles')
      .select('*')
      .eq('id', decoded.role_id);
    
    const roleObj = roleList?.[0];
    if (roleObj && roleObj.is_active) {
      roleName = roleObj.name;
      const pool = getPool();
      const [rpRows] = await pool.query(`
        SELECT p.name AS permission_name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [decoded.role_id]);
      permissions = (rpRows as any[]).map(r => r.permission_name);
    } else {
      // Fallback defaults
      if (decoded.role_id === 1 || String(decoded.role_id) === '1' || decoded.type === 'admin') {
        roleName = 'Super Admin';
        permissions = ALL_PERMISSIONS;
      } else if (decoded.role_id === 4 || String(decoded.role_id) === '4') {
        roleName = 'Field Staff';
        permissions = ['view_staff_jobs'];
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        type: decoded.type,
        role_id: decoded.role_id,
        role_name: roleName,
        permissions
      }
    });
  } catch (err: any) {
    console.error('Session error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
