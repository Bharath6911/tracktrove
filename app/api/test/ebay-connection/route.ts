import { NextResponse } from "next/server";
import { verifyEbayApiConnection } from "@/lib/ebay-api-service";

/**
 * GET /api/test/ebay-connection
 * Tests the eBay API connection and returns status
 * This endpoint can be called to verify that the eBay API integration is working
 */
export async function GET() {
  try {
    console.log("[Test] Starting eBay connection test...");

    // Test the connection
    const isConnected = await verifyEbayApiConnection();

    if (isConnected) {
      return NextResponse.json(
        {
          status: "ok",
          message: "eBay API connection is working",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "eBay API connection test returned no results",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("[Test] Connection test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to test eBay API connection",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
