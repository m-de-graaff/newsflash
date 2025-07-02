"use client";

import { useState, useEffect } from "react";
import { getUserLocation, type IPInfo } from "@/lib/ip-utils";

export function useGeolocation() {
  const [location, setLocation] = useState<IPInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locationData = await getUserLocation();
        setLocation(locationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get location");
        // Set fallback location
        setLocation({
          ip: "0.0.0.0",
          country: "United States",
          region: "Delaware",
          city: "Wilmington",
          countryCode: "US",
          regionCode: "DE",
          timezone: "America/New_York",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, isLoading, error };
}
