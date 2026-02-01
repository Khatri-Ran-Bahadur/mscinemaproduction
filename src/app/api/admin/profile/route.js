
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const { name, email, currentPassword, newPassword } = body;
    let token = body.token;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized', message: 'Token missing' }, { status: 401 });
    }

    // Decode token to get admin ID (format: id:timestamp)
    const decodedString = Buffer.from(token, 'base64').toString();
    const [adminId, timestamp] = decodedString.split(':');

    if (!adminId) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
        where: { id: parseInt(adminId) }
    });

    if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Verify current password only if changing password
    if (newPassword) {
        if (!currentPassword) {
            return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
        }
        
        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (newPassword) {
        updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update admin
    const updatedAdmin = await prisma.admin.update({
        where: { id: admin.id },
        data: updateData
    });

    // Remove password from response
    const { password: removedPassword, ...adminData } = updatedAdmin;

    return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        admin: adminData
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
