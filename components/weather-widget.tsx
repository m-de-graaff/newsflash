"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Droplets,
  Wind,
  Eye,
  Gauge,
  Thermometer,
  Sun as SunIcon,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { weatherService, type WeatherData } from "@/lib/weather-service";
import { getWeatherIcon, getWeatherIconColor } from "@/lib/weather-icons";
import { getLocationFromIP } from "@/lib/ip-utils";
import type { IPInfo } from "@/lib/ip-utils";

interface WeatherWidgetProps {
  location: string;
  onLocationChange: (location: string) => void;
}

export function WeatherWidget({
  location,
  onLocationChange,
}: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(location);
  const [detectedLocation, setDetectedLocation] = useState<IPInfo | null>(null);
  const [hasAutoFetched, setHasAutoFetched] = useState(false);

  const fetchWeatherData = useCallback(
    async (searchLocation: string) => {
      if (!searchLocation.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await weatherService.getWeatherByLocation(searchLocation);
        setWeatherData(data);
        onLocationChange(data.location);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch weather data"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onLocationChange]
  );

  // Watch for location prop changes and fetch weather
  useEffect(() => {
    if (location && location.trim()) {
      setSearchQuery(location);
      fetchWeatherData(location);
    } else if (!hasAutoFetched) {
      autoDetectLocation();
    }
  }, [location, fetchWeatherData, hasAutoFetched]); // Watch location changes

  const autoDetectLocation = async () => {
    if (hasAutoFetched) return;

    try {
      setIsLoading(true);
      const locationInfo = await getLocationFromIP();
      setDetectedLocation(locationInfo);

      // Use the detected location for weather
      const locationString = `${locationInfo.city}, ${locationInfo.country}`;
      setSearchQuery(locationString);

      const data = await weatherService.getWeatherData(
        locationInfo.latitude || 0,
        locationInfo.longitude || 0,
        locationString
      );
      setWeatherData(data);
      onLocationChange(locationString);
      setHasAutoFetched(true);
    } catch (err) {
      console.error("Auto-location detection failed:", err);
      setError("Failed to detect location automatically");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchWeatherData(searchQuery.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const renderWeatherContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading weather...
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-4 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <button
            onClick={() => fetchWeatherData(searchQuery)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!weatherData) {
      return (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Search for a city to view weather
          </p>
        </div>
      );
    }

    const MainIcon = getWeatherIcon(weatherData.condition);
    const iconColor = getWeatherIconColor(weatherData.condition);

    return (
      <>
        <div className="py-4">
          <div className="flex items-center space-x-4 mb-4">
            <MainIcon className={`h-12 w-12 ${iconColor}`} />
            <div>
              <div className="text-3xl font-bold text-foreground">
                {weatherData.temperature}°C
              </div>
              <div className="text-sm text-muted-foreground">
                {weatherData.condition}
              </div>
              <div className="text-xs text-muted-foreground">
                Feels like {weatherData.feelsLike}°C
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
            <div className="flex items-center space-x-2">
              <Droplets className="h-3 w-3" />
              <span>{weatherData.humidity}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="h-3 w-3" />
              <span>{weatherData.windSpeed} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-3 w-3" />
              <span>{weatherData.visibility} km</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gauge className="h-3 w-3" />
              <span>{weatherData.pressure} hPa</span>
            </div>
            <div className="flex items-center space-x-2">
              <SunIcon className="h-3 w-3" />
              <span>UV {weatherData.uvIndex}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            7-Day Forecast
          </h4>
          <div className="space-y-1">
            {weatherData.forecast.slice(0, 5).map((forecast, index) => {
              const ForecastIcon = getWeatherIcon(forecast.condition);
              const forecastIconColor = getWeatherIconColor(forecast.condition);

              return (
                <div
                  key={forecast.date}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground w-12">
                      {forecast.day}
                    </span>
                    <ForecastIcon className={`h-4 w-4 ${forecastIconColor}`} />
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-muted-foreground">
                      {forecast.temperature.min}°
                    </span>
                    <span className="text-foreground font-medium">
                      {forecast.temperature.max}°
                    </span>
                    {forecast.chanceOfRain > 0 && (
                      <span className="text-blue-500">
                        {forecast.chanceOfRain}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="animate-in slide-in-from-left duration-700 delay-200">
      <h3 className="text-lg font-medium mb-4 text-foreground">Weather</h3>
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground">
          {weatherData
            ? `Updated at ${new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Search for weather data"}
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search city..."
            value={searchQuery}
            onChange={handleInputChange}
            className="pl-10 text-sm bg-input border-border"
          />
        </form>

        {renderWeatherContent()}
      </div>
    </div>
  );
}
