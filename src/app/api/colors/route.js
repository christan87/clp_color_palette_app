import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, hex, rgb, hsl, cmyk, company, code } = await request.json();

    // Validate required fields
    if (!name || !hex || !rgb || !hsl || !cmyk || !company || !code) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Create the color
    const color = await prisma.color.create({
      data: {
        name,
        hex,
        rgb,
        hsl,
        cmyk,
        company,
        code,
      },
    });

    return NextResponse.json(color, { status: 201 });
  } catch (error) {
    console.error('Error creating color:', error);
    return NextResponse.json(
      { error: 'Failed to create color' },
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

    const colors = await prisma.color.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}
