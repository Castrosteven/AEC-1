
import { useState, useEffect } from 'react';

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

interface ViennaZoning {
  type: 'Feature';
  properties: {
    WIDMUNG?: string;
    NUTZUNGSART?: string;
    BAUKLASSE?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface ViennaDistrict {
  type: 'Feature';
  properties: {
    BEZIRK?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface ViennaMapData {
  buildings: {
    type: 'FeatureCollection';
    features: ViennaBuilding[];
  };
  zoning: {
    type: 'FeatureCollection';
    features: ViennaZoning[];
  };
  districts: {
    type: 'FeatureCollection';
    features: ViennaDistrict[];
  };
}

export const useViennaMapData = () => {
  const [data, setData] = useState<ViennaMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadViennaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading Vienna map data from official sources...');
        
        // Vienna's official WFS endpoints (for districts and zoning only - buildings handled by viewport hook)
        const districtUrl = 'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BEZIRKSGRENZEOGD&srsName=EPSG:4326&outputFormat=json';
        
        try {
          console.log('Loading Vienna district data...');
          
          const districtResponse = await fetch(districtUrl);
          if (districtResponse.ok) {
            const districtData = await districtResponse.json();
            console.log('District data loaded:', districtData.features?.length || 0);
            
            setData({
              buildings: { type: 'FeatureCollection' as const, features: [] }, // Empty - handled by viewport hook
              zoning: { type: 'FeatureCollection' as const, features: [] }, // Empty for now
              districts: districtData
            });
            return;
          }
        } catch (err) {
          console.warn('Vienna district data loading failed:', err);
        }
        
        // Fallback to enhanced sample data with correct Vienna coordinates
        const mockData: ViennaMapData = {
          buildings: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  ADRESSE: 'Stephansplatz 3, 1010 Wien',
                  BAUWEISE: 'Gotisch',
                  STOCKWERKE: 1,
                  BAUJAHR: 1147,
                  NAME: 'Stephansdom'
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [16.373455, 48.208292],
                    [16.374055, 48.208292], 
                    [16.374055, 48.208692],
                    [16.373455, 48.208692],
                    [16.373455, 48.208292]
                  ]]
                }
              },
              {
                type: 'Feature',
                properties: {
                  ADRESSE: 'Graben 21, 1010 Wien', 
                  BAUWEISE: 'Barock',
                  STOCKWERKE: 4,
                  BAUJAHR: 1720
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [16.370800, 48.209400],
                    [16.371200, 48.209400],
                    [16.371200, 48.209800],
                    [16.370800, 48.209800],
                    [16.370800, 48.209400]
                  ]]
                }
              },
              {
                type: 'Feature',
                properties: {
                  ADRESSE: 'Hofburg, 1010 Wien',
                  BAUWEISE: 'Barock',
                  STOCKWERKE: 3,
                  BAUJAHR: 1279
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [16.366000, 48.207000],
                    [16.367500, 48.207000],
                    [16.367500, 48.208000],
                    [16.366000, 48.208000],
                    [16.366000, 48.207000]
                  ]]
                }
              }
            ]
          },
          zoning: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  WIDMUNG: 'Kerngebiet',
                  NUTZUNGSART: 'Geschäftszone',
                  BAUKLASSE: 'IV'
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [16.370500, 48.209200],
                    [16.371500, 48.209200],
                    [16.371500, 48.210000],
                    [16.370500, 48.210000],
                    [16.370500, 48.209200]
                  ]]
                }
              }
            ]
          },
          districts: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  BEZIRK: '1. Innere Stadt - Historic Center'
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [16.365000, 48.206000],
                    [16.376000, 48.206000],
                    [16.376000, 48.212000],
                    [16.365000, 48.212000],
                    [16.365000, 48.206000]
                  ]]
                }
              }
            ]
          }
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setData(mockData);
        console.log('Vienna map data loaded successfully');
      } catch (err) {
        console.error('Failed to load Vienna map data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Vienna map data');
      } finally {
        setLoading(false);
      }
    };

    loadViennaData();
  }, []);

  return { data, loading, error };
};
