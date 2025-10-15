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
    const { name, schemeType, colorIds } = await request.json();

    // Validate required fields
    if (!name || !schemeType || !colorIds || colorIds.length === 0) {
      return NextResponse.json(
        { error: 'Name, scheme type, and colors are required' },
        { status: 400 }
      );
    }

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

    // Get old color IDs to determine which colors were removed
    const oldColorIds = palette.colorIds;
    const removedColorIds = oldColorIds.filter(colorId => !colorIds.includes(colorId));
    const addedColorIds = colorIds.filter(colorId => !oldColorIds.includes(colorId));

    // Update the palette
    const updatedPalette = await prisma.palette.update({
      where: { id },
      data: {
        name,
        schemeType,
        colorIds,
      },
      include: {
        colors: true,
      },
    });

    // Add palette ID to newly added colors
    if (addedColorIds.length > 0) {
      await Promise.all(
        addedColorIds.map((colorId) =>
          prisma.color.update({
            where: { id: colorId },
            data: {
              paletteIds: {
                push: id,
              },
            },
          })
        )
      );
    }

    // Remove palette ID from removed colors and delete if no palettes remain
    if (removedColorIds.length > 0) {
      await Promise.all(
        removedColorIds.map(async (colorId) => {
          const color = await prisma.color.findUnique({
            where: { id: colorId },
          });

          if (color) {
            const updatedPaletteIds = color.paletteIds.filter(pid => pid !== id);

            if (updatedPaletteIds.length === 0) {
              // Delete color if no palettes reference it
              await prisma.color.delete({
                where: { id: colorId },
              });
            } else {
              // Update color's paletteIds
              await prisma.color.update({
                where: { id: colorId },
                data: {
                  paletteIds: updatedPaletteIds,
                },
              });
            }
          }
        })
      );
    }

    return NextResponse.json(updatedPalette);
  } catch (error) {
    console.error('Error updating palette:', error);
    return NextResponse.json(
      { error: 'Failed to update palette' },
      { status: 500 }
    );
  }
}

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

    // Get all color IDs from the palette before deletion
    const colorIds = palette.colorIds;

    // Delete the palette
    await prisma.palette.delete({
      where: { id },
    });

    // Remove palette ID from all colors and delete orphaned colors
    await Promise.all(
      colorIds.map(async (colorId) => {
        const color = await prisma.color.findUnique({
          where: { id: colorId },
        });

        if (color) {
          const updatedPaletteIds = color.paletteIds.filter(pid => pid !== id);

          if (updatedPaletteIds.length === 0) {
            // Delete color if no palettes reference it
            await prisma.color.delete({
              where: { id: colorId },
            });
          } else {
            // Update color's paletteIds
            await prisma.color.update({
              where: { id: colorId },
              data: {
                paletteIds: updatedPaletteIds,
              },
            });
          }
        }
      })
    );

    return NextResponse.json({ message: 'Palette deleted successfully' });
  } catch (error) {
    console.error('Error deleting palette:', error);
    return NextResponse.json(
      { error: 'Failed to delete palette' },
      { status: 500 }
    );
  }
}
