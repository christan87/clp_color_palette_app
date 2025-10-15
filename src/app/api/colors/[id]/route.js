import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, hex, rgb, hsl, cmyk, company, code } = await request.json();

    // Validate required fields
    if (!hex || !rgb || !hsl || !cmyk) {
      return NextResponse.json(
        { error: 'Hex, RGB, HSL, and CMYK are required' },
        { status: 400 }
      );
    }

    // Update the color
    const color = await prisma.color.update({
      where: { id },
      data: {
        name: name || null,
        hex,
        rgb,
        hsl,
        cmyk,
        company: company || null,
        code: code || null,
      },
    });

    return NextResponse.json(color);
  } catch (error) {
    console.error('Error updating color:', error);
    return NextResponse.json(
      { error: 'Failed to update color' },
      { status: 500 }
    );
  }
}
