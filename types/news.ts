// Shared news-related TypeScript types

export interface BaseNewsArticle {
  article_id: string;
  title: string;
  description?: string;
  content?: string;
  pubDate: string;
  image_url?: string;
  source_id: string;
  country?: string[];
  category?: string[];
  language: string;
}

export interface NewsDataArticle extends BaseNewsArticle {
  link: string;
  keywords?: string[];
  creator?: string[];
  video_url?: string;
  source_priority: number;
  source_name?: string;
  source_type?: string;
}

export interface NewsAPIArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsDataArticle[];
  sources?: {
    newsdata: string;
    newsapi: string;
  };
  filtered?: boolean;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
}

export interface LocationInfo {
  city: string;
  country: string;
  countryCode: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
