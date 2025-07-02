// Environment variables configuration
// This ensures all API keys and configuration are properly typed and centralized

interface AppConfig {
  newsData: {
    apiKey: string;
    dailyLimit: number;
    hourlyLimit: number;
  };
  newsApi: {
    apiKey: string;
  };
  guardian: {
    apiKey: string;
  };
  gnews: {
    apiKey: string;
  };
  currents: {
    apiKey: string;
  };
  newsWeb: {
    apiKey: string;
  };
  cache: {
    duration: number; // in milliseconds
    maxEntries: number;
  };
  isDevelopment: boolean;
  isProduction: boolean;
}

function getConfig(): AppConfig {
  return {
    newsData: {
      apiKey: process.env.NEWSDATA_API_KEY || "",
      dailyLimit: parseInt(process.env.NEWSDATA_DAILY_LIMIT || "180"),
      hourlyLimit: parseInt(process.env.NEWSDATA_HOURLY_LIMIT || "8"),
    },
    newsApi: {
      apiKey: process.env.NEWSAPI_KEY || "",
    },
    guardian: {
      apiKey: process.env.GUARDIAN_API_KEY || "",
    },
    gnews: {
      apiKey: process.env.GNEWS_API_KEY || "",
    },
    currents: {
      apiKey: process.env.CURRENTS_API_KEY || "",
    },
    newsWeb: {
      apiKey: process.env.NEWSWEB_API_KEY || "",
    },
    cache: {
      duration: parseInt(process.env.CACHE_DURATION || "1800000"), // 30 minutes
      maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || "100"),
    },
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
  };
}

export const config = getConfig();

// Validate configuration at startup
export function validateConfig(): void {
  const errors: string[] = [];

  // At least one of the primary news APIs must be configured
  const hasNewsData = !!config.newsData.apiKey;
  const hasNewsApi = !!config.newsApi.apiKey;
  const hasGuardian = !!config.guardian.apiKey;
  const hasGNews = !!config.gnews.apiKey;
  const hasCurrents = !!config.currents.apiKey;
  const hasNewsWeb = !!config.newsWeb.apiKey;

  const activeApiCount = [hasNewsData, hasNewsApi, hasGuardian, hasGNews, hasCurrents, hasNewsWeb].filter(Boolean).length;

  if (activeApiCount === 0) {
    errors.push('At least one news API key must be provided (NEWSDATA_API_KEY, NEWSAPI_KEY, GUARDIAN_API_KEY, GNEWS_API_KEY, CURRENTS_API_KEY, or NEWSWEB_API_KEY)');
  }

  if (config.newsData.dailyLimit <= 0) {
    errors.push('NewsData daily limit must be positive');
  }

  if (config.cache.duration <= 0) {
    errors.push('Cache duration must be positive');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }

  // Log which APIs are active
  const activeApis = [];
  if (hasNewsData) activeApis.push('NewsData.io');
  if (hasNewsApi) activeApis.push('NewsAPI.org');
  if (hasGuardian) activeApis.push('The Guardian');
  if (hasGNews) activeApis.push('GNews');
  if (hasCurrents) activeApis.push('Currents');
  if (hasNewsWeb) activeApis.push('NewsWeb');
  
  console.log(`✅ NewsFlash configured with ${activeApiCount} news source(s): ${activeApis.join(', ')}`);
}
