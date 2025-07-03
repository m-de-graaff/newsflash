import type { NewsArticle } from "@/components/news-grid";
import type { IPInfo } from "@/lib/ip-utils";
import { NewsCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { config } from "@/lib/config";
import { stripHtml, truncateText } from "@/lib/text-utils";

// Enhanced cache for news data
const newsCache = new NewsCache<NewsArticle[]>(config.cache.maxEntries, config.cache.duration);

// Helper function to strip HTML tags and decode HTML entities
function stripHtmlAndDecode(text: string): string {
  if (!text) return "";
  
  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, "");
  
  // Decode common HTML entities
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
  };
  
  for (const [entity, replacement] of Object.entries(htmlEntities)) {
    cleaned = cleaned.replace(new RegExp(entity, 'g'), replacement);
  }
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// Enhanced NewsData API interface with source information
interface NewsDataArticle {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[];
  creator?: string[];
  video_url?: string;
  description?: string;
  content?: string;
  pubDate: string;
  image_url?: string;
  source_id: string;
  source_priority: number;
  source_name?: string; // Added for dual source support
  source_type?: string; // Added to distinguish between sources
  country?: string[];
  category?: string[];
  language: string;
}

interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
  nextPage?: string;
  sources?: {
    newsdata: string;
    newsapi: string;
  };
}

