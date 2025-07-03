import { NextRequest, NextResponse } from "next/server";
import { logger, APIError } from "@/lib/logger";
import { config } from "@/lib/config";

// Search function for each API
async function searchNewsData(query: string) {
  const apiKey = config.newsData.apiKey;
  if (!apiKey) return null;

  const searchParams = new URLSearchParams({
    apikey: apiKey,
    q: query,
    language: "en",
    size: "10",
    image: "1",
  });

  const url = `https://newsdata.io/api/1/news?${searchParams}`;
  logger.apiRequest("GET", url);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NewsFlash/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.apiError("GET", url, new Error(errorText), response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    logger.error("NewsData search error", { query }, error as Error);
    return null;
  }
}

async function searchNewsAPI(query: string) {
  const apiKey = config.newsApi.apiKey;
  if (!apiKey) return null;

  const searchParams = new URLSearchParams({
    apiKey: apiKey,
    q: query,
    language: "en",
    pageSize: "10",
    sortBy: "publishedAt",
  });

  const url = `https://newsapi.org/v2/everything?${searchParams}`;
  logger.apiRequest("GET", url);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NewsFlash/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.apiError("GET", url, new Error(errorText), response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    logger.error("NewsAPI search error", { query }, error as Error);
    return null;
  }
}

async function searchGuardianAPI(query: string) {
  const apiKey = config.guardian.apiKey;
  if (!apiKey) return null;

  const searchParams = new URLSearchParams({
    "api-key": apiKey,
    q: query,
    format: "json",
    "show-fields": "thumbnail,trailText,body",
    "page-size": "10",
    "order-by": "newest",
  });

  const url = `https://content.guardianapis.com/search?${searchParams}`;
  logger.apiRequest("GET", url);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NewsFlash/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.apiError("GET", url, new Error(errorText), response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    logger.error("Guardian search error", { query }, error as Error);
    return null;
  }
}

async function searchCurrentsAPI(query: string) {
  const apiKey = config.currents.apiKey;
  if (!apiKey) return null;

  const searchParams = new URLSearchParams({
    apiKey: apiKey,
    keywords: query,
    language: "en",
    limit: "10",
  });

  const url = `https://api.currentsapi.services/v1/search?${searchParams}`;
  logger.apiRequest("GET", url);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NewsFlash/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.apiError("GET", url, new Error(errorText), response.status);
      return null;
    }

    return response.json();
  } catch (error) {
    logger.error("Currents search error", { query }, error as Error);
    return null;
  }
}

// Deduplication function
function removeDuplicates(articles: any[]) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.title?.toLowerCase().trim();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      status: "error",
      message: "Search query must be at least 2 characters long",
    }, { status: 400 });
  }

  try {
    // Search all available APIs in parallel
    const promises = [
      searchNewsData(query).catch(() => null),
      searchNewsAPI(query).catch(() => null),
      searchGuardianAPI(query).catch(() => null),
      searchCurrentsAPI(query).catch(() => null),
    ];

    const [newsDataResult, newsAPIResult, guardianResult, currentsResult] = await Promise.all(promises);

    let combinedResults: any[] = [];

    // Process NewsData.io results
    if (newsDataResult?.results) {
      const newsDataArticles = newsDataResult.results.map((article: any) => ({
        ...article,
        link: article.link, // NewsData already has link field
        source_name: article.source_id || "Unknown Source",
        source_type: "newsdata",
      }));
      combinedResults.push(...newsDataArticles);
    }

    // Process NewsAPI.org results
    if (newsAPIResult?.articles) {
      const newsAPIArticles = newsAPIResult.articles.map((article: any) => ({
        article_id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        pubDate: article.publishedAt,
        image_url: article.urlToImage,
        link: article.url, // NewsAPI uses url field
        source_id: article.source.name,
        source_name: article.source.name || "Unknown Source",
        source_type: "newsapi",
        category: ["general"],
        country: [],
        language: "en",
      }));
      combinedResults.push(...newsAPIArticles);
    }

    // Process Guardian API results
    if (guardianResult?.response?.results) {
      const guardianArticles = guardianResult.response.results.map((article: any) => ({
        article_id: article.id,
        title: article.webTitle,
        description: article.fields?.trailText || article.webTitle,
        content: article.fields?.body,
        pubDate: article.webPublicationDate,
        image_url: article.fields?.thumbnail,
        link: article.webUrl, // Guardian uses webUrl field
        source_id: "the-guardian",
        source_name: "The Guardian",
        source_type: "guardian",
        category: article.sectionName ? [article.sectionName] : ["general"],
        country: [],
        language: "en",
      }));
      combinedResults.push(...guardianArticles);
    }

    // Process Currents API results
    if (currentsResult?.news) {
      const currentsArticles = currentsResult.news.map((article: any) => ({
        article_id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        pubDate: article.published,
        image_url: article.image,
        link: article.url, // Currents uses url field
        source_id: article.author?.toLowerCase().replace(/\s+/g, '-') || "currents-source",
        source_name: article.author || "Currents Source",
        source_type: "currents",
        category: article.category ? [article.category] : ["general"],
        country: [],
        language: "en",
      }));
      combinedResults.push(...currentsArticles);
    }

    // Remove duplicates and sort by date
    combinedResults = removeDuplicates(combinedResults);
    combinedResults.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });

    // Limit to top 20 search results
    combinedResults = combinedResults.slice(0, 20);

    const response = {
      status: "success",
      query: query,
      totalResults: combinedResults.length,
      results: combinedResults,
      sources: {
        newsdata: newsDataResult ? "success" : "failed",
        newsapi: newsAPIResult ? "success" : "failed",
        guardian: guardianResult ? "success" : "failed",
        currents: currentsResult ? "success" : "failed",
      },
    };

    logger.info("Search results returned", { 
      query,
      count: combinedResults.length,
      sources: response.sources
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Search API error", { query }, error as Error);

    return NextResponse.json({
      status: "error",
      message: "Search failed",
      query: query,
      totalResults: 0,
      results: [],
      sources: {
        newsdata: "failed",
        newsapi: "failed",
        guardian: "failed",
        currents: "failed",
      },
    }, { status: 500 });
  }
}
