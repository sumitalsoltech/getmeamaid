import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    
    // Clear token cookies
    response.cookies.set('pristine_admin_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('pristine_user_id', '', { maxAge: 0, path: '/' });
    
    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
