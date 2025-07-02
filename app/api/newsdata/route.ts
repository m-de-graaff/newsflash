import { NextRequest, NextResponse } from "next/server";
import { logger, RateLimitError, APIError } from "@/lib/logger";
import { config } from "@/lib/config";

// Rate limiting with conservative settings
let requestCount = 0;
let dailyReset = Date.now();
const DAILY_LIMIT = config.newsData.dailyLimit;
const HOUR_LIMIT = config.newsData.hourlyLimit;
const requestTimes: number[] = [];

function canMakeRequest(): boolean {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;

  // Reset daily counter if 24 hours have passed
  if (now - dailyReset > oneDay) {
    requestCount = 0;
    dailyReset = now;
    requestTimes.length = 0;
  }

  // Remove request times older than 1 hour
  const cutoff = now - oneHour;
  for (let i = requestTimes.length - 1; i >= 0; i--) {
    if (requestTimes[i] < cutoff) {
      requestTimes.splice(i, 1);
    }
  }

  return requestCount < DAILY_LIMIT && requestTimes.length < HOUR_LIMIT;
}

function recordRequest() {
  requestCount++;
  requestTimes.push(Date.now());
  logger.info("NewsData API request made", {
    daily: `${requestCount}/${DAILY_LIMIT}`,
    hourly: `${requestTimes.length}/${HOUR_LIMIT}`
  });
}

// Improved fetch with proper parameters based on NewsData.io docs
async function fetchNewsData(
  type: string,
  params: Record<string, string> = {}
) {
  const apiKey = config.newsData.apiKey;
  const baseUrl = "https://newsdata.io/api/1";
  const startTime = Date.now();

  // Check rate limit
  if (!canMakeRequest()) {
    throw new RateLimitError("NewsData.io");
  }

  // Build parameters based on type
  const searchParams = new URLSearchParams({
    apikey: apiKey,
    language: "en",
    size: "10", // Free tier limit
    image: "1", // Only articles with images
    prioritydomain: "top", // High quality sources
    ...params,
  });

  let endpoint = "latest";

  // Use different endpoints and parameters based on type
  switch (type) {
    case "worldwide":
      // Get international news from multiple categories
      searchParams.set("category", "top,world,politics,business,technology");
      break;
    case "country":
      // Country-specific news - ensure country filtering
      if (params.country) {
        searchParams.set("country", params.country);
        searchParams.set("category", "top,politics,business,technology");
        // Remove prioritydomain for country news to get more local sources
        searchParams.delete("prioritydomain");
      }
      break;
    case "breaking":
      // Breaking news - top priority
      searchParams.set("category", "top");
      searchParams.set("prioritydomain", "top");
      break;
    case "technology":
      searchParams.set("category", "technology,science");
      break;
    case "business":
      searchParams.set("category", "business,politics");
      break;
    default:
      searchParams.set("category", "top");
  }

  const url = `${baseUrl}/${endpoint}?${searchParams}`;
  logger.apiRequest("GET", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NewsFlash/1.0",
    },
  });

  const duration = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    logger.apiError("GET", url, new Error(errorText), response.status);
    throw new APIError("NewsData.io", new Error(`${response.status} - ${errorText}`));
  }

  recordRequest();
  logger.apiRequest("GET", url, duration);
  return response.json();
}

// Fetch from NewsAPI.org as secondary source
async function fetchNewsAPI(type: string, params: Record<string, string> = {}) {
  const apiKey = config.newsApi.apiKey;
  const baseUrl = "https://newsapi.org/v2";

  let endpoint = "top-headlines";
  const searchParams = new URLSearchParams({
    apiKey: apiKey,
    pageSize: "20",
    language: "en",
    ...params,
  });

  switch (type) {
    case "worldwide":
      searchParams.set("category", "general");
      break;
    case "country":
      if (params.country) {
        searchParams.set("country", params.country);
        searchParams.set("category", "general");
      }
      break;
    case "breaking":
      searchParams.set("category", "general");
      break;
  }

  const url = `${baseUrl}/${endpoint}?${searchParams}`;
  logger.apiRequest("GET", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NewsFlash/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.apiError("GET", url, new Error(errorText), response.status);
    throw new APIError("NewsAPI.org", new Error(`${response.status} - ${errorText}`));
  }

  return response.json();
}

