"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDebounce } from "@/hooks/useDebounce";
import { BreakingNews } from "@/components/breaking-news";
import { Sidebar } from "@/components/sidebar";
import { SectionNavigation } from "@/components/section-navigation";
import { NewsGrid } from "@/components/news-grid";
import { getBreakingNews, getLocationSpecificNews, searchNews } from "@/lib/news-data";
import { getSectionKeys } from "@/lib/location-hierarchy";
import type { NewsArticle } from "@/components/news-grid";

export default function NewsFlash() {
  const { location, isLoading: locationLoading } = useGeolocation();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [weatherLocation, setWeatherLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [breakingNewsData, setBreakingNewsData] = useState<string[]>([
    "Loading breaking news...",
    "Please wait while we fetch the latest updates...",
    "Real-time news coming soon...",
    "Connecting to news sources...",
  ]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Debounce search query with 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update weather location when user location is detected
  useEffect(() => {
    if (location && !weatherLocation) {
      const locationString = `${location.city}, ${location.country}`;
      setWeatherLocation(locationString);
    }
  }, [location, weatherLocation]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch breaking news on mount
  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const breaking = await getBreakingNews();
        setBreakingNewsData(breaking);
      } catch (error) {
        console.error("Error fetching breaking news:", error);
      }
    };

    fetchBreakingNews();
    // Refresh breaking news every 5 minutes
    const interval = setInterval(fetchBreakingNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length >= 2) {
        setSearchLoading(true);
        setIsSearchMode(true);
        try {
          const results = await searchNews(debouncedSearchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else if (debouncedSearchQuery.trim().length === 0) {
        setIsSearchMode(false);
        setSearchResults([]);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    setSearchResults([]);
  };

  // Fetch news when location or section changes
  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const sectionKeys = getSectionKeys();
        const sectionKey = sectionKeys[activeSection];
        const articles = await getLocationSpecificNews(location, sectionKey);
        setNewsArticles(articles);
      } catch (error) {
        console.error("Error fetching news:", error);
        setNewsArticles([]);
      } finally {
        setNewsLoading(false);
      }
    };

    if (!isLoading) {
      fetchNews();
    }
  }, [location, activeSection, isLoading]);

  // Determine which articles to display
  const displayArticles = isSearchMode ? searchResults : newsArticles;
  const displayLoading = isSearchMode ? searchLoading : newsLoading;

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-8 h-8 border-2 border-muted border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-xl font-bold text-foreground">NewsFlash</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {locationLoading ? "Detecting your location..." : "Loading news..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <BreakingNews news={breakingNewsData} />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          <Sidebar
            currentTime={currentTime}
            location={location}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchClear={handleSearchClear}
            weatherLocation={weatherLocation}
            onWeatherLocationChange={setWeatherLocation}
            searchLoading={searchLoading}
          />

          <div className="lg:col-span-3 bg-background">
            <SectionNavigation
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              articleCount={displayArticles.length}
              location={location}
            />

            <NewsGrid
              articles={displayArticles}
              isLoading={displayLoading || (locationLoading && activeSection > 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
