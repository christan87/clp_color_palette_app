import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Send friend request
export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    if (friendId === session.user.id) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already friends
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { friendIds: true },
    });

    if (currentUser.friendIds.includes(friendId)) {
      return NextResponse.json({ error: "Already friends with this user" }, { status: 400 });
    }

    // Check if friend request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: friendId },
          { senderId: friendId, receiverId: session.user.id },
        ],
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Friend request already exists" }, { status: 400 });
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: friendId,
        status: "PENDING",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Friend request sent successfully",
      friendRequest 
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}

// Remove friend
export async function DELETE(request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    // Get both users' data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { friendIds: true, followingIds: true, followerIds: true },
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: friendId },
      select: { friendIds: true, followingIds: true, followerIds: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove friend from both users' friend lists AND follower/following lists
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        friendIds: currentUser.friendIds.filter(id => id !== friendId),
        followingIds: currentUser.followingIds.filter(id => id !== friendId),
        followerIds: currentUser.followerIds.filter(id => id !== friendId),
      },
    });

    await prisma.user.update({
      where: { id: friendId },
      data: {
        friendIds: targetUser.friendIds.filter(id => id !== session.user.id),
        followingIds: targetUser.followingIds.filter(id => id !== session.user.id),
        followerIds: targetUser.followerIds.filter(id => id !== session.user.id),
      },
    });

    return NextResponse.json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
