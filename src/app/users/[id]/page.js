import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import UserProfile from "@/components/UserProfile";

export default async function UserProfilePage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  // Redirect to account page if viewing own profile
  if (id === session.user.id) {
    redirect("/users/account");
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      friendIds: true,
      followingIds: true,
      followerIds: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch user's palettes based on access permissions
  const isFriend = user.friendIds.includes(session.user.id);
  
  const palettes = await prisma.palette.findMany({
    where: {
      userId: id,
      OR: [
        { access: "PUBLIC" },
        ...(isFriend ? [{ access: "FRIENDS" }] : []),
      ],
    },
    include: {
      colors: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Serialize data
  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };

  const serializedPalettes = palettes.map(palette => ({
    ...palette,
    createdAt: palette.createdAt.toISOString(),
    updatedAt: palette.updatedAt.toISOString(),
    colors: palette.colors.map(color => ({
      ...color,
      createdAt: color.createdAt.toISOString(),
      updatedAt: color.updatedAt.toISOString(),
    })),
  }));

  return (
    <UserProfile
      user={serializedUser}
      palettes={serializedPalettes}
      currentUserId={session.user.id}
      isFriend={isFriend}
      isFollowing={user.followerIds.includes(session.user.id)}
    />
  );
}
