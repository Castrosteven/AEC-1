// Utility functions for map bounds calculations and caching

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface TileKey {
  x: number;
  y: number;
  zoom: number;
}

// Convert map bounds to string key for caching
export const boundsToKey = (bounds: MapBounds): string => {
  return `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`;
};

// Add buffer to bounds to preload nearby areas
export const addBoundsBuffer = (bounds: MapBounds, bufferPercent: number = 0.2): MapBounds => {
  const latBuffer = (bounds.north - bounds.south) * bufferPercent;
  const lngBuffer = (bounds.east - bounds.west) * bufferPercent;
  
  return {
    north: bounds.north + latBuffer,
    south: bounds.south - latBuffer,
    east: bounds.east + lngBuffer,
    west: bounds.west - lngBuffer
  };
};

// Convert bounds to Overpass API bbox format
export const boundsToOverpassBbox = (bounds: MapBounds): string => {
  return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
};

// Check if two bounds overlap
export const boundsOverlap = (bounds1: MapBounds, bounds2: MapBounds): boolean => {
  return !(bounds1.east < bounds2.west || 
           bounds2.east < bounds1.west || 
           bounds1.north < bounds2.south || 
           bounds2.north < bounds1.south);
};

// Check if bounds are within Vienna area
export const isWithinVienna = (bounds: MapBounds): boolean => {
  const viennaBounds = {
    north: 48.35,
    south: 48.10,
    east: 16.60,
    west: 16.20
  };
  
  return boundsOverlap(bounds, viennaBounds);
};

// Simple in-memory cache for loaded building areas
class BoundsCache {
  private cache = new Map<string, any>();
  private maxSize = 50; // Maximum number of cached areas

  set(bounds: MapBounds, data: any): void {
    const key = boundsToKey(bounds);
    
    // Simple LRU: remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      bounds
    });
  }

  get(bounds: MapBounds): any | null {
    const key = boundsToKey(bounds);
    const cached = this.cache.get(key);
    
    if (cached) {
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached.data;
    }
    
    return null;
  }

  // Find any cached data that overlaps with given bounds
  findOverlapping(bounds: MapBounds): any[] {
    const overlapping = [];
    
    for (const cached of this.cache.values()) {
      if (boundsOverlap(bounds, cached.bounds)) {
        overlapping.push(cached.data);
      }
    }
    
    return overlapping;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const buildingCache = new BoundsCache();