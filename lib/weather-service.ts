interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  feelsLike: number;
  location: string;
  forecast: Array<{
    date: string;
    day: string;
    temperature: {
      max: number;
      min: number;
    };
    condition: string;
    conditionCode: number;
    chanceOfRain: number;
  }>;
}

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 60, windowMs = 60000) {
    // 60 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key)!;

    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      (timestamp) => timestamp > windowStart
    );
    this.requests.set(key, validTimestamps);

    return validTimestamps.length < this.maxRequests;
  }

  recordRequest(key: string): void {
    const now = Date.now();
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    this.requests.get(key)!.push(now);
  }

  getTimeUntilReset(key: string): number {
    if (!this.requests.has(key)) return 0;

    const timestamps = this.requests.get(key)!;
    if (timestamps.length === 0) return 0;

    const oldestTimestamp = Math.min(...timestamps);
    return Math.max(0, oldestTimestamp + this.windowMs - Date.now());
  }
}

const rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute

export class WeatherService {
  private baseUrl = "https://api.open-meteo.com/v1";
  private geocodingUrl = "https://geocoding-api.open-meteo.com/v1";

  async searchLocations(query: string): Promise<GeocodingResult[]> {
    const rateLimitKey = `geocoding_${query}`;

    if (!rateLimiter.canMakeRequest(rateLimitKey)) {
      const waitTime = rateLimiter.getTimeUntilReset(rateLimitKey);
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(
          waitTime / 1000
        )} seconds.`
      );
    }

    try {
      const response = await fetch(
        `${this.geocodingUrl}/search?name=${encodeURIComponent(
          query
        )}&count=5&language=en&format=json`
      );

      if (!response.ok) {
        throw new Error("Failed to search locations");
      }

      rateLimiter.recordRequest(rateLimitKey);
      const data = await response.json();

      return data.results || [];
    } catch (error) {
      console.error("Error searching locations:", error);
      throw error;
    }
  }

  async getWeatherData(
    latitude: number,
    longitude: number,
    locationName: string
  ): Promise<WeatherData> {
    const rateLimitKey = `weather_${latitude}_${longitude}`;

    if (!rateLimiter.canMakeRequest(rateLimitKey)) {
      const waitTime = rateLimiter.getTimeUntilReset(rateLimitKey);
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(
          waitTime / 1000
        )} seconds.`
      );
    }

    try {
      const currentWeatherUrl =
        `${this.baseUrl}/forecast?` +
        new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          current:
            "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl",
          hourly: "visibility,uv_index",
          daily:
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
          timezone: "auto",
          forecast_days: "7",
        });

      const response = await fetch(currentWeatherUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      rateLimiter.recordRequest(rateLimitKey);
      const data = await response.json();

      return this.parseWeatherData(data, locationName);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw error;
    }
  }

  async getWeatherByLocation(locationName: string): Promise<WeatherData> {
    const locations = await this.searchLocations(locationName);

    if (locations.length === 0) {
      throw new Error("Location not found");
    }

    const location = locations[0];
    return this.getWeatherData(
      location.latitude,
      location.longitude,
      location.name
    );
  }

  private parseWeatherData(data: any, locationName: string): WeatherData {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // Get current UV index and visibility
    const currentHour = new Date().getHours();
    const currentUvIndex = hourly.uv_index[currentHour] || 0;
    const currentVisibility = hourly.visibility[currentHour] || 0;

    return {
      temperature: Math.round(current.temperature_2m),
      condition: this.getWeatherCondition(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      uvIndex: currentUvIndex,
      visibility: Math.round(currentVisibility / 1000), // Convert to km
      pressure: Math.round(current.pressure_msl),
      feelsLike: Math.round(current.apparent_temperature),
      location: locationName,
      forecast: daily.time.slice(0, 7).map((date: string, index: number) => ({
        date,
        day: this.getDayName(date, index),
        temperature: {
          max: Math.round(daily.temperature_2m_max[index]),
          min: Math.round(daily.temperature_2m_min[index]),
        },
        condition: this.getWeatherCondition(daily.weather_code[index]),
        conditionCode: daily.weather_code[index],
        chanceOfRain: daily.precipitation_probability_max[index] || 0,
      })),
    };
  }

  private getWeatherCondition(code: number): string {
    const conditions: Record<number, string> = {
      0: "Clear",
      1: "Mainly Clear",
      2: "Partly Cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Rime Fog",
      51: "Light Drizzle",
      53: "Moderate Drizzle",
      55: "Dense Drizzle",
      56: "Light Freezing Drizzle",
      57: "Dense Freezing Drizzle",
      61: "Slight Rain",
      63: "Moderate Rain",
      65: "Heavy Rain",
      66: "Light Freezing Rain",
      67: "Heavy Freezing Rain",
      71: "Slight Snow",
      73: "Moderate Snow",
      75: "Heavy Snow",
      77: "Snow Grains",
      80: "Slight Rain Showers",
      81: "Moderate Rain Showers",
      82: "Violent Rain Showers",
      85: "Slight Snow Showers",
      86: "Heavy Snow Showers",
      95: "Thunderstorm",
      96: "Thunderstorm with Hail",
      99: "Thunderstorm with Heavy Hail",
    };
    return conditions[code] || "Unknown";
  }

  private getDayName(dateString: string, index: number): string {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
}

export const weatherService = new WeatherService();
export type { WeatherData, GeocodingResult };
