/**
 * Admin Login API
 * POST /api/admin/login
 * Body: { username, password }
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find admin by username or email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ]
      }
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return admin data (without password)
    const { password: _, ...adminData } = admin;

    // Create session token (in production, use JWT or session management)
    const sessionToken = Buffer.from(`${admin.id}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      admin: adminData,
      token: sessionToken,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed', message: error.message },
      { status: 500 }
    );
  }
}

