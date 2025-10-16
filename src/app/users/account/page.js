import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AccountSettings from "@/components/AccountSettings";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch user data with friends and followers
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
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
    redirect("/");
  }

  // Fetch friends data
  const friends = await prisma.user.findMany({
    where: {
      id: {
        in: user.friendIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  // Fetch followers data
  const followers = await prisma.user.findMany({
    where: {
      id: {
        in: user.followerIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  // Fetch following data
  const following = await prisma.user.findMany({
    where: {
      id: {
        in: user.followingIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  // Fetch pending friend requests
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: session.user.id,
      status: "PENDING",
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    friends,
    followers,
    following,
  };

  const serializedFriendRequests = friendRequests.map(req => ({
    ...req,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
  }));

  return <AccountSettings user={serializedUser} friendRequests={serializedFriendRequests} />;
}
