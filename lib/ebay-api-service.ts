// eBay API Service - Using OAuth 2.0 with Browse API
// See .env.local for configuration

interface BrowseApiItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
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
    url.searchParams.append("limit", "50");

    console.log(`[eBay Browse API] Request: ${url.toString().substring(0, 150)}...`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": marketId,
      },
    });

    console.log(`[eBay Browse API] Response status: ${response.status}`);

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

    console.log(`[eBay Browse API] Found ${data.itemSummaries.length} items`);

    // Transform Browse API items to our format
    const items: EbayApiItem[] = data.itemSummaries
      .map((item) => {
        try {
          const itemId = item.itemId;
          const title = item.title;
          const price = parseFloat(item.price.value);
          const currencyId = item.price.currency || "USD";
          const imageUrl = item.image?.imageUrl || "";
          const viewItemURL = item.itemWebUrl;
          const location = country;
          const listingType = "Buy Now"; // Browse API focuses on fixed-price items
          const seller = item.seller?.username || "eBay Seller";

          // Parse posting time - Browse API provides itemCreationDate
          const postedTime = item.itemCreationDate || new Date().toISOString();

          if (!itemId || !title || !viewItemURL || price === 0) {
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

    console.log(`[eBay Browse API] Successfully retrieved ${items.length} listings`);
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
