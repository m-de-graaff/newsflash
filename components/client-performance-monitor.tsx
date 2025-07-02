"use client";

import dynamic from "next/dynamic";

const PerformanceMonitor = dynamic(
  () => import("@/components/performance-monitor"),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function ClientPerformanceMonitor() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <PerformanceMonitor />;
}
