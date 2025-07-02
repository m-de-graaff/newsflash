"use client";

import { useTheme } from "next-themes";
import { Clock, MapPin, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IPInfo } from "@/lib/ip-utils";

interface HeaderProps {
  currentTime: Date;
  location: IPInfo | null;
}

export function Header({ currentTime, location }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  const getLocationString = (location: IPInfo | null): string => {
    if (!location) return "Detecting location...";
    return `${location.city}, ${location.region}, ${location.country}`;
  };

  return (
    <div className="animate-in slide-in-from-left duration-700">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-serif italic leading-tight text-foreground">
          NewsFlash
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="space-y-2 mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{getLocationString(location)}</span>
        </div>
        {location && location.ip && (
          <div className="text-xs text-muted-foreground/70">
            IP: {location.ip} • {location.timezone}
          </div>
        )}
      </div>
    </div>
  );
}
