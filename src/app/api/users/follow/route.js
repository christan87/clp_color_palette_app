import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Follow a user
export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add current user to target user's followers
    await prisma.user.update({
      where: { id: userId },
      data: {
        followerIds: {
          push: session.user.id,
        },
      },
    });

    // Add target user to current user's following
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        followingIds: {
          push: userId,
        },
      },
    });

    return NextResponse.json({ success: true, message: "User followed successfully" });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

// Unfollow a user
export async function DELETE(request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { followingIds: true },
    });

    // Get target user data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { followerIds: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove current user from target user's followers
    await prisma.user.update({
      where: { id: userId },
      data: {
        followerIds: targetUser.followerIds.filter(id => id !== session.user.id),
      },
    });

    // Remove target user from current user's following
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        followingIds: currentUser.followingIds.filter(id => id !== userId),
      },
    });

    return NextResponse.json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}
