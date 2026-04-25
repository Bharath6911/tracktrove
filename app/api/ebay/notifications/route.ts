import { NextRequest, NextResponse } from "next/server";

// eBay Event Notification Configuration
// This endpoint handles:
// 1. Challenge verification from eBay
// 2. Marketplace Account Deletion notifications
// 3. Other event notifications

const VERIFICATION_TOKEN = process.env.EBAY_NOTIFICATION_TOKEN || "";

// Response format for eBay challenges
interface ChallengeResponse {
  challengeResponse: string;
}

// Event notification payload
interface EventNotification {
  metadata?: {
    topic?: string;
    schemaVersion?: string;
  };
  notification?: {
    data?: {
      accountDeletion?: {
        userId?: string;
        deletedDate?: string;
      };
    };
  };
}

/**
 * POST /api/ebay/notifications
 * Receives event notifications from eBay
 */
export async function POST(request: NextRequest) {
  try {
    // Get verification token from headers
    const verificationToken = request.headers.get("x-ebay-signature");

    console.log("[eBay Notifications] Received POST request");
    console.log(
      `[eBay Notifications] Verification token in headers: ${verificationToken ? "yes" : "no"}`
    );

    // Get the body as JSON
    const body = await request.json() as ChallengeResponse | EventNotification;

    // Check if this is a challenge verification request
    if ("challengeResponse" in body && body.challengeResponse) {
      console.log("[eBay Notifications] Challenge verification request detected");
      // eBay sends a challenge, we need to echo it back
      return NextResponse.json(
        {
          challengeResponse: body.challengeResponse,
        },
        { status: 200 }
      );
    }

    // Check if this is an event notification
    if ("notification" in body && body.notification) {
      const notification = body.notification as EventNotification["notification"];

      console.log(
        `[eBay Notifications] Event notification: ${JSON.stringify(notification)}`
      );

      // Handle marketplace account deletion
      if (notification?.data?.accountDeletion) {
        const deletion = notification.data.accountDeletion;
        console.log(
          `[eBay Notifications] Account deletion request for user: ${deletion.userId}`
        );
        console.log(`[eBay Notifications] Deleted date: ${deletion.deletedDate}`);

        // TODO: Implement account deletion logic
        // - Remove all bookmarks for this user
        // - Remove all stored listings for this user
        // - Log the deletion for compliance

        return NextResponse.json(
          { status: "account_deletion_processed" },
          { status: 200 }
        );
      }

      // Generic event notification
      console.log("[eBay Notifications] Generic event received");
      return NextResponse.json(
        { status: "event_received" },
        { status: 200 }
      );
    }

    console.warn("[eBay Notifications] Unknown notification format");
    return NextResponse.json(
      { error: "Invalid notification format" },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "[eBay Notifications] Error processing notification:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to process notification" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ebay/notifications
 * eBay sends a GET request with a challenge parameter during verification
 * This is used to verify that the endpoint is accessible
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const challenge = searchParams.get("challenge");

    console.log("[eBay Notifications] Received GET request");

    if (challenge) {
      console.log("[eBay Notifications] Challenge verification via GET");
      console.log(`[eBay Notifications] Challenge value: ${challenge}`);

      // Echo back the challenge with verification token
      // eBay expects the response to contain the challenge value
      return NextResponse.json(
        {
          challengeResponse: challenge,
        },
        { status: 200 }
      );
    }

    console.log("[eBay Notifications] Health check request");
    return NextResponse.json(
      {
        status: "ok",
        message: "eBay notification endpoint is active",
        version: "1.0",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[eBay Notifications] Error processing GET request:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/ebay/notifications
 * Used by eBay to check endpoint availability
 */
export async function HEAD() {
  console.log("[eBay Notifications] HEAD request received");
  return new NextResponse(null, { status: 200 });
}
