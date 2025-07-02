// Enhanced caching service with LRU implementation and better memory management

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class NewsCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly maxAge: number;

  constructor(maxEntries = 100, maxAgeMs = 30 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.maxAge = maxAgeMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry is expired
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data;
  }

  set(key: string, data: T): void {
    const now = Date.now();
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalAccessCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        expiredEntries++;
      } else {
        validEntries++;
        totalAccessCount += entry.accessCount;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      averageAccessCount: validEntries > 0 ? totalAccessCount / validEntries : 0,
      memoryUsage: this.cache.size,
      maxEntries: this.maxEntries,
    };
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
