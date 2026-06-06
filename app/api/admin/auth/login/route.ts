import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getMysql } from '@/lib/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'pristine_jwt_atelier_secret_key_998811';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ success: false, error: 'Database connection not initialized.' }, { status: 500 });
    }

    // 1. Search in users (administrators & staff)
    const { data: usersList } = await mysqlClient
      .from('users')
      .select('*')
      .eq('email', email);

    let userObj: any = null;
    let userType: 'admin' | 'staff' = 'staff';
    let roleId: number | null = null;
    let isMatch = false;

    const dbUser = usersList?.[0];
    if (dbUser && dbUser.is_active && dbUser.role_id) {
      userObj = dbUser;
      roleId = Number(dbUser.role_id);
      userType = (roleId === 1 || dbUser.is_admin) ? 'admin' : 'staff';
      
      if (dbUser.password_hash) {
        if (dbUser.password_hash === 'admin' && password === 'admin') {
          isMatch = true;
        } else {
          isMatch = await bcrypt.compare(password, dbUser.password_hash);
        }
      }
    }

    if (!isMatch || !userObj) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }

    // Load permissions for JWT embedding
    let permissions: string[] = [];
    const ALL_PERMISSIONS = [
      'view_orders', 'edit_orders', 'update_order_status', 'assign_jobs', 
      'view_customers', 'manage_services', 'manage_pricing', 'manage_coupons', 
      'view_reports', 'download_invoices', 'manage_tickets', 'manage_staff', 
      'manage_roles', 'manage_email_templates', 'view_dashboard', 'manage_cms', 
      'manage_settings', 'view_slots', 'view_staff_jobs'
    ];

    if (roleId === 1 || userType === 'admin') {
      permissions = ALL_PERMISSIONS;
    } else if (roleId) {
      try {
        const { getPool } = await import('@/lib/mysql');
        const pool = getPool();
        const [rpRows] = await pool.query(`
          SELECT p.name AS permission_name 
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = ?
        `, [roleId]);
        permissions = (rpRows as any[]).map(r => r.permission_name);
      } catch (e) {
        console.error('Failed to load permissions during login:', e);
        if (roleId === 4 || String(roleId) === '4') {
          permissions = ['view_staff_jobs'];
        }
      }
    }

    // Fetch role name to match the /me endpoint
    let roleName = 'Super Admin';
    if (roleId) {
      const { data: roleList } = await mysqlClient.from('roles').select('*').eq('id', roleId);
      if (roleList && roleList[0]) {
        roleName = roleList[0].name;
      } else if (roleId === 4 || String(roleId) === '4') {
        roleName = 'Field Staff';
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        type: userType,
        role_id: roleId,
        role_name: roleName,
        permissions: permissions
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set token in HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        type: userType,
        role_id: roleId,
        role_name: roleName,
        permissions: permissions
      }
    });

    response.cookies.set('pristine_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    });

    // Also set old plaintext cookie for backwards compatibility if needed in client dashboard views
    response.cookies.set('pristine_user_id', String(userObj.id), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