// Convert article from either source to our format with enhanced location display
function convertNewsDataArticle(
  article: NewsDataArticle,
  index: number,
  userLocation?: string
): NewsArticle {
  const publishedDate = new Date(article.pubDate);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - publishedDate.getTime()) / (1000 * 60)
  );

  let timeAgo: string;
  if (diffInMinutes < 60) {
    timeAgo = `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    timeAgo = `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    timeAgo = `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Determine category
  let category = "General";
  if (article.category && article.category.length > 0) {
    const cat = article.category[0].toLowerCase();
    switch (cat) {
      case "business":
        category = "Business";
        break;
      case "technology":
        category = "Technology";
        break;
      case "sports":
        category = "Sports";
        break;
      case "health":
        category = "Health";
        break;
      case "science":
        category = "Science";
        break;
      case "politics":
        category = "Politics";
        break;
      case "entertainment":
        category = "Entertainment";
        break;
      default:
        category = "General";
    }
  }

  // Create enhanced location display: "Country | Source"
  let locationDisplay = article.source_id || "Unknown Source";

  // If we have country info and user location, show it
  if (article.country && article.country.length > 0 && userLocation) {
    const countryCode = article.country[0].toUpperCase();
    const countryNames: Record<string, string> = {
      NL: "Netherlands",
      US: "United States",
      GB: "United Kingdom",
      DE: "Germany",
      FR: "France",
      CA: "Canada",
      AU: "Australia",
      JP: "Japan",
      IT: "Italy",
      ES: "Spain",
    };

    const countryName = countryNames[countryCode] || countryCode;
    const sourceName = article.source_name || article.source_id || "Unknown Source";
    locationDisplay = `${countryName} | ${sourceName}`;
  } else {
    // Just show source - use actual source name, not API provider
    const sourceName = article.source_name || article.source_id || "Unknown Source";
    locationDisplay = sourceName;
  }

  return {
    id: index + 1,
    title: stripHtmlAndDecode(article.title || ""),
    summary: stripHtmlAndDecode(
      article.description ||
      article.content?.substring(0, 150) + "..." ||
      "No description available"
    ),
    category,
    time: timeAgo,
    location: locationDisplay,
    image: article.image_url || "/placeholder.svg?height=300&width=400",
    url: article.link || "",
    link: article.link || "",
    content: stripHtmlAndDecode(article.content || article.description || ""),
    source_name: article.source_name || article.source_id || "Unknown Source",
  };
}

// Fallback news data for when API fails - Enhanced with more variety
function getFallbackNews(section: string): NewsArticle[] {
  const fallbackData = {
    worldwide: [
      {
        id: 1,
        title: "Global Climate Summit Reaches Historic Agreement",
        summary:
          "195 nations commit to unprecedented climate action plan with binding emission targets",
        category: "Environment",
        time: "15 minutes ago",
        location: "Geneva",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 2,
        title: "Revolutionary AI Breakthrough Announced",
        summary:
          "New quantum-AI hybrid system achieves unprecedented processing speeds",
        category: "Technology",
        time: "32 minutes ago",
        location: "Tokyo",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 3,
        title: "International Trade Agreement Signed",
        summary:
          "Major economies establish new framework for global commerce and digital trade",
        category: "Business",
        time: "1 hour ago",
        location: "Brussels",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 4,
        title: "Space Exploration Milestone Achieved",
        summary:
          "International space station receives new crew for extended Mars mission preparation",
        category: "Science",
        time: "2 hours ago",
        location: "Cape Canaveral",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 5,
        title: "Global Health Initiative Launched",
        summary:
          "WHO announces comprehensive pandemic preparedness program for developing nations",
        category: "Health",
        time: "3 hours ago",
        location: "Geneva",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 6,
        title: "Renewable Energy Record Broken",
        summary:
          "Solar and wind power generate 70% of global electricity for first time in history",
        category: "Environment",
        time: "4 hours ago",
        location: "Copenhagen",
        image: "/placeholder.svg?height=300&width=400",
      },
    ],
    country: [
      {
        id: 7,
        title: "National Infrastructure Investment Announced",
        summary:
          "Government allocates billions for nationwide infrastructure improvements and smart city initiatives",
        category: "Politics",
        time: "25 minutes ago",
        location: "Capital City",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 8,
        title: "Economic Growth Exceeds Expectations",
        summary:
          "Latest quarterly figures show robust performance across key sectors",
        category: "Business",
        time: "45 minutes ago",
        location: "Financial District",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 9,
        title: "Education Reform Bill Passes",
        summary:
          "Historic legislation modernizes curriculum and increases teacher funding nationwide",
        category: "Politics",
        time: "1 hour ago",
        location: "Parliament",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 10,
        title: "Healthcare System Expansion",
        summary:
          "New medical facilities to serve rural communities with telemedicine capabilities",
        category: "Health",
        time: "2 hours ago",
        location: "Ministry of Health",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 11,
        title: "Tech Industry Growth Surge",
        summary:
          "National technology sector attracts record foreign investment and job creation",
        category: "Technology",
        time: "3 hours ago",
        location: "Tech Hub",
        image: "/placeholder.svg?height=300&width=400",
      },
      {
        id: 12,
        title: "Environmental Protection Act",
        summary:
          "Comprehensive legislation protects natural reserves and promotes sustainable development",
        category: "Environment",
        time: "4 hours ago",
        location: "Environment Ministry",
        image: "/placeholder.svg?height=300&width=400",
      },
    ],
  };

  return (
    fallbackData[section as keyof typeof fallbackData] || fallbackData.worldwide
  );
}

// Helper function to get country code from IPInfo
function getCountryCode(location: IPInfo | null): string {
  if (!location) return "us"; // Default to US
  return location.countryCode.toLowerCase();
}

// Get cached data or fetch new data
async function getCachedNews(
  cacheKey: string,
  fetchFunction: () => Promise<NewsArticle[]>
): Promise<NewsArticle[]> {
  const cached = newsCache.get(cacheKey);

  if (cached) {
    logger.cacheHit(cacheKey);
    return cached;
  }

  logger.cacheMiss(cacheKey);

  try {
    const articles = await fetchFunction();
    newsCache.set(cacheKey, articles);
    return articles;
  } catch (error) {
    logger.error(`Error fetching news for ${cacheKey}`, {}, error as Error);

    // Try to return stale cache if available (the cache class handles expiry internally)
    // For now, return fallback data
    return getFallbackNews(cacheKey);
  }
}

// Fetch news from our API route with fallback - now supports dual sources
async function fetchNewsFromAPI(
  type: string,
  country?: string,
  userLocation?: string
): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams({ type });
    if (country) {
      params.append("country", country);
    }

    const response = await fetch(`/api/newsdata?${params}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: NewsDataResponse = await response.json();

    // If we got real data, convert it with location info
    if (data.results && data.results.length > 0) {
      const convertedArticles = data.results.map((article, index) =>
        convertNewsDataArticle(article, index, userLocation)
      );

      // Mix with fallback data for better coverage
      const fallbackArticles = getFallbackNews(type);
      const mixedArticles = [...convertedArticles];

      // Add fallback articles if we don't have enough real ones
      if (mixedArticles.length < 8) {
        const needed = 8 - mixedArticles.length;
        const shuffledFallback = fallbackArticles
          .slice()
          .sort(() => Math.random() - 0.5);
        mixedArticles.push(...shuffledFallback.slice(0, needed));
      }

      logger.info("Fetched articles from dual sources", {
        realArticles: data.results.length,
        totalMixed: mixedArticles.length,
        sources: data.sources
      });
      return mixedArticles;
    } else {
      // No real data, return fallback
      logger.warn("No real data received, using fallback", { type });
      return getFallbackNews(type);
    }
  } catch (error) {
    logger.error(`Error fetching news for ${type}`, {}, error as Error);
    return getFallbackNews(type);
  }
}

