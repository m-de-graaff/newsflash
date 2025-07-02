import type { IPInfo } from "./ip-utils";

export interface LocationHierarchy {
  worldwide: string;
  country: string;
}

export function getLocationHierarchy(
  location: IPInfo | null
): LocationHierarchy {
  if (!location) {
    return {
      worldwide: "Worldwide",
      country: "Loading...",
    };
  }

  return {
    worldwide: "Worldwide",
    country: location.country,
  };
}

// Get appropriate section names based on location
export function getSectionNames(location: IPInfo | null): string[] {
  const hierarchy = getLocationHierarchy(location);
  return [hierarchy.worldwide, hierarchy.country];
}

// Get section keys for data fetching
export function getSectionKeys(): string[] {
  return ["worldwide", "country"];
}
