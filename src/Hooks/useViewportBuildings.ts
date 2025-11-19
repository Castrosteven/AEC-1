import { useState, useCallback, useRef } from 'react';
import { MapBounds, boundsToOverpassBbox, addBoundsBuffer, isWithinVienna, buildingCache } from '@/utils/mapBounds';

interface ViennaBuilding {
  type: 'Feature';
  properties: {
    ADRESSE?: string;
    BAUWEISE?: string;
    STOCKWERKE?: number;
    BAUJAHR?: number;
    NAME?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface ViewportBuildingsResult {
  buildings: {
    type: 'FeatureCollection';
    features: ViennaBuilding[];
  };
  loading: boolean;
  error: string | null;
  loadBuildings: (bounds: MapBounds) => Promise<void>;
  clearCache: () => void;
  cacheInfo: {
    size: number;
    totalBuildings: number;
  };
}

export const useViewportBuildings = (): ViewportBuildingsResult => {
  const [buildings, setBuildings] = useState<{
    type: 'FeatureCollection';
    features: ViennaBuilding[];
  }>({
    type: 'FeatureCollection',
    features: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef<Set<string>>(new Set());

  // Helper functions for better building classification
  const getBuildingType = useCallback((tags: any): string => {
    if (tags.building && tags.building !== 'yes') return tags.building;
    if (tags['building:part']) return tags['building:part'];
    if (tags.landuse) return `${tags.landuse} area`;
    if (tags.man_made) return tags.man_made;
    if (tags.amenity) return tags.amenity;
    if (tags.leisure) return tags.leisure;
    if (tags.shop) return `shop (${tags.shop})`;
    if (tags.office) return 'office';
    if (tags.tourism) return tags.tourism;
    if (tags.historic) return tags.historic;
    if (tags.aeroway) return tags.aeroway;
    if (tags.railway) return tags.railway;
    if (tags.public_transport) return tags.public_transport;
    if (tags.craft) return tags.craft;
    if (tags.industrial) return tags.industrial;
    return 'structure';
  }, []);
  
  const getBuildingTypeLabel = useCallback((tags: any): string => {
    if (tags.building && tags.building !== 'yes') return `${tags.building} building`;
    if (tags['building:part']) return 'building part';
    if (tags.landuse) return `${tags.landuse} area`;
    if (tags.man_made) return tags.man_made;
    if (tags.amenity) return tags.amenity;
    if (tags.leisure) return tags.leisure;
    if (tags.shop) return 'shop';
    if (tags.office) return 'office building';
    return 'Vienna Structure';
  }, []);

  // Convert OSM data to GeoJSON format with proper polygon validation
  const convertOSMToGeoJSON = useCallback((data: any): ViennaBuilding[] => {
    const validBuildings: ViennaBuilding[] = [];
    
    data.elements?.forEach(element => {
      // Skip elements without geometry or tags
      if (!element.geometry || !element.tags) return;
      
      // Check if element has meaningful structure tags
      const tags = element.tags;
      const hasStructureTag = tags.building || 
             tags['building:part'] || 
             tags.landuse || 
             tags.man_made || 
             tags.amenity || 
             tags.leisure || 
             tags.shop || 
             tags.office ||
             tags.tourism ||
             tags.historic ||
             tags.aeroway ||
             tags.railway ||
             tags.public_transport ||
             tags.craft ||
             tags.industrial;
             
      if (!hasStructureTag && !(element.type === 'way' && element.geometry.length > 3)) return;
      
      let coords: number[][] = [];
      
      try {
        if (element.type === 'way' && Array.isArray(element.geometry)) {
          coords = element.geometry
            .filter(node => node && typeof node.lon === 'number' && typeof node.lat === 'number')
            .map(node => [node.lon, node.lat]);
        } else if (element.type === 'relation' && element.members) {
          // Handle multipolygon relations - take the first outer way
          const outerWays = element.members.filter(member => 
            member.type === 'way' && 
            member.role === 'outer' && 
            member.geometry && 
            Array.isArray(member.geometry)
          );
          
          if (outerWays.length > 0) {
            coords = outerWays[0].geometry
              .filter(node => node && typeof node.lon === 'number' && typeof node.lat === 'number')
              .map(node => [node.lon, node.lat]);
          }
        }
        
        // Validate polygon geometry
        if (coords.length < 4) return; // Need at least 4 points for a valid polygon
        
        // Check for valid coordinate ranges (Vienna bounds roughly)
        const invalidCoords = coords.some(coord => 
          !Array.isArray(coord) || 
          coord.length !== 2 || 
          typeof coord[0] !== 'number' || 
          typeof coord[1] !== 'number' ||
          coord[0] < 16.0 || coord[0] > 17.0 || // Rough longitude bounds for Vienna
          coord[1] < 48.0 || coord[1] > 48.5    // Rough latitude bounds for Vienna
        );
        
        if (invalidCoords) {
          console.warn('Invalid coordinates found, skipping polygon');
          return;
        }
        
        // Ensure polygon is closed
        const firstCoord = coords[0];
        const lastCoord = coords[coords.length - 1];
        if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
          coords.push([firstCoord[0], firstCoord[1]]);
        }
        
        // Check for self-intersection (basic check)
        if (coords.length > 100) {
          console.warn('Polygon too complex, skipping');
          return;
        }
        
        const building: ViennaBuilding = {
          type: 'Feature',
          properties: {
            ADRESSE: tags['addr:street'] && tags['addr:housenumber'] 
              ? `${tags['addr:street']} ${tags['addr:housenumber']}` 
              : tags.name || getBuildingTypeLabel(tags),
            BAUWEISE: getBuildingType(tags),
            STOCKWERKE: tags['building:levels'] || tags.levels ? 
              parseInt(tags['building:levels'] || tags.levels) : undefined,
            NAME: tags.name || undefined
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        };
        
        validBuildings.push(building);
        
      } catch (error) {
        console.warn('Error processing building geometry:', error);
      }
    });
    
    console.log(`Processed ${data.elements?.length || 0} elements, created ${validBuildings.length} valid buildings`);
    return validBuildings;
  }, [getBuildingType, getBuildingTypeLabel]);

  const loadBuildings = useCallback(async (bounds: MapBounds) => {
    // Only load if within Vienna area
    if (!isWithinVienna(bounds)) {
      console.log('Bounds outside Vienna area, skipping building load');
      return;
    }

    // Add buffer to preload nearby areas
    const bufferedBounds = addBoundsBuffer(bounds, 0.3);
    const bbox = boundsToOverpassBbox(bufferedBounds);
    const boundsKey = `${bbox}`;

    // Check if already loading this area
    if (loadingRef.current.has(boundsKey)) {
      console.log('Already loading this area:', boundsKey);
      return;
    }

    // Check cache first
    const cachedData = buildingCache.get(bufferedBounds);
    if (cachedData) {
      console.log('Using cached building data for bounds:', boundsKey);
      setBuildings(prev => ({
        type: 'FeatureCollection',
        features: [...prev.features, ...cachedData.features]
      }));
      return;
    }

    setLoading(true);
    setError(null);
    loadingRef.current.add(boundsKey);

    try {
      console.log('Loading buildings for viewport bounds:', bbox);

      // Comprehensive Overpass query to capture ALL building footprints
      const overpassQuery = `[out:json][timeout:30][maxsize:536870912];
        (
          way["building"](${bbox});
          way["building:part"](${bbox});
          way["landuse"](${bbox});
          way["man_made"](${bbox});
          way["amenity"](${bbox});
          way["leisure"](${bbox});
          way["shop"](${bbox});
          way["office"](${bbox});
          way["tourism"](${bbox});
          way["historic"](${bbox});
          way["aeroway"](${bbox});
          way["railway"](${bbox});
          way["public_transport"](${bbox});
          way["craft"](${bbox});
          way["industrial"](${bbox});
          relation["building"](${bbox});
          relation["building:part"](${bbox});
          relation["landuse"](${bbox});
          relation["man_made"](${bbox});
          relation["amenity"](${bbox});
          relation["leisure"](${bbox});
          relation["shop"](${bbox});
          relation["office"](${bbox});
          relation["tourism"](${bbox});
          relation["historic"](${bbox});
          relation["aeroway"](${bbox});
          relation["railway"](${bbox});
          relation["public_transport"](${bbox});
          relation["craft"](${bbox});
          relation["industrial"](${bbox});
        );
        out geom;`;
      
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

      const response = await fetch(overpassUrl);
      
      if (!response.ok) {
        throw new Error(`Overpass API failed: ${response.status}`);
      }

      const data = await response.json();
      const newBuildings = convertOSMToGeoJSON(data);
      
      console.log(`Loaded ${newBuildings.length} buildings for viewport`);

      const newBuildingData = {
        type: 'FeatureCollection' as const,
        features: newBuildings
      };

      // Cache the result
      buildingCache.set(bufferedBounds, newBuildingData);

      // Merge with existing buildings (avoid duplicates by checking coordinates)
      setBuildings(prev => {
        const existingCoords = new Set(prev.features.map(f => 
          f.geometry.coordinates[0][0].join(',')
        ));
        
        const uniqueNewBuildings = newBuildings.filter(building =>
          !existingCoords.has(building.geometry.coordinates[0][0].join(','))
        );

        return {
          type: 'FeatureCollection',
          features: [...prev.features, ...uniqueNewBuildings]
        };
      });

    } catch (err) {
      console.error('Failed to load viewport buildings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load buildings');
    } finally {
      setLoading(false);
      loadingRef.current.delete(boundsKey);
    }
  }, [convertOSMToGeoJSON]);

  const clearCache = useCallback(() => {
    buildingCache.clear();
    setBuildings({ type: 'FeatureCollection', features: [] });
    console.log('Building cache cleared');
  }, []);

  const cacheInfo = {
    size: buildingCache.size(),
    totalBuildings: buildings.features.length
  };

  return {
    buildings,
    loading,
    error,
    loadBuildings,
    clearCache,
    cacheInfo
  };
};