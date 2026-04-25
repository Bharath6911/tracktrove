import { fetchEbayListingsViaApi } from "@/lib/ebay-api-service";

// eBay API endpoint
// Fetches real listings from eBay using official Finding Service API

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
    // Use official eBay Finding Service API
    const items = await fetchEbayListingsViaApi(query, country, sortBy);

    return Response.json({
      items,
      total: items.length,
    } as EbaySearchResponse);
  } catch (error) {
    console.error("eBay API error:", error);
    return Response.json(
      { error: "Failed to fetch eBay listings", details: String(error) },
      { status: 500 }
    );
  }
}
