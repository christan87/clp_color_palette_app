import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ViewUserPalette from "@/components/ViewUserPalette";

export default async function UserPaletteViewPage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  // Fetch the specific palette with colors and user info
  const palette = await prisma.palette.findUnique({
    where: {
      id,
    },
    include: {
      colors: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          friendIds: true,
        },
      },
    },
  });

  // Check if palette exists
  if (!palette) {
    notFound();
  }

  // Check access permissions
  const isOwner = palette.userId === session.user.id;
  const isFriend = palette.user.friendIds.includes(session.user.id);
  const isPublic = palette.access === "PUBLIC";
  const isFriendsOnly = palette.access === "FRIENDS";

  // Redirect if user doesn't have permission to view
  if (!isOwner && !isPublic && !(isFriendsOnly && isFriend)) {
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
    user: {
      id: palette.user.id,
      name: palette.user.name,
      email: palette.user.email,
    },
  };

  return <ViewUserPalette palette={serializedPalette} currentUserId={session.user.id} />;
}
