import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if palette exists and belongs to user
    const palette = await prisma.palette.findUnique({
      where: { id },
    });

    if (!palette) {
      return NextResponse.json({ error: 'Palette not found' }, { status: 404 });
    }

    if (palette.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the palette
    await prisma.palette.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Palette deleted successfully' });
  } catch (error) {
    console.error('Error deleting palette:', error);
    return NextResponse.json(
      { error: 'Failed to delete palette' },
      { status: 500 }
    );
  }
}
