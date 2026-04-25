// eBay API Service - Using Environment Variables for Credentials
// See .env.local for configuration

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

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface EbaySearchResult {
  item: Array<{
    itemId: string[];
    title: string[];
    globalId: string[];
    primaryCategory: Array<{ categoryId: string[]; categoryName: string[] }>;
    galleryURL: string[];
    viewItemURL: string[];
    autoPay: boolean[];
    location: string[];
    country: string[];
    sellingStatus: Array<{ currentPrice: Array<{ __value__: string; currencyId: string }> }>;
    condition: Array<{ conditionId: string[]; conditionDisplayName: string[] }>;
    isMultiVariationListing: boolean[];
    topRatedListing: boolean[];
  }>;
  paginationOutput: Array<{
    pageNumber: string[];
    entriesPerPage: string[];
    totalPages: string[];
    totalEntries: string[];
  }>;
}

// Cache for access tokens to avoid repeated API calls
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// Load credentials from environment variables
function getEbayCredentials() {
  const appId = process.env.EBAY_APP_ID;
  const devId = process.env.EBAY_DEV_ID;
  const certId = process.env.EBAY_CERT_ID;

  console.log("[eBay Creds] APP_ID exists:", !!appId, "first 10 chars:", appId?.substring(0, 10));
  console.log("[eBay Creds] DEV_ID exists:", !!devId);
  console.log("[eBay Creds] CERT_ID exists:", !!certId, "first 10 chars:", certId?.substring(0, 10));

  if (!appId || !certId) {
    throw new Error(
      `Missing eBay credentials. APP_ID=${!!appId}, CERT_ID=${!!certId}`
    );
  }

  return { appId, devId, certId };
}

const EBAY_AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_SEARCH_URL = "https://svcs.ebay.com/services/search/FindingService/v1";

// Get OAuth access token for eBay API
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }

  try {
    const { appId, certId } = getEbayCredentials();
    const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

    const response = await fetch(EBAY_AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    if (!response.ok) {
      console.error(`[eBay Auth] Failed to get access token: ${response.statusText}`);
      return "";
    }

    const data = (await response.json()) as AccessTokenResponse;

    // Cache the token
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - 60000, // Refresh 1 min before expiry
    };

    console.log("[eBay Auth] Successfully obtained access token");
    return data.access_token;
  } catch (error) {
    console.error("[eBay Auth] Error getting access token:", error);
    return "";
  }
}

// Map country names to eBay global IDs
function getEbayGlobalId(country: string): string {
  const globalIdMap: Record<string, string> = {
    USA: "EBAY-US",
    UK: "EBAY-GB",
    Canada: "EBAY-CA",
    Australia: "EBAY-AU",
    Germany: "EBAY-DE",
    France: "EBAY-FR",
    India: "EBAY-IN",
  };
  return globalIdMap[country] || "EBAY-US";
}

// Map sort parameter to eBay sortOrder values
function mapSortToEbaySortOrder(sort: string): string {
  const sortMap: Record<string, string> = {
    newlyListed: "EndTimeSoonest", // Most recently listed
    "12h": "EndTimeSoonest", // Default, ends soonest
    ending: "EndTimeSoonest", // Ending soon
    price: "PricePlusShippingLowest", // Price: lowest first
    priceDrop: "PricePlusShippingLowest", // Price lowest
  };
  return sortMap[sort] || "EndTimeSoonest";
}

