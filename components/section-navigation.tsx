"use client";

import { Globe, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IPInfo } from "@/lib/ip-utils";
import { getSectionNames } from "@/lib/location-hierarchy";
import { useState, useRef, useEffect } from "react";

interface SectionNavigationProps {
  activeSection: number;
  onSectionChange: (index: number) => void;
  articleCount: number;
  location: IPInfo | null;
}

export function SectionNavigation({
  activeSection,
  onSectionChange,
  articleCount,
  location,
}: SectionNavigationProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState({});
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sectionNames = getSectionNames(location);
  const icons = [Globe, MapPin]; // Only worldwide and country

  const sections = sectionNames.map((name, index) => ({
    name,
    key: ["worldwide", "country"][index],
    icon: icons[index],
  }));

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  useEffect(() => {
    const activeElement = tabRefs.current[activeSection];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeSection]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const firstElement = tabRefs.current[0];
      if (firstElement) {
        const { offsetLeft, offsetWidth } = firstElement;
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    });
  }, []);

  return (
    <div className="p-8 pb-4 border-b border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          {/* Hover Highlight */}
          <div
            className="absolute h-[40px] transition-all duration-300 ease-out bg-muted/50 rounded-md flex items-center"
            style={{
              ...hoverStyle,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
          />

          {/* Active Indicator */}
          <div
            className="absolute bottom-[-6px] h-[2px] bg-primary transition-all duration-300 ease-out"
            style={activeStyle}
          />

          {/* Tabs */}
          <div className="relative flex space-x-1 items-center">
            {sections.map((section, index) => (
              <div
                key={section.key}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                className={`px-4 py-2 cursor-pointer transition-colors duration-300 h-[40px] flex items-center space-x-2 whitespace-nowrap ${
                  index === activeSection
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } ${
                  !location && index > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onMouseEnter={() =>
                  (location || index === 0) && setHoveredIndex(index)
                }
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() =>
                  (location || index === 0) && onSectionChange(index)
                }
              >
                <section.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{section.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSectionChange(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onSectionChange(Math.min(sections.length - 1, activeSection + 1))
            }
            disabled={activeSection === sections.length - 1}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {articleCount} articles in{" "}
          {sections[activeSection]?.name || "Loading..."}
        </div>

        {location && (
          <div className="text-xs text-muted-foreground">
            {location.city}, {location.region}, {location.country}
          </div>
        )}
      </div>
    </div>
  );
}
