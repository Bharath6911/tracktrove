import { fetchEbayListingsViaApi } from "@/lib/ebay-api-service";

export async function GET() {
  try {
    console.log("[TEST] Starting eBay API test...");
    
    // Make raw API request to see what's happening
    const appId = process.env.EBAY_APP_ID;
    
    const params = new URLSearchParams({
      "OPERATION-NAME": "findItemsAdvanced",
      "SERVICE-VERSION": "1.0.0",
      SECURITY_APPNAME: appId || "",
      "GLOBAL-ID": "EBAY-US",
      keywords: "watch",
      "sortOrder": "EndTimeSoonest",
      "paginationInput.entriesPerPage": "10",
      "outputSelector": "SellerInfo,GalleryInfo",
      "itemFilter(0).name": "ListingType",
      "itemFilter(0).value": "All",
      "responseFormat": "JSON",
    });
    
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${params.toString()}`;
    
    console.log(`[TEST] Calling: ${url.substring(0, 150)}...`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });
    
    const text = await response.text();
    
    console.log(`[TEST] Response status: ${response.status}`);
    console.log(`[TEST] Response length: ${text.length}`);
    console.log(`[TEST] Response preview: ${text.substring(0, 300)}`);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    
    // Also try the formatted version
    const items = await fetchEbayListingsViaApi("watch", "USA", "12h");

    return Response.json({
      success: true,
      rawResponseStatus: response.status,
      rawResponseLength: text.length,
      rawResponsePreview: text.substring(0, 500),
      parsedResponse: data,
      formattedItemCount: items.length,
      formattedItems: items,
    });
  } catch (error) {
    console.error("[TEST] Error:", error);
    return Response.json({
      success: false,
      error: String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    }, { status: 500 });
  }
}