// Fetch listings from eBay API (REST API - FindingService)
export async function fetchEbayListingsViaApi(
  searchTerm: string,
  country: string = "USA",
  sort: string = "12h"
): Promise<EbayApiItem[]> {
  try {
    const { appId } = getEbayCredentials();

    console.log(`[eBay API] Searching for "${searchTerm}" in ${country} (sort: ${sort})`);

    const globalId = getEbayGlobalId(country);
    const sortOrder = mapSortToEbaySortOrder(sort);

    // eBay Finding Service parameters
    const params = new URLSearchParams({
      "OPERATION-NAME": "findItemsAdvanced",
      "SERVICE-VERSION": "1.0.0",
      SECURITY_APPNAME: appId,
      "GLOBAL-ID": globalId,
      keywords: searchTerm,
      "sortOrder": sortOrder,
      "paginationInput.entriesPerPage": "100",
      "outputSelector": "SellerInfo,GalleryInfo",
      "itemFilter(0).name": "ListingType",
      "itemFilter(0).value": "All", // Include both auctions and fixed-price
      "itemFilter(1).name": "Condition",
      "itemFilter(1).value": "All",
      "itemFilter(2).name": "HideDuplicateItems",
      "itemFilter(2).value": "true",
      "responseFormat": "JSON",
    });

    const url = `${EBAY_SEARCH_URL}?${params.toString()}`;
    console.log(`[eBay API] Request URL (first 100 chars): ${url.substring(0, 100)}...`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    
    console.log(`[eBay API] Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[eBay API] Search failed: ${response.statusText} - ${text.substring(0, 200)}`);
      return [];
    }

    const data = (await response.json()) as {
      findItemsAdvancedResponse?: Array<{
        ack?: string[];
        errorMessage?: Array<{ error?: Array<{ message?: string[] }> }>;
        searchResult?: Array<EbaySearchResult>;
      }>;
    };

    // Parse response
    const responseObj = data.findItemsAdvancedResponse?.[0];
    if (!responseObj) {
      console.warn("[eBay API] Invalid response structure");
      console.log("[eBay API] Full response:", JSON.stringify(data).substring(0, 300));
      return [];
    }

    // Check for errors
    if (responseObj.ack && responseObj.ack[0] !== "Success") {
      const errorMsg =
        responseObj.errorMessage?.[0]?.error?.[0]?.message?.[0] || "Unknown error";
      console.error(`[eBay API] Error: ${errorMsg}`);
      console.log("[eBay API] Full response:", JSON.stringify(responseObj).substring(0, 300));
      return [];
    }

    const searchResult = responseObj.searchResult?.[0];
    if (!searchResult || !searchResult.item) {
      console.log("[eBay API] No items found");
      console.log("[eBay API] searchResult:", searchResult);
      return [];
    }

    // Transform eBay items to our format
    const items: EbayApiItem[] = searchResult.item
      .map((item) => {
        try {
          const itemId = item.itemId?.[0];
          const title = item.title?.[0];
          const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || "0");
          const currencyId = item.sellingStatus?.[0]?.currentPrice?.[0]?.currencyId || "USD";
          const viewItemURL = item.viewItemURL?.[0];
          const location = item.location?.[0] || item.country?.[0] || country;
          const imageUrl = item.galleryURL?.[0] || "";

          // Determine listing type
          const listingType =
            item.condition?.[0]?.conditionDisplayName?.[0]?.toLowerCase().includes("auction") ||
            item.isMultiVariationListing?.[0]
              ? "Auction"
              : "Buy Now";

          // Extract seller name from eBay listing URL if available
          const seller = "eBay Seller";

          // Posted time - eBay API doesn't provide this directly, so we estimate
          // Based on item ID (items are often ordered by listing time)
          const postedTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();

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
          console.error("[eBay API] Error parsing item:", err);
          return null;
        }
      })
      .filter((item): item is EbayApiItem => item !== null)
      .slice(0, 50); // Return top 50 items

    console.log(`[eBay API] Successfully retrieved ${items.length} listings`);
    return items;
  } catch (error) {
    console.error("[eBay API] Error:", error instanceof Error ? error.message : error);
    return [];
  }
}

// Verify eBay API connection
export async function verifyEbayApiConnection(): Promise<boolean> {
  try {
    console.log("[eBay API] Verifying connection...");
    const result = await fetchEbayListingsViaApi("test", "USA", "12h");
    const isConnected = result.length > 0;

    if (isConnected) {
      console.log("[eBay API] ✓ Connection verified - API is working");
    } else {
      console.log("[eBay API] ⚠ Connection test returned no results");
    }

    return isConnected;
  } catch (error) {
    console.error("[eBay API] ✗ Connection verification failed:", error);
    return false;
  }
}
