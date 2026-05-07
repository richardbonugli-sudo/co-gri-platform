/**
 * Audit Cache Manager
 * 
 * Manages caching of audit results to avoid re-running expensive audits
 */

export class AuditCacheManager {
  private memoryCache: Map<string, { data: any; expires: number }> = new Map();
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  /**
   * Get cached audit results
   */
  async get(auditId: string): Promise<any | null> {
    const key = `${this.namespace}:${auditId}`;
    const cached = this.memoryCache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Remove expired entry
    if (cached) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  /**
   * Store audit results in cache
   */
  async set(auditId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `${this.namespace}:${auditId}`;
    const expires = Date.now() + (ttl * 1000);

    this.memoryCache.set(key, { data, expires });
  }

  /**
   * Invalidate cached audit
   */
  async invalidate(auditId: string): Promise<void> {
    const key = `${this.namespace}:${auditId}`;
    this.memoryCache.delete(key);
  }

  /**
   * Clear all cache entries for this namespace
   */
  async clearAll(): Promise<void> {
    const keysToDelete: string[] = [];
    
    this.memoryCache.forEach((_, key) => {
      if (key.startsWith(`${this.namespace}:`)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }
}