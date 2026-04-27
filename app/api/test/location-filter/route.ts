import { fetchEbayListingsViaApi } from "@/lib/ebay-api-service";

// Test endpoint to verify location filtering is working
// Usage: GET /api/test/location-filter?q=mavado&country=USA&testCount=10

interface TestResult {
  searchTerm: string;
  country: string;
  itemsFound: number;
  items: Array<{
    itemId: string;
    title: string;
    location: string;
    price: number;
    posted: string;
  }>;
  locationSummary: {
    usaItems: number;
    usaPercentage: number;
    uniqueLocations: string[];
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "mavado";
  const country = searchParams.get("country") || "USA";

  try {
    console.log(`[Location Filter Test] Testing search for "${query}" with ${country} location filter`);

    const items = await fetchEbayListingsViaApi(query, country, "newlyListed");

    console.log(`[Location Filter Test] Found ${items.length} items`);

    // Analyze locations
    const usaItems = items.filter(
      (item) =>
        item.location.includes("US") ||
        item.location.includes("USA") ||
        item.location.includes("United States")
    );

    const uniqueLocations = [...new Set(items.map((item) => item.location))];

    const result: TestResult = {
      searchTerm: query,
      country,
      itemsFound: items.length,
      items: items.slice(0, 10).map((item) => ({
        itemId: item.itemId,
        title: item.title.substring(0, 60),
        location: item.location,
        price: item.price,
        posted: item.postedTime,
      })),
      locationSummary: {
        usaItems: usaItems.length,
        usaPercentage: items.length > 0 ? Math.round((usaItems.length / items.length) * 100) : 0,
        uniqueLocations: uniqueLocations.slice(0, 20),
      },
    };

    console.log(`[Location Filter Test] Summary:`, result.locationSummary);

    return Response.json(result);
  } catch (error) {
    console.error("[Location Filter Test] Error:", error);
    return Response.json(
      { error: "Test failed", details: String(error) },
      { status: 500 }
    );
  }
}
