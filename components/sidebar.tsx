"use client";

import { Header } from "./header";
import { SearchBar } from "./search-bar";
import { WeatherWidget } from "./weather-widget";
import type { IPInfo } from "@/lib/ip-utils";

interface SidebarProps {
  currentTime: Date;
  location: IPInfo | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  weatherLocation: string;
  onWeatherLocationChange: (location: string) => void;
}

export function Sidebar({
  currentTime,
  location,
  searchQuery,
  onSearchChange,
  weatherLocation,
  onWeatherLocationChange,
}: SidebarProps) {
  return (
    <div className="lg:col-span-1 p-8 space-y-8 bg-background border-r border-border dark:border-border">
      <Header currentTime={currentTime} location={location} />
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      <WeatherWidget
        location={weatherLocation}
        onLocationChange={onWeatherLocationChange}
      />
    </div>
  );
}