// Breaking news will be fetched from dual sources with fallback
export async function getBreakingNews(): Promise<string[]> {
  try {
    const articles = await fetchNewsFromAPI("breaking");
    const breakingTitles = articles.slice(0, 4).map((article) => article.title);

    // If we got real breaking news, use it, otherwise mix with fallback
    if (breakingTitles.length >= 2) {
      return breakingTitles;
    } else {
      // Mix real data with high-quality fallback
      const fallbackBreaking = [
        "Global Economic Summit Concludes with Historic Trade Agreement",
        "Major Scientific Breakthrough in Renewable Energy Storage",
        "International Climate Accord Signed by 195 Nations",
        "Tech Industry Leaders Announce AI Safety Initiative",
        "Space Mission Successfully Launches to Mars",
        "Breakthrough Medical Treatment Shows Promise in Trials",
      ];

      const combined = [...breakingTitles];
      const needed = 4 - combined.length;
      combined.push(...fallbackBreaking.slice(0, needed));

      return combined;
    }
  } catch (error) {
    logger.error("Error fetching breaking news", {}, error as Error);
    // Enhanced fallback breaking news
    return [
      "Global Economic Summit Concludes with Historic Trade Agreement",
      "Major Scientific Breakthrough in Renewable Energy Storage",
      "International Climate Accord Signed by 195 Nations",
      "Tech Industry Leaders Announce AI Safety Initiative",
    ];
  }
}

// Get news for different sections with location context
export async function getWorldwideNews(): Promise<NewsArticle[]> {
  return getCachedNews("worldwide", async () => {
    return await fetchNewsFromAPI("worldwide");
  });
}

export async function getCountryNews(
  location: IPInfo | null
): Promise<NewsArticle[]> {
  const countryCode = getCountryCode(location);
  const userLocationString = location
    ? `${location.city}, ${location.country}`
    : undefined;

  return getCachedNews(`country-${countryCode}`, async () => {
    return await fetchNewsFromAPI("country", countryCode, userLocationString);
  });
}

// Generate location-specific news based on detected location
export async function getLocationSpecificNews(
  location: IPInfo | null,
  section: string
): Promise<NewsArticle[]> {
  try {
    switch (section) {
      case "worldwide":
        return await getWorldwideNews();
      case "country":
        return await getCountryNews(location);
      default:
        return await getWorldwideNews();
    }
  } catch (error) {
    logger.error(`Error fetching news for section ${section}`, {}, error as Error);
    return getFallbackNews(section);
  }
}

// Search function using the new search API
export async function searchNews(query: string): Promise<NewsArticle[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cacheKey = `search:${query.toLowerCase().trim()}`;
  
  // Check cache first
  const cached = newsCache.get(cacheKey);
  if (cached) {
    logger.info("Returning cached search results", { query, count: cached.length });
    return cached;
  }

  try {
    logger.info("Searching for news", { query });
    
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data: NewsDataResponse = await response.json();
    
    if (data.status !== "success" || !data.results) {
      logger.warn("Search API returned no results", { query, status: data.status });
      return [];
    }

    // Convert to our format
    const articles = data.results.map((article, index) => 
      convertNewsDataArticle(article, index, "Search Results")
    );

    // Cache the results
    newsCache.set(cacheKey, articles);
    
    logger.info("Search completed successfully", { 
      query, 
      count: articles.length,
      sources: data.sources 
    });
    
    return articles;
  } catch (error) {
    logger.error("Search failed", { query }, error as Error);
    return [];
  }
}
