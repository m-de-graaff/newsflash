export interface IPInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  countryCode: string;
  regionCode: string;
  timezone: string;
  // Additional fields for more detailed location
  district?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
}

export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Failed to get IP:", error);
    throw new Error("Failed to get IP address");
  }
}

export async function getLocationFromIP(ip?: string): Promise<IPInfo> {
  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.reason || "Location service error");
    }

    return {
      ip: data.ip,
      country: data.country_name,
      region: data.region,
      city: data.city,
      countryCode: data.country_code,
      regionCode: data.region_code,
      timezone: data.timezone,
      district: data.region, // Using region as district/province
      postal: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error("Failed to get location:", error);
    // Fallback to default location
    return {
      ip: "0.0.0.0",
      country: "United States",
      region: "Pennsylvania",
      city: "Philadelphia",
      countryCode: "US",
      regionCode: "PA",
      timezone: "America/New_York",
      district: "Pennsylvania",
      postal: "19101",
    };
  }
}

// Enhanced location detection with more detailed information
export async function getDetailedLocation(): Promise<IPInfo> {
  try {
    // Try multiple services for better accuracy
    const ip = await getUserIP();

    // First try ipapi.co for detailed info
    try {
      return await getLocationFromIP(ip);
    } catch {
      // Fallback to a different service if needed
      return await getLocationFromIP();
    }
  } catch (error) {
    console.error("Failed to get detailed location:", error);
    // Return a more detailed fallback
    return {
      ip: "0.0.0.0",
      country: "United States",
      region: "Pennsylvania",
      city: "Philadelphia",
      countryCode: "US",
      regionCode: "PA",
      timezone: "America/New_York",
      district: "Pennsylvania",
      postal: "19101",
    };
  }
}

export async function getUserLocation(): Promise<IPInfo> {
  return await getDetailedLocation();
}
