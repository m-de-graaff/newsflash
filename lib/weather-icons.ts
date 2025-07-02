import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  Cloudy,
  CloudHail,
  Eye,
  EyeOff,
  Sunset,
} from "lucide-react";

export function getWeatherIcon(condition: string, isDay: boolean = true) {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes("clear")) {
    return Sun;
  }

  if (
    conditionLower.includes("partly cloudy") ||
    conditionLower.includes("mainly clear")
  ) {
    return isDay ? Cloudy : Sunset;
  }

  if (
    conditionLower.includes("overcast") ||
    conditionLower.includes("cloudy")
  ) {
    return Cloud;
  }

  if (conditionLower.includes("fog")) {
    return EyeOff;
  }

  if (conditionLower.includes("drizzle")) {
    return CloudDrizzle;
  }

  if (conditionLower.includes("rain") || conditionLower.includes("shower")) {
    return CloudRain;
  }

  if (conditionLower.includes("snow")) {
    return CloudSnow;
  }

  if (conditionLower.includes("thunderstorm")) {
    return CloudLightning;
  }

  if (conditionLower.includes("hail")) {
    return CloudHail;
  }

  // Default fallback
  return Cloud;
}

export function getWeatherIconColor(condition: string): string {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
    return "text-yellow-500";
  }

  if (
    conditionLower.includes("partly cloudy") ||
    conditionLower.includes("mainly clear")
  ) {
    return "text-yellow-400";
  }

  if (
    conditionLower.includes("rain") ||
    conditionLower.includes("drizzle") ||
    conditionLower.includes("shower")
  ) {
    return "text-blue-500";
  }

  if (conditionLower.includes("snow")) {
    return "text-blue-200";
  }

  if (conditionLower.includes("thunderstorm")) {
    return "text-purple-500";
  }

  if (conditionLower.includes("fog")) {
    return "text-gray-400";
  }

  // Default for cloudy/overcast
  return "text-gray-500";
}
