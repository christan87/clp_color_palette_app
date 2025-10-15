import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, schemeType, colorIds, access = 'PRIVATE' } = await request.json();

    // Validate required fields
    if (!name || !schemeType || !colorIds || colorIds.length === 0) {
      return NextResponse.json(
        { error: 'Name, scheme type, and colors are required' },
        { status: 400 }
      );
    }

    // Validate access field
    if (!['PUBLIC', 'PRIVATE', 'FRIENDS'].includes(access)) {
      return NextResponse.json(
        { error: 'Access must be PUBLIC, PRIVATE, or FRIENDS' },
        { status: 400 }
      );
    }

    // Create the palette
    const palette = await prisma.palette.create({
      data: {
        name,
        schemeType,
        colorIds,
        access,
        userId: session.user.id,
      },
      include: {
        colors: true,
      },
    });

    // Update each color's paletteIds to include this new palette
    await Promise.all(
      colorIds.map((colorId) =>
        prisma.color.update({
          where: { id: colorId },
          data: {
            paletteIds: {
              push: palette.id,
            },
          },
        })
      )
    );

    return NextResponse.json(palette, { status: 201 });
  } catch (error) {
    console.error('Error creating palette:', error);
    return NextResponse.json(
      { error: 'Failed to create palette' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const palettes = await prisma.palette.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        colors: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(palettes);
  } catch (error) {
    console.error('Error fetching palettes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch palettes' },
      { status: 500 }
    );
  }
}
