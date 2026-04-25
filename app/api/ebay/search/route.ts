import { fetchEbayListingsViaApi } from "@/lib/ebay-api-service";

// eBay Browse API endpoint
// Fetches real listings from eBay using OAuth 2.0 Browse API

interface EbayItem {
  itemId: string;
  title: string;
  price: number;
  currencyId: string;
  location: string;
  listingType: string;
  imageUrl: string;
  viewItemURL: string;
  postedTime: string;
  seller?: string;
}

interface EbaySearchResponse {
  items: EbayItem[];
  total: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const country = searchParams.get("country") || "USA";
  const sortBy = searchParams.get("sort") || "12h";

  if (!query) {
    return Response.json({ error: "Query parameter required" }, { status: 400 });
  }

  try {
    console.log(`[Browse API Search] q="${query}", country="${country}", sort="${sortBy}"`);
    
    // Use official eBay Browse API with OAuth 2.0
    const items = await fetchEbayListingsViaApi(query, country, sortBy);
    
    console.log(`[Browse API Search] Got ${items.length} items`);

    return Response.json({
      items,
      total: items.length,
    } as EbaySearchResponse);
  } catch (error) {
    console.error("eBay Browse API error:", error);
    return Response.json(
      { error: "Failed to fetch eBay listings", details: String(error) },
      { status: 500 }
    );
  }
}