// The Guardian API fetch function
async function fetchGuardianAPI(
  type: string,
  params: Record<string, string> = {}
) {
  const apiKey = config.guardian.apiKey;
  if (!apiKey) return null;

  const baseUrl = "https://content.guardianapis.com";
  const startTime = Date.now();

  const searchParams = new URLSearchParams({
    "api-key": apiKey,
    format: "json",
    "show-fields": "thumbnail,trailText,body",
    "show-tags": "contributor",
    "page-size": "10",
    ...params,
  });

  let endpoint = "search";
  
  // Build query based on type
  switch (type) {
    case "worldwide":
      searchParams.set("section", "world|politics|business|technology");
      break;
    case "country":
      if (params.country === "gb" || params.country === "uk") {
        searchParams.set("section", "uk-news|politics|business");
      } else {
        searchParams.set("q", `${params.country} OR ${countryKeywords[params.country]?.slice(0, 3).join(" OR ") || ""}`);
        searchParams.set("section", "world|politics");
      }
      break;
    case "breaking":
      searchParams.set("section", "world|uk-news|politics");
      searchParams.set("order-by", "newest");
      break;
    case "technology":
      searchParams.set("section", "technology|science");
      break;
    case "business":
      searchParams.set("section", "business|economics");
      break;
  }

  const url = `${baseUrl}/${endpoint}?${searchParams}`;
  logger.apiRequest("GET", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NewsFlash/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.apiError("GET", url, new Error(errorText), response.status);
    throw new APIError("Guardian API", new Error(`${response.status} - ${errorText}`));
  }

  return response.json();
}

// GNews API fetch function
async function fetchGNewsAPI(
  type: string,
  params: Record<string, string> = {}
) {
  const apiKey = config.gnews.apiKey;
  if (!apiKey) return null;

  const baseUrl = "https://gnews.io/api/v4";
  const startTime = Date.now();

  const searchParams = new URLSearchParams({
    token: apiKey,
    lang: "en",
    max: "10",
    image: "required",
    ...params,
  });

  let endpoint = "top-headlines";

  switch (type) {
    case "worldwide":
      searchParams.set("category", "general");
      break;
    case "country":
      if (params.country) {
        searchParams.set("country", params.country);
        searchParams.set("category", "general");
      }
      break;
    case "breaking":
      searchParams.set("category", "general");
      endpoint = "top-headlines";
      break;
    case "technology":
      searchParams.set("category", "technology");
      break;
    case "business":
      searchParams.set("category", "business");
      break;
  }

  const url = `${baseUrl}/${endpoint}?${searchParams}`;
  logger.apiRequest("GET", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NewsFlash/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.apiError("GET", url, new Error(errorText), response.status);
    throw new APIError("GNews API", new Error(`${response.status} - ${errorText}`));
  }

  return response.json();
}

// Currents API fetch function
async function fetchCurrentsAPI(
  type: string,
  params: Record<string, string> = {}
) {
  const apiKey = config.currents.apiKey;
  if (!apiKey) return null;

  const baseUrl = "https://api.currentsapi.services/v1";
  const startTime = Date.now();

  const searchParams = new URLSearchParams({
    apiKey: apiKey,
    language: "en",
    limit: "10",
    ...params,
  });

  let endpoint = "latest-news";

  switch (type) {
    case "worldwide":
      searchParams.set("category", "general,politics,business,technology");
      break;
    case "country":
      if (params.country) {
        searchParams.set("country", params.country.toUpperCase());
        searchParams.set("category", "general,politics");
      }
      break;
    case "breaking":
      searchParams.set("category", "general");
      break;
    case "technology":
      searchParams.set("category", "technology,science");
      break;
    case "business":
      searchParams.set("category", "business,politics");
      break;
  }

  const url = `${baseUrl}/${endpoint}?${searchParams}`;
  logger.apiRequest("GET", url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "NewsFlash/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.apiError("GET", url, new Error(errorText), response.status);
    throw new APIError("Currents API", new Error(`${response.status} - ${errorText}`));
  }

  return response.json();
}

