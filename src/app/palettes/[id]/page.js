import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import PaletteDetail from "@/components/PaletteDetail";

export default async function PaletteDetailPage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the specific palette with colors
  const palette = await prisma.palette.findUnique({
    where: {
      id: params.id,
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

  const formattedDate = new Date(palette.updatedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return <PaletteDetail palette={palette} formattedDate={formattedDate} />;
}
