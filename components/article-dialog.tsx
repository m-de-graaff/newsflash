"use client";

import { useState } from "react";
import { ExternalLink, Clock, MapPin, Tag, Share2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/components/news-grid";

interface ArticleDialogProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleDialog({ article, isOpen, onOpenChange }: ArticleDialogProps) {
  const [isSharing, setIsSharing] = useState(false);

  if (!article) return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${article.title}\n\n${article.summary}\n\nRead more at: ${window.location.href}`
        );
        // You could add a toast notification here
      }
    } catch (error) {
      console.log("Sharing failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleReadMore = () => {
    // Extract the actual article URL from the article data
    const articleUrl = (article as any).url || (article as any).link || '';
    
    console.log('Article data:', {
      url: (article as any).url,
      link: (article as any).link,
      articleUrl,
      source_type: (article as any).source_type
    });
    
    if (articleUrl && articleUrl !== '#' && articleUrl.startsWith('http')) {
      window.open(articleUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: try to construct URL based on source
      console.warn('No valid URL found for article:', article.title);
      alert('Sorry, this article URL is not available. Please try another article.');
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryInfo: Record<string, { description: string; color: string }> = {
      breaking: {
        description: "Latest breaking news and urgent updates from around the world",
        color: "bg-red-500 text-white",
      },
      world: {
        description: "International news, global politics, and world events",
        color: "bg-blue-500 text-white",
      },
      business: {
        description: "Financial markets, economy, and corporate news",
        color: "bg-green-500 text-white",
      },
      technology: {
        description: "Tech innovations, digital trends, and scientific breakthroughs",
        color: "bg-purple-500 text-white",
      },
      politics: {
        description: "Political developments, government policies, and elections",
        color: "bg-indigo-500 text-white",
      },
      sports: {
        description: "Sports news, match results, and athletic achievements",
        color: "bg-orange-500 text-white",
      },
      entertainment: {
        description: "Celebrity news, movies, music, and entertainment industry",
        color: "bg-pink-500 text-white",
      },
      health: {
        description: "Medical breakthroughs, health tips, and wellness news",
        color: "bg-teal-500 text-white",
      },
      science: {
        description: "Scientific discoveries, research findings, and innovations",
        color: "bg-cyan-500 text-white",
      },
      general: {
        description: "General news and current events from reliable sources",
        color: "bg-gray-500 text-white",
      },
    };

    return categoryInfo[category.toLowerCase()] || categoryInfo.general;
  };

  const categoryInfo = getCategoryInfo(article.category);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <div className="space-y-4">
            {/* Article Image */}
            {article.image && (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            )}

            {/* Category Badge */}
            <div className="flex items-center justify-between">
              <Badge className={`${categoryInfo.color} font-medium`}>
                <Tag className="w-3 h-3 mr-1" />
                {article.category}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={isSharing}
                className="text-muted-foreground hover:text-foreground"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            {/* Article Title */}
            <DialogTitle className="text-xl font-bold leading-tight text-foreground pr-6">
              {article.title}
            </DialogTitle>

            {/* Article Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{article.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{article.location}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Article Summary/Description */}
          <DialogDescription className="text-base leading-relaxed text-foreground">
            {article.summary.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()}
          </DialogDescription>

          {/* Extended Content (if available) */}
          {(article as any).content && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Article Details
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-6">
                {((article as any).content || '').replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()}
              </p>
            </div>
          )}

          {/* Category Information */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-foreground">About {article.category} News</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {categoryInfo.description}
            </p>
          </div>

          {/* Source Information */}
          {(article as any).source_name && (
            <div className="bg-muted/20 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-foreground">Source Information</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {(article as any).source_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Trusted news source
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Verified
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button 
              onClick={handleReadMore}
              className="flex-1"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Read Full Article
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="lg"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
