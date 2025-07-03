"use client";

import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  showClearButton?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search articles...",
  isLoading = false,
  showClearButton = true,
}: SearchBarProps) {
  return (
    <div className="animate-in slide-in-from-left duration-700 delay-100">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
          )}
          {showClearButton && value && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
