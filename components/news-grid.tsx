"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArticleDialog } from "@/components/article-dialog";

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  time: string;
  location: string;
  image: string;
  url?: string;
  link?: string;
  content?: string;
  source_name?: string;
}

interface NewsGridProps {
  articles: NewsArticle[];
  isLoading?: boolean;
}

export function NewsGrid({ articles, isLoading = false }: NewsGridProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-0 bg-card animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-3" />
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2 text-foreground">No articles found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search terms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article, index) => (
          <Card
            key={article.id}
            className="border-0 bg-card hover:shadow-lg transition-all duration-300 group cursor-pointer hover:bg-card/80 hover:scale-[1.02] active:scale-[0.98]"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleArticleClick(article)}
          >
            <div className="relative aspect-video overflow-hidden rounded-t-lg">
              <img
                src={article.image || "/placeholder.svg"}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <Badge className="mb-2 text-xs bg-secondary/90 text-secondary-foreground backdrop-blur-sm">
                  {article.category}
                </Badge>
                <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-white/90 transition-colors">
                  {article.title}
                </h3>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm line-clamp-2 mb-3 text-muted-foreground group-hover:text-foreground/80 transition-colors">
                {article.summary}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{article.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {article.source_name && (
                    <span className="text-xs bg-muted/50 px-2 py-1 rounded">
                      {article.source_name}
                    </span>
                  )}
                  <span>{article.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Article Detail Dialog */}
      <ArticleDialog
        article={selectedArticle}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
