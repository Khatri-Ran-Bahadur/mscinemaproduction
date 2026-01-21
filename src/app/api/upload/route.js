import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const oldImage = formData.get('oldImage');

    if (!file) {
      return NextResponse.json(
        { error: 'No file received.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + '_' + file.name.replaceAll(" ", "_");
    const uploadDir = path.join(process.cwd(), 'public/uploads'); 
    
    // Save new file
    await writeFile(
      path.join(uploadDir, filename),
      buffer
    );

    // Delete old file if provided
    if (oldImage) {
      try {
        const url = new URL(oldImage);
        const oldFilename = path.basename(url.pathname);
        const oldFilePath = path.join(uploadDir, oldFilename);
        
        // Only delete if it's in the uploads directory
        if (oldImage.includes('/uploads/')) {
            await unlink(oldFilePath).catch((err) => {
                console.warn(`Failed to delete old image ${oldFilePath}:`, err.message);
            });
        }
      } catch (e) {
        // If oldImage is not a valid URL (e.g. relative path), handle simpler case
         if (oldImage.includes('/uploads/')) {
            const oldFilename = path.basename(oldImage);
            const oldFilePath = path.join(uploadDir, oldFilename);
            await unlink(oldFilePath).catch((err) => {
                console.warn(`Failed to delete old image ${oldFilePath}:`, err.message);
            });
        }
      }
    }

    // specific base URL logic
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fileUrl = `${origin}/uploads/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: fileUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    );
  }
}
