import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getMysql, getPool } from './mysql';
import { getDbAsync } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'pristine_jwt_atelier_secret_key_998811';

export interface DecodedToken {
  id: number;
  name: string;
  email: string;
  type: 'admin' | 'staff';
  role_id: number;
}

export async function verifyAdminSession(req: NextRequest): Promise<DecodedToken | null> {
  const token = req.cookies.get('pristine_admin_token')?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function checkPermission(roleId: number, permissionName: string): Promise<boolean> {
  // Super Admin (role_id = 1) has all permissions
  if (roleId === 1) return true;

  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const pool = getPool();
      const [rows] = await pool.query(`
        SELECT p.name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.name = ?
      `, [roleId, permissionName]);

      if (Array.isArray(rows) && rows.length > 0) {
        return true;
      }
    }
  } catch (err) {
    console.error('[authMiddleware] DB permission check error:', err);
  }

  // Fallback to local JSON DB
  try {
    const db = await getDbAsync();
    const roleObj = db.roles.find(r => Number(r.id) === roleId);
    if (!roleObj) return false;
    return roleObj.permissions.includes(permissionName);
  } catch (err) {
    console.error('[authMiddleware] Fallback check error:', err);
    return false;
  }
}

export async function authorize(req: NextRequest, permissionName?: string) {
  const user = await verifyAdminSession(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized. Administrative session required.' }, { status: 401 }),
      user: null
    };
  }

  if (permissionName) {
    const isGranted = await checkPermission(user.role_id, permissionName);
    if (!isGranted) {
      return {
        authorized: false,
        response: NextResponse.json({ error: `Forbidden. Missing required permission: ${permissionName}` }, { status: 403 }),
        user
      };
    }
  }

  return {
    authorized: true,
    response: null,
    user
  };
}
