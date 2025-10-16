import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Get friend requests for current user
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(friendRequests);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return NextResponse.json({ error: "Failed to fetch friend requests" }, { status: 500 });
  }
}

// Accept or reject friend request
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 });
    }

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    // Verify the current user is the receiver
    if (friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "accept") {
      // Update friend request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // Add each user to the other's friend list
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          friendIds: {
            push: friendRequest.senderId,
          },
        },
      });

      await prisma.user.update({
        where: { id: friendRequest.senderId },
        data: {
          friendIds: {
            push: session.user.id,
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Friend request accepted" 
      });
    } else {
      // Reject the request
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ 
        success: true, 
        message: "Friend request rejected" 
      });
    }
  } catch (error) {
    console.error("Error handling friend request:", error);
    return NextResponse.json({ error: "Failed to handle friend request" }, { status: 500 });
  }
}