// NewsWeb API fetch function (NewsCatcher API)
async function fetchNewsWebAPI(
  type: string,
  params: Record<string, string> = {}
) {
  const apiKey = config.newsWeb.apiKey;
  if (!apiKey) return null;

  const baseUrl = "https://api.newscatcherapi.com/v2";
  const startTime = Date.now();

  const searchParams = new URLSearchParams({
    lang: "en",
    page_size: "10",
    ...params,
  });

  let endpoint = "latest_headlines";

  switch (type) {
    case "worldwide":
      searchParams.set("topic", "news");
      break;
    case "country":
      if (params.country) {
        searchParams.set("countries", params.country.toUpperCase());
        searchParams.set("topic", "news");
      }
      break;
    case "breaking":
      searchParams.set("topic", "news");
      searchParams.set("sort_by", "relevancy");
      break;
    case "technology":
      searchParams.set("topic", "tech");
      break;
    case "business":
      searchParams.set("topic", "business");
      break;
  }

  const url = `${baseUrl}/${endpoint}?${searchParams}`;
  logger.apiRequest("GET", url);

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      "User-Agent": "NewsFlash/1.0",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.apiError("GET", url, new Error(errorText), response.status);
    throw new APIError("NewsWeb API", new Error(`${response.status} - ${errorText}`));
  }

  return response.json();
}

