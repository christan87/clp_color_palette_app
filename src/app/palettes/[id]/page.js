import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditPalette from "@/components/EditPalette";

export default async function PaletteDetailPage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  // Fetch the specific palette with colors
  const palette = await prisma.palette.findUnique({
    where: {
      id,
    },
    include: {
      colors: true,
    },
  });

  // Check if palette exists and belongs to the user
  if (!palette) {
    notFound();
  }

  if (palette.userId !== session.user.id) {
    redirect("/palettes");
  }

  // Serialize the palette data for client component
  const serializedPalette = {
    ...palette,
    createdAt: palette.createdAt.toISOString(),
    updatedAt: palette.updatedAt.toISOString(),
    colors: palette.colors.map(color => ({
      ...color,
      createdAt: color.createdAt.toISOString(),
      updatedAt: color.updatedAt.toISOString(),
    })),
  };

  return <EditPalette palette={serializedPalette} />;
}
