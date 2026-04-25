import { fetchEbayListingsViaApi } from "@/lib/ebay-api-service";

export async function GET() {
  try {
    console.log("[TEST] Starting eBay API test...");
    
    const items = await fetchEbayListingsViaApi("watch", "USA", "12h");
    
    console.log(`[TEST] Got ${items.length} items`);
    if (items.length > 0) {
      console.log(`[TEST] First item:`, items[0]);
    }

    return Response.json({
      success: true,
      itemCount: items.length,
      firstItem: items[0] || null,
      rawItems: items,
    });
  } catch (error) {
    console.error("[TEST] Error:", error);
    return Response.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