// Country-specific keywords for content filtering
const countryKeywords: Record<string, string[]> = {
  nl: ["netherlands", "dutch", "holland", "amsterdam", "the hague", "rotterdam", "utrecht", "eindhoven", "tilburg", "groningen", "breda", "nijmegen", "apeldoorn", "haarlem", "arnhem", "zaanstad", "enschede", "haarlemmermeer", "dordrecht", "leiden", "zoetermeer", "maastricht", "almere", "enschede", "prime minister rutte", "king willem-alexander", "parliament", "tweede kamer", "eerste kamer"],
  us: ["united states", "america", "american", "washington", "new york", "california", "texas", "florida", "illinois", "pennsylvania", "ohio", "georgia", "north carolina", "michigan", "new jersey", "virginia", "washington state", "arizona", "massachusetts", "tennessee", "indiana", "maryland", "missouri", "wisconsin", "colorado", "minnesota", "south carolina", "alabama", "louisiana", "kentucky", "oregon", "oklahoma", "connecticut", "utah", "nevada", "arkansas", "mississippi", "kansas", "new mexico", "nebraska", "idaho", "west virginia", "hawaii", "new hampshire", "maine", "montana", "rhode island", "delaware", "south dakota", "north dakota", "alaska", "vermont", "wyoming", "biden", "congress", "senate", "house", "supreme court"],
  gb: ["united kingdom", "britain", "british", "england", "scotland", "wales", "northern ireland", "london", "manchester", "birmingham", "leeds", "glasgow", "sheffield", "bradford", "liverpool", "edinburgh", "cardiff", "belfast", "prime minister", "parliament", "westminster", "downing street"],
  de: ["germany", "german", "berlin", "hamburg", "munich", "cologne", "frankfurt", "stuttgart", "düsseldorf", "dortmund", "essen", "leipzig", "bremen", "dresden", "hanover", "nuremberg", "duisburg", "bochum", "wuppertal", "bielefeld", "bonn", "münster", "chancellor", "bundestag", "bundesrat"],
  fr: ["france", "french", "paris", "marseille", "lyon", "toulouse", "nice", "nantes", "strasbourg", "montpellier", "bordeaux", "lille", "rennes", "reims", "toulon", "saint-étienne", "le havre", "grenoble", "dijon", "angers", "nîmes", "villeurbanne", "saint-denis", "le mans", "aix-en-provence", "clermont-ferrand", "brest", "limoges", "tours", "amiens", "perpignan", "metz", "besançon", "orléans", "mulhouse", "rouen", "caen", "nancy", "argenteuil", "montreuil", "roubaix", "dunkerque", "tourcoing", "nanterre", "avignon", "créteil", "poitiers", "fort-de-france", "courbevoie", "versailles", "colombes", "aulnay-sous-bois", "asnières-sur-seine", "rueil-malmaison", "pau", "bourges", "calais", "cannes", "rochelle", "antibes", "saint-maur-des-fossés", "champigny-sur-marne", "béziers", "drancy", "mérignac", "saint-nazaire", "colmar", "issy-les-moulineaux", "noisy-le-grand", "évry", "villeneuve-d'ascq", "cergy", "valence", "antony", "la rochelle", "pessac", "ivry-sur-seine", "clichy", "chambéry", "lorient", "niort", "sarcelles", "villejuif", "saint-quentin", "hyères", "beauvais", "cholet", "neuilly-sur-seine", "monaco", "macron", "president", "assemblée nationale", "sénat", "élysée"],
  ca: ["canada", "canadian", "toronto", "montreal", "vancouver", "calgary", "ottawa", "edmonton", "mississauga", "winnipeg", "quebec", "hamilton", "brampton", "surrey", "laval", "halifax", "london", "markham", "vaughan", "gatineau", "longueuil", "burnaby", "saskatoon", "kitchener", "windsor", "regina", "richmond", "richmond hill", "oakville", "burlington", "greater sudbury", "sherbrooke", "oshawa", "saguenay", "lévis", "barrie", "abbotsford", "coquitlam", "st. catharines", "trois-rivières", "cambridge", "whitby", "guelph", "kelowna", "saanich", "thunder bay", "waterloo", "delta", "chatham-kent", "red deer", "kamloops", "brantford", "cape breton", "lethbridge", "saint-jean-sur-richelieu", "clarington", "pickering", "nanaimo", "sudbury", "north vancouver", "brossard", "repentigny", "newmarket", "chilliwack", "white rock", "maple ridge", "peterborough", "kawartha lakes", "prince george", "sault ste. marie", "sarnia", "wood buffalo", "new westminster", "châteauguay", "saint-jérôme", "medicine hat", "drummondville", "saint-eustache", "saint-hyacinthe", "granby", "shawinigan", "joliette", "victoriaville", "rivière-du-loup", "sorel-tracy", "levis", "timmins", "saint-georges", "prince albert", "welland", "saint-john", "dollard-des ormeaux", "rimouski", "cornwall", "val-d'or", "sept-îles", "rouyn-noranda", "thompson", "dawson creek", "brandon", "yellowknife", "north bay", "fredericton", "fort mcmurray", "trudeau", "prime minister", "parliament", "house of commons", "senate"],
  au: ["australia", "australian", "sydney", "melbourne", "brisbane", "perth", "adelaide", "gold coast", "newcastle", "canberra", "central coast", "wollongong", "logan city", "geelong", "hobart", "townsville", "cairns", "darwin", "toowoomba", "ballarat", "bendigo", "albury", "launceston", "mackay", "rockhampton", "bunbury", "bundaberg", "coffs harbour", "wagga wagga", "hervey bay", "mildura", "shepparton", "gladstone", "tamworth", "traralgon", "orange", "dubbo", "geraldton", "nowra", "warrnambool", "kalgoorlie", "mount gambier", "lismore", "nelson bay", "alice springs", "prime minister", "parliament", "house of representatives", "senate"],
  jp: ["japan", "japanese", "tokyo", "yokohama", "osaka", "nagoya", "sapporo", "fukuoka", "kobe", "kawasaki", "kyoto", "saitama", "hiroshima", "sendai", "kitakyushu", "chiba", "sakai", "niigata", "hamamatsu", "shizuoka", "sagamihara", "okayama", "kumamoto", "kagoshima", "funabashi", "hachioji", "kawaguchi", "himeji", "suginami", "nerima", "adachi", "matsuyama", "utsunomiya", "higashiosaka", "kurashiki", "nishinomiya", "amagasaki", "kanazawa", "oita", "nara", "toyonaka", "nagasaki", "toyota", "takamatsu", "gifu", "hirakata", "fujisawa", "kashiwa", "toyohashi", "machida", "naha", "asahikawa", "wakayama", "prime minister", "diet", "emperor", "cabinet"],
  it: ["italy", "italian", "rome", "milan", "naples", "turin", "palermo", "genoa", "bologna", "florence", "bari", "catania", "venice", "verona", "messina", "padua", "trieste", "taranto", "brescia", "prato", "parma", "modena", "reggio calabria", "reggio emilia", "perugia", "livorno", "ravenna", "cagliari", "foggia", "rimini", "salerno", "ferrara", "sassari", "latina", "giugliano in campania", "monza", "syracuse", "pescara", "bergamo", "forlì", "trento", "vicenza", "terni", "bolzano", "novara", "piacenza", "ancona", "andria", "arezzo", "udine", "cesena", "lecce", "pesaro", "barletta", "cremona", "alessandria", "treviso", "como", "la spezia", "brindisi", "lucca", "pavia", "pistoia", "caserta", "massa", "trani", "gela", "trapani", "carpi", "mantova", "cosenza", "fiumicino", "varese", "imola", "ragusa", "guidonia montecelio", "caltanissetta", "vigevano", "crotone", "pordenone", "catanzaro", "castellammare di stabia", "altamura", "afragola", "potenza", "cinisello balsamo", "battipaglia", "casoria", "san severo", "quartu sant'elena", "asti", "martina franca", "carrara", "santarcangelo di romagna", "sesto san giovanni", "agrigento", "bitonto", "prime minister", "parliament", "president", "senate", "chamber of deputies"],
  es: ["spain", "spanish", "madrid", "barcelona", "valencia", "seville", "zaragoza", "málaga", "murcia", "palma", "las palmas de gran canaria", "bilbao", "alicante", "córdoba", "valladolid", "vigo", "gijón", "l'hospitalet de llobregat", "vitoria-gasteiz", "la coruña", "granada", "elche", "oviedo", "badalona", "cartagena", "terrassa", "jerez de la frontera", "sabadell", "móstoles", "santa cruz de tenerife", "pamplona", "almería", "alcalá de henares", "fuenlabrada", "leganes", "getafe", "santander", "castellón de la plana", "burgos", "albacete", "alcorcón", "salamanca", "huelva", "logroño", "badajoz", "donostia", "prime minister", "parliament", "king", "cortés generales"],
};

