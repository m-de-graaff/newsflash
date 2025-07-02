"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreakingNewsProps {
  news: string[];
}

export function BreakingNews({ news }: BreakingNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (news.length === 0) return;

    const ticker = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 6000);

    return () => clearInterval(ticker);
  }, [news.length]);

  if (!isVisible || news.length === 0) return null;

  return (
    <div className="bg-red-600 text-white py-3 px-6 relative animate-in slide-in-from-top duration-500">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold text-sm">BREAKING</span>
            <span className="text-xs opacity-75">• LIVE</span>
          </div>
          <div
            className="text-sm animate-in fade-in duration-1000"
            key={currentIndex}
          >
            {news[currentIndex]}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
