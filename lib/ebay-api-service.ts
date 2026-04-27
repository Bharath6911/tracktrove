// eBay API Service - Using OAuth 2.0 with Browse API
// See .env.local for configuration

interface BrowseApiItem {
  itemId: string;
  title: string;
  price: {
    value?: string;
    currency?: string;
  };
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  condition: string;
  seller?: {
    username: string;
  };
  itemCreationDate?: string;
  shippingOptions?: Array<{
    shippingCostType?: string;
    shippingCost?: { value: string };
  }>;
  // Location details from Shopping API enrichment
  itemLocation?: {
    city?: string;
    country?: string;
    state?: string;
  };
}

interface BrowseSearchResult {
  itemSummaries?: BrowseApiItem[];
  total?: number;
}

interface EbayApiItem {
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

// Cache for access tokens to avoid repeated API calls
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Load credentials from environment variables
function getEbayCredentials() {
  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;

  console.log("[eBay Creds] APP_ID exists:", !!appId, "first 10 chars:", appId?.substring(0, 10));
  console.log("[eBay Creds] CERT_ID exists:", !!certId, "first 10 chars:", certId?.substring(0, 10));

  if (!appId || !certId) {
    throw new Error(
      `Missing eBay credentials. APP_ID=${!!appId}, CERT_ID=${!!certId}`
    );
  }

  return { appId, certId };
}

const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_SHOPPING_API_URL = "https://open.api.ebay.com/shopping";

// Get OAuth access token for eBay API
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    console.log("[eBay Auth] Using cached token");
    return cachedAccessToken.token;
  }

  try {
    const { appId, certId } = getEbayCredentials();
    const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

    console.log("[eBay Auth] Requesting new OAuth token...");

    const response = await fetch(EBAY_AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[eBay Auth] Failed to get access token: ${response.statusText} - ${text.substring(0, 200)}`);
      return "";
    }

    const data = (await response.json()) as AccessTokenResponse;

    // Cache the token
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 60000, // Refresh 1 min before expiry
    };

    console.log("[eBay Auth] Successfully obtained new access token (expires in", data.expires_in, "seconds)");
    return data.access_token;
  } catch (error) {
    console.error("[eBay Auth] Error getting access token:", error);
    return "";
  }
}

// Map country names to eBay market IDs
function getEbayMarketId(country: string): string {
  const marketIdMap: Record<string, string> = {
    USA: "EBAY_US",
    UK: "EBAY_GB",
    Canada: "EBAY_CA",
    Australia: "EBAY_AU",
    Germany: "EBAY_DE",
    France: "EBAY_FR",
    India: "EBAY_IN",
  };
  return marketIdMap[country] || "EBAY_US";
}

// Map country names to eBay itemLocationCountry filter codes
function getItemLocationCountryCode(country: string): string {
  const locationMap: Record<string, string> = {
    USA: "US",
    UK: "GB",
    Canada: "CA",
    Australia: "AU",
    Germany: "DE",
    France: "FR",
    India: "IN",
  };
  return locationMap[country] || "US";
}

// Fetch listings from eBay Browse API
export async function fetchEbayListingsViaApi(
  searchTerm: string,
  country: string = "USA",
  sort: string = "12h"
): Promise<EbayApiItem[]> {
  try {
    console.log(`[eBay Browse API] Searching for "${searchTerm}" in ${country} (sort: ${sort})`);

    // Get OAuth token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.error("[eBay Browse API] Failed to get access token");
      return [];
    }

    const marketId = getEbayMarketId(country);
    const locationCountryCode = getItemLocationCountryCode(country);

    // Map sort parameter
    const sortMap: Record<string, string> = {
      newlyListed: "NEWLY_LISTED",
      "12h": "ENDING_SOON",
      ending: "ENDING_SOON",
      price: "PRICE_LOWEST_FIRST",
      priceDrop: "PRICE_LOWEST_FIRST",
    };
    const sortOrder = sortMap[sort] || "ENDING_SOON";

    // Build Browse API search URL
    const url = new URL(EBAY_BROWSE_API_URL);
    url.searchParams.append("q", searchTerm);
    url.searchParams.append("sort", sortOrder);
    url.searchParams.append("market_id", marketId);
    url.searchParams.append("limit", "100"); // Get more results, we'll filter client-side
    
    // Try filter with delivery country - items available for delivery to this country
    url.searchParams.append("filter", `deliveryCountry:{${locationCountryCode}}`);

    console.log(`[eBay Browse API] Searching "${searchTerm}" in ${country} (filter: deliveryCountry:{${locationCountryCode}})`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": marketId,
      },
    });

    console.log(`[eBay Browse API] Response status: ${response.status}`);
    console.log(`[eBay Browse API] Full URL: ${url.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[eBay Browse API] Search failed: ${response.statusText} - ${text.substring(0, 200)}`);
      return [];
    }

    const data = (await response.json()) as BrowseSearchResult;

    if (!data.itemSummaries || data.itemSummaries.length === 0) {
      console.log("[eBay Browse API] No items found");
      return [];
    }

    console.log(`[eBay Browse API] Found ${data.itemSummaries.length} items before filtering`);
    
    // Log first few items to see their locations
    data.itemSummaries.slice(0, 3).forEach((item, idx) => {
      console.log(`[eBay Browse API] Item ${idx + 1} location:`, item.itemLocation);
    });

    // Transform Browse API items to our format
    const items: EbayApiItem[] = data.itemSummaries
      .map((item) => {
        try {
          const itemId = item.itemId;
          const title = item.title;
          
          // Better price handling - skip items without price
          const priceValue = item.price?.value;
          if (!priceValue) {
            console.warn(`[eBay Browse API] Item ${itemId} missing price, skipping`);
            return null;
          }
          
          const price = parseFloat(priceValue);
          if (isNaN(price) || price <= 0) {
            console.warn(`[eBay Browse API] Item ${itemId} has invalid price: ${priceValue}, skipping`);
            return null;
          }
          
          const currencyId = item.price?.currency || "USD";
          const imageUrl = item.image?.imageUrl || "";
          const viewItemURL = item.itemWebUrl;
          const listingType = "Buy Now";
          const seller = item.seller?.username || "eBay Seller";

          // Build location string from item details or fall back to country
          let location = country;
          let itemCountry = country;
          
          if (item.itemLocation) {
            const parts = [];
            if (item.itemLocation.city) parts.push(item.itemLocation.city);
            if (item.itemLocation.state) parts.push(item.itemLocation.state);
            if (item.itemLocation.country) {
              parts.push(item.itemLocation.country);
              // Extract country code from full name for filtering
              itemCountry = item.itemLocation.country;
            }
            location = parts.length > 0 ? parts.join(", ") : country;
            console.log(`[eBay Browse API] Item ${itemId} - Location: "${location}", Country: "${itemCountry}"`);
          }

          // CLIENT-SIDE FILTER: Only include items from the selected country
          // Map country names to check against
          const countryCheckMap: Record<string, string[]> = {
            USA: ["United States", "US", "USA"],
            UK: ["United Kingdom", "GB", "UK"],
            Australia: ["Australia", "AU"],
            Canada: ["Canada", "CA"],
            Germany: ["Germany", "DE"],
            France: ["France", "FR"],
            India: ["India", "IN"],
          };

          const acceptedCountries = countryCheckMap[country] || [country];
          const isCorrectCountry = acceptedCountries.some(
            (c) => itemCountry.includes(c) || location.includes(c)
          );

          if (!isCorrectCountry) {
            console.log(`[eBay Browse API] Item ${itemId} filtered out - not from ${country}`);
            return null;
          }

          // Parse posting time
          const postedTime = item.itemCreationDate || new Date().toISOString();

          if (!itemId || !title || !viewItemURL) {
            return null;
          }

          return {
            itemId,
            title,
            price,
            currencyId,
            location,
            listingType,
            imageUrl,
            viewItemURL,
            postedTime,
            seller,
          } as EbayApiItem;
        } catch (err) {
          console.error("[eBay Browse API] Error parsing item:", err);
          return null;
        }
      })
      .filter((item): item is EbayApiItem => item !== null)
      .slice(0, 50);

    console.log(`[eBay Browse API] After country filter: ${items.length} items`);
    return items;
  } catch (error) {
    console.error("[eBay Browse API] Error:", error instanceof Error ? error.message : error);
    return [];
  }
}

// Verify eBay API connection
export async function verifyEbayApiConnection(): Promise<boolean> {
  try {
    console.log("[eBay Browse API] Verifying connection...");
    const result = await fetchEbayListingsViaApi("test", "USA", "12h");
    const isConnected = result.length > 0;

    if (isConnected) {
      console.log("[eBay Browse API] ✓ Connection verified - API is working");
    } else {
      console.log("[eBay Browse API] ⚠ Connection test returned no results");
    }

    return isConnected;
  } catch (error) {
    console.error("[eBay Browse API] ✗ Connection verification failed:", error);
    return false;
  }
}