// Helper function to check if article content is relevant to the country
function isArticleRelevantToCountry(article: any, countryCode: string): boolean {
  if (!countryCode || countryCode === "us") {
    // For worldwide or US, allow all articles
    return true;
  }

  const keywords = countryKeywords[countryCode.toLowerCase()] || [];
  if (keywords.length === 0) {
    // If we don't have keywords for this country, allow the article
    return true;
  }

  const title = (article.title || "").toLowerCase();
  const description = (article.description || "").toLowerCase();
  const content = (article.content || "").toLowerCase();
  const source = (article.source_id || "").toLowerCase();

  // Combine all text to search
  const combinedText = `${title} ${description} ${content} ${source}`;

  // Check if any of the country keywords appear in the text
  const isRelevant = keywords.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );

  if (!isRelevant) {
    logger.debug("Filtering irrelevant article", { 
      countryCode, 
      title: article.title?.substring(0, 50) + "..." 
    });
  }

  return isRelevant;
}

// Helper function to remove duplicate articles
function removeDuplicates(articles: any[]): any[] {
  const seen = new Set();
  const unique = [];

  for (const article of articles) {
    // Create a signature based on title similarity
    const title = (article.title || "").toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Use first 50 characters of title as signature
    const signature = title.substring(0, 50);
    
    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(article);
    } else {
      logger.debug("Removing duplicate article", { 
        title: article.title?.substring(0, 50) + "..." 
      });
    }
  }

  return unique;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const country = searchParams.get("country");

  try {
    let newsDataResults: any = null;
    let newsAPIResults: any = null;

    // Fetch from both sources in parallel
    const promises = [];

    // NewsData.io
    switch (type) {
      case "worldwide":
        promises.push(fetchNewsData("worldwide").catch((e) => null));
        break;
      case "country":
        if (country) {
          promises.push(
            fetchNewsData("country", { country }).catch((e) => null)
          );
        } else {
          promises.push(fetchNewsData("worldwide").catch((e) => null));
        }
        break;
      case "breaking":
        promises.push(fetchNewsData("breaking").catch((e) => null));
        break;
      default:
        promises.push(fetchNewsData("worldwide").catch((e) => null));
    }

    // NewsAPI.org
    switch (type) {
      case "worldwide":
        promises.push(fetchNewsAPI("worldwide").catch((e) => null));
        break;
      case "country":
        if (country) {
          promises.push(
            fetchNewsAPI("country", { country }).catch((e) => null)
          );
        } else {
          promises.push(fetchNewsAPI("worldwide").catch((e) => null));
        }
        break;
      case "breaking":
        promises.push(fetchNewsAPI("breaking").catch((e) => null));
        break;
      default:
        promises.push(fetchNewsAPI("worldwide").catch((e) => null));
    }

    // Guardian API
    switch (type) {
      case "worldwide":
        promises.push(fetchGuardianAPI("worldwide").catch((e) => null));
        break;
      case "country":
        if (country) {
          promises.push(
            fetchGuardianAPI("country", { country }).catch((e) => null)
          );
        } else {
          promises.push(fetchGuardianAPI("worldwide").catch((e) => null));
        }
        break;
      case "breaking":
        promises.push(fetchGuardianAPI("breaking").catch((e) => null));
        break;
      default:
        promises.push(fetchGuardianAPI("worldwide").catch((e) => null));
    }

    // GNews API
    switch (type) {
      case "worldwide":
        promises.push(fetchGNewsAPI("worldwide").catch((e) => null));
        break;
      case "country":
        if (country) {
          promises.push(
            fetchGNewsAPI("country", { country }).catch((e) => null)
          );
        } else {
          promises.push(fetchGNewsAPI("worldwide").catch((e) => null));
        }
        break;
      case "breaking":
        promises.push(fetchGNewsAPI("breaking").catch((e) => null));
        break;
      default:
        promises.push(fetchGNewsAPI("worldwide").catch((e) => null));
    }

    // Currents API
    switch (type) {
      case "worldwide":
        promises.push(fetchCurrentsAPI("worldwide").catch((e) => null));
        break;
      case "country":
        if (country) {
          promises.push(
            fetchCurrentsAPI("country", { country }).catch((e) => null)
          );
        } else {
          promises.push(fetchCurrentsAPI("worldwide").catch((e) => null));
        }
        break;
      case "breaking":
        promises.push(fetchCurrentsAPI("breaking").catch((e) => null));
        break;
      default:
        promises.push(fetchCurrentsAPI("worldwide").catch((e) => null));
    }

    // NewsWeb API
    switch (type) {
      case "worldwide":
        promises.push(fetchNewsWebAPI("worldwide").catch((e) => null));
        break;
      case "country":
        if (country) {
          promises.push(
            fetchNewsWebAPI("country", { country }).catch((e) => null)
          );
        } else {
          promises.push(fetchNewsWebAPI("worldwide").catch((e) => null));
        }
        break;
      case "breaking":
        promises.push(fetchNewsWebAPI("breaking").catch((e) => null));
        break;
      default:
        promises.push(fetchNewsWebAPI("worldwide").catch((e) => null));
    }

    const [
      newsDataResult,
      newsAPIResult,
      guardianResult,
      gnewsResult,
      currentsResult,
      newsWebResult
    ] = await Promise.all(promises);

    // Combine results from all sources
    let combinedResults = [];

    // Add NewsData.io results
    if (newsDataResult?.results) {
      const newsDataArticles = newsDataResult.results.map((article: any) => ({
        ...article,
        // Use the actual source name, not the API provider
        source_name: article.source_id || "Unknown Source",
        source_type: "newsdata",
      }));
      
      // Filter for country relevance if this is a country request
      if (type === "country" && country) {
        const filtered = newsDataArticles.filter((article: any) => 
          isArticleRelevantToCountry(article, country)
        );
        combinedResults.push(...filtered);
      } else {
        combinedResults.push(...newsDataArticles);
      }
    }

    // Add NewsAPI.org results
    if (newsAPIResult?.articles) {
      const newsAPIArticles = newsAPIResult.articles.map((article: any) => ({
        article_id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        pubDate: article.publishedAt,
        image_url: article.urlToImage,
        source_id: article.source.name,
        // Use the actual source name from NewsAPI
        source_name: article.source.name || "Unknown Source",
        source_type: "newsapi",
        category: ["general"],
        country: country ? [country] : [],
        language: "en",
      }));

      // Filter for country relevance if this is a country request
      if (type === "country" && country) {
        const filtered = newsAPIArticles.filter((article: any) => 
          isArticleRelevantToCountry(article, country)
        );
        combinedResults.push(...filtered);
      } else {
        combinedResults.push(...newsAPIArticles);
      }
    }

    // Add Guardian API results
    if (guardianResult?.response?.results) {
      const guardianArticles = guardianResult.response.results.map((article: any) => ({
        article_id: article.id,
        title: article.webTitle,
        description: article.fields?.trailText || article.webTitle,
        content: article.fields?.body,
        pubDate: article.webPublicationDate,
        image_url: article.fields?.thumbnail,
        source_id: "the-guardian",
        source_name: "The Guardian",
        source_type: "guardian",
        category: article.sectionName ? [article.sectionName] : ["general"],
        country: country ? [country] : [],
        language: "en",
      }));

      // Filter for country relevance if this is a country request
      if (type === "country" && country) {
        const filtered = guardianArticles.filter((article: any) => 
          isArticleRelevantToCountry(article, country)
        );
        combinedResults.push(...filtered);
      } else {
        combinedResults.push(...guardianArticles);
      }
    }

    // Add GNews API results
    if (gnewsResult?.articles) {
      const gnewsArticles = gnewsResult.articles.map((article: any) => ({
        article_id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        pubDate: article.publishedAt,
        image_url: article.image,
        source_id: article.source?.name?.toLowerCase().replace(/\s+/g, '-') || "gnews-source",
        source_name: article.source?.name || "GNews Source",
        source_type: "gnews",
        category: ["general"],
        country: country ? [country] : [],
        language: "en",
      }));

      // Filter for country relevance if this is a country request
      if (type === "country" && country) {
        const filtered = gnewsArticles.filter((article: any) => 
          isArticleRelevantToCountry(article, country)
        );
        combinedResults.push(...filtered);
      } else {
        combinedResults.push(...gnewsArticles);
      }
    }

    // Add Currents API results
    if (currentsResult?.news) {
      const currentsArticles = currentsResult.news.map((article: any) => ({
        article_id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        pubDate: article.published,
        image_url: article.image,
        source_id: article.author?.toLowerCase().replace(/\s+/g, '-') || "currents-source",
        source_name: article.author || "Currents Source",
        source_type: "currents",
        category: article.category ? [article.category] : ["general"],
        country: country ? [country] : [],
        language: "en",
      }));

      // Filter for country relevance if this is a country request
      if (type === "country" && country) {
        const filtered = currentsArticles.filter((article: any) => 
          isArticleRelevantToCountry(article, country)
        );
        combinedResults.push(...filtered);
      } else {
        combinedResults.push(...currentsArticles);
      }
    }

    // Add NewsWeb API results (NewsCatcher API)
    if (newsWebResult?.articles) {
      const newsWebArticles = newsWebResult.articles.map((article: any) => ({
        article_id: article.link,
        title: article.title,
        description: article.excerpt || article.summary,
        content: article.summary,
        pubDate: article.published_date,
        image_url: article.media,
        source_id: article.clean_url?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || "newsweb-source",
        source_name: article.rights || article.clean_url || "NewsWeb Source",
        source_type: "newsweb",
        category: article.topic ? [article.topic] : ["general"],
        country: article.country ? [article.country] : (country ? [country] : []),
        language: "en",
      }));

      // Filter for country relevance if this is a country request
      if (type === "country" && country) {
        const filtered = newsWebArticles.filter((article: any) => 
          isArticleRelevantToCountry(article, country)
        );
        combinedResults.push(...filtered);
      } else {
        combinedResults.push(...newsWebArticles);
      }
    }

    // Remove duplicates
    combinedResults = removeDuplicates(combinedResults);

    // Sort by publication date (newest first) and limit results
    combinedResults.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    // Limit to top 12 articles for better performance
    combinedResults = combinedResults.slice(0, 12);

    const response = {
      status: "success",
      totalResults: combinedResults.length,
      results: combinedResults,
      sources: {
        newsdata: newsDataResult ? "success" : "failed",
        newsapi: newsAPIResult ? "success" : "failed",
        guardian: guardianResult ? "success" : "failed",
        gnews: gnewsResult ? "success" : "failed",
        currents: currentsResult ? "success" : "failed",
        newsweb: newsWebResult ? "success" : "failed",
      },
      filtered: type === "country" && country ? true : false,
    };

    logger.info("Returning filtered news results", { 
      count: combinedResults.length,
      type,
      country,
      sources: response.sources
    });
    return NextResponse.json(response);
  } catch (error) {
    logger.error("News API error", { type, country }, error as Error);

    // Return fallback data structure on error
    const fallbackData = {
      status: "success",
      totalResults: 0,
      results: [],
      sources: {
        newsdata: "failed",
        newsapi: "failed",
        guardian: "failed",
        gnews: "failed",
        currents: "failed",
        newsweb: "failed",
      },
    };

    return NextResponse.json(fallbackData, { status: 200 }); // Return 200 to trigger fallback logic
  }
}
