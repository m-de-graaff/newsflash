"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  averageAccessCount: number;
  memoryUsage: number;
  maxEntries: number;
}

interface PerformanceStats {
  cache: CacheStats;
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  rateLimit: {
    daily: { current: number; limit: number };
    hourly: { current: number; limit: number };
  };
}

export default function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV === "development") {
      // Simulate fetching performance stats (in a real app, this would come from an API)
      const mockStats: PerformanceStats = {
        cache: {
          totalEntries: 15,
          validEntries: 12,
          expiredEntries: 3,
          averageAccessCount: 2.4,
          memoryUsage: 15,
          maxEntries: 100,
        },
        apiCalls: {
          total: 42,
          successful: 38,
          failed: 4,
          averageResponseTime: 650,
        },
        rateLimit: {
          daily: { current: 12, limit: 180 },
          hourly: { current: 3, limit: 8 },
        },
      };

      setStats(mockStats);
    }
  }, []);

  if (process.env.NODE_ENV !== "development" || !stats) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        📊 Performance
      </button>
      
      {isVisible && (
        <Card className="w-80 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Performance Monitor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cache Stats */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Cache Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Entries: {stats.cache.validEntries}/{stats.cache.maxEntries}</div>
                <div>Hit Rate: {((stats.cache.averageAccessCount / stats.cache.totalEntries) * 100).toFixed(1)}%</div>
                <div>Expired: {stats.cache.expiredEntries}</div>
                <div>Memory: {stats.cache.memoryUsage}MB</div>
              </div>
            </div>

            {/* API Stats */}
            <div>
              <h4 className="font-semibold text-sm mb-2">API Performance</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total Calls: {stats.apiCalls.total}</div>
                <div>Success Rate: {((stats.apiCalls.successful / stats.apiCalls.total) * 100).toFixed(1)}%</div>
                <div>Failed: {stats.apiCalls.failed}</div>
                <div>Avg Time: {stats.apiCalls.averageResponseTime}ms</div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Rate Limits</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Daily:</span>
                  <span>{stats.rateLimit.daily.current}/{stats.rateLimit.daily.limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${(stats.rateLimit.daily.current / stats.rateLimit.daily.limit) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span>Hourly:</span>
                  <span>{stats.rateLimit.hourly.current}/{stats.rateLimit.hourly.limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{
                      width: `${(stats.rateLimit.hourly.current / stats.rateLimit.hourly.limit) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
