import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ colors: [], palettes: [], users: [] });
    }

    const trimmedQuery = query.trim();
    const isUserSearch = trimmedQuery.startsWith('@');
    const searchTerm = isUserSearch ? trimmedQuery.slice(1) : trimmedQuery;

    let colors = [];
    let palettes = [];
    let users = [];

    if (isUserSearch) {
      // Search for users by name or email
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
          NOT: {
            id: session.user.id, // Exclude current user
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        take: 10,
      });
    } else {
      // Search for colors by name
      colors = await prisma.color.findMany({
        where: {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        take: 10,
      });

      // Search for palettes by name (only user's own palettes)
      palettes = await prisma.palette.findMany({
        where: {
          userId: session.user.id,
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        include: {
          colors: true,
        },
        take: 10,
      });
    }

    return NextResponse.json({ colors, palettes, users });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
