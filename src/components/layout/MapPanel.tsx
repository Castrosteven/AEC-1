import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Map, Layers, Eye, EyeOff, Settings, Loader2, RefreshCw } from 'lucide-react';
import { useViennaMapData } from '@/hooks/useViennaMapData';
import { useViewportBuildings } from '@/hooks/useViewportBuildings';
import { MapBounds } from '@/utils/mapBounds';

const MapPanel = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('pk.eyJ1IjoidG1icjI1MiIsImEiOiJjbWQ1MndiczgwbG0wMmlvaGs2ZGFiNTZmIn0.W4JAwcLbgw00ExuIAr9s7Q');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [layersVisible, setLayersVisible] = useState({
    parcels: true,
    zoning: true,
    buildings: true,
    restrictions: false
  });

  // Use separate hooks for districts/zoning vs viewport-based buildings
  const { data: viennaData, loading: districtLoading, error: districtError } = useViennaMapData();
  const { buildings: viewportBuildings, loading: buildingLoading, loadBuildings, clearCache, cacheInfo } = useViewportBuildings();

  // Load initial viewport buildings when map loads
  const loadViewportBuildings = useCallback(() => {
    if (!map.current) return;
    
    const bounds = map.current.getBounds();
    const mapBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
    
    loadBuildings(mapBounds);
  }, [loadBuildings]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !viennaData) return;

    console.log('Initializing map with Vienna data...');

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [16.373755, 48.208492], // Stephansdom coordinates (exact)
      zoom: 17,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add scale control
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }),
      'bottom-left'
    );

    // Load Vienna district and zoning data (keep existing functionality)
    map.current.on('load', () => {
      if (!map.current || !viennaData) return;

      console.log('Map loaded, adding Vienna district data...');

      // Add district data source
      map.current.addSource('vienna-districts', {
        type: 'geojson',
        data: viennaData.districts
      });

      // Add zoning data source (empty for now, but keep structure)
      map.current.addSource('vienna-zoning', {
        type: 'geojson',
        data: viennaData.zoning
      });

      // Add viewport-based buildings source (will be updated dynamically)
      map.current.addSource('viewport-buildings', {
        type: 'geojson',
        data: viewportBuildings
      });

      // Style viewport buildings layer
      map.current.addLayer({
        id: 'viewport-buildings-fill',
        type: 'fill',
        source: 'viewport-buildings',
        paint: {
          'fill-color': '#4a90e2',
          'fill-opacity': 0.6
        },
        layout: {
          'visibility': layersVisible.buildings ? 'visible' : 'none'
        }
      });

      map.current.addLayer({
        id: 'viewport-buildings-line',
        type: 'line',
        source: 'viewport-buildings',
        paint: {
          'line-color': '#2171b5',
          'line-width': 1
        },
        layout: {
          'visibility': layersVisible.buildings ? 'visible' : 'none'
        }
      });

      // Style zoning layer
      map.current.addLayer({
        id: 'zoning-fill',
        type: 'fill',
        source: 'vienna-zoning',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'WIDMUNG'], 'Wohngebiet'], '#90EE90',
            ['==', ['get', 'WIDMUNG'], 'Kerngebiet'], '#FFB347',
            ['==', ['get', 'WIDMUNG'], 'Industriegebiet'], '#FF6B6B',
            '#CCCCCC'
          ],
          'fill-opacity': 0.4
        },
        layout: {
          'visibility': layersVisible.zoning ? 'visible' : 'none'
        }
      });

      // Style districts layer
      map.current.addLayer({
        id: 'districts-line',
        type: 'line',
        source: 'vienna-districts',
        paint: {
          'line-color': '#333333',
          'line-width': 2,
          'line-dasharray': [2, 2]
        },
        layout: {
          'visibility': 'visible'
        }
      });

      // Add click handlers for viewport buildings
      map.current.on('click', 'viewport-buildings-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const properties = feature.properties;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold mb-2">Building Information</h3>
              <div class="space-y-1 text-sm">
                ${properties?.ADRESSE ? `<div><strong>Address:</strong> ${properties.ADRESSE}</div>` : ''}
                ${properties?.BAUWEISE ? `<div><strong>Construction:</strong> ${properties.BAUWEISE}</div>` : ''}
                ${properties?.STOCKWERKE ? `<div><strong>Floors:</strong> ${properties.STOCKWERKE}</div>` : ''}
                ${properties?.BAUJAHR ? `<div><strong>Built:</strong> ${properties.BAUJAHR}</div>` : ''}
                ${properties?.NAME ? `<div><strong>Name:</strong> ${properties.NAME}</div>` : ''}
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Add click handlers for zoning
      map.current.on('click', 'zoning-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const properties = feature.properties;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold mb-2">Zoning Information</h3>
              <div class="space-y-1 text-sm">
                ${properties?.WIDMUNG ? `<div><strong>Zoning:</strong> ${properties.WIDMUNG}</div>` : ''}
                ${properties?.NUTZUNGSART ? `<div><strong>Use:</strong> ${properties.NUTZUNGSART}</div>` : ''}
                ${properties?.BAUKLASSE ? `<div><strong>Building Class:</strong> ${properties.BAUKLASSE}</div>` : ''}
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      // Change cursor on hover for viewport buildings
      map.current.on('mouseenter', 'viewport-buildings-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'viewport-buildings-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'zoning-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'zoning-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      // Add viewport-based building loading on map move
      let moveTimeout: NodeJS.Timeout;
      map.current.on('moveend', () => {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(loadViewportBuildings, 500); // Debounce map moves
      });

      // Load initial buildings for current viewport
      loadViewportBuildings();

      console.log('Vienna map layers added successfully');
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, viennaData, layersVisible, loadViewportBuildings]);

  // Update viewport buildings source when data changes
  useEffect(() => {
    if (map.current && map.current.getSource('viewport-buildings')) {
      const source = map.current.getSource('viewport-buildings') as mapboxgl.GeoJSONSource;
      source.setData(viewportBuildings);
    }
  }, [viewportBuildings]);

  const toggleLayer = (layerName: string) => {
    setLayersVisible(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
    
    if (map.current) {
      const visibility = layersVisible[layerName] ? 'none' : 'visible';
      
      switch (layerName) {
        case 'buildings':
          map.current.setLayoutProperty('viewport-buildings-fill', 'visibility', visibility);
          map.current.setLayoutProperty('viewport-buildings-line', 'visibility', visibility);
          break;
        case 'zoning':
          map.current.setLayoutProperty('zoning-fill', 'visibility', visibility);
          break;
        case 'parcels':
          // Keep for backward compatibility if we add parcel-specific layers later
          break;
      }
    }
  };

  if (showTokenInput) {
    return (
      <div className="h-full bg-panel flex flex-col">
        <div className="p-4 border-b border-panel-border bg-panel-header">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5" />
            Vienna Parcel Map
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6">
            <div className="text-center space-y-4">
              <Map className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold mb-2">Mapbox Configuration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your Mapbox public token to load the Vienna parcel map
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                />
                <Button 
                  onClick={() => setShowTokenInput(false)}
                  disabled={!mapboxToken}
                  className="w-full"
                >
                  Load Map
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your token at{' '}
                <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  mapbox.com
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (districtLoading) {
    return (
      <div className="h-full bg-panel flex flex-col">
        <div className="p-4 border-b border-panel-border bg-panel-header">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5" />
            Vienna Parcel Map
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <div>
              <h3 className="font-semibold mb-2">Loading Vienna Data</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we load the Vienna parcel information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (districtError) {
    return (
      <div className="h-full bg-panel flex flex-col">
        <div className="p-4 border-b border-panel-border bg-panel-header">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5" />
            Vienna Parcel Map
          </h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Map className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-destructive">Data Loading Error</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {districtError}
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Retry Loading
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-panel flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-panel-border bg-panel-header">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5" />
            Vienna Parcel Map
          </h2>
          <div className="flex items-center gap-2">
            {buildingLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
            <Button variant="ghost" size="sm" onClick={clearCache} title="Clear building cache">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTokenInput(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map Layers Control */}
      <div className="p-3 border-b border-panel-border bg-panel-header/50">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Layers:</span>
          </div>
          {Object.entries(layersVisible).map(([key, visible]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => toggleLayer(key)}
              className="h-7 px-2"
            >
              {visible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              <span className="text-xs capitalize">{key}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Buildings loaded: {cacheInfo.totalBuildings}</span>
          <span>Cache areas: {cacheInfo.size}</span>
          {buildingLoading && <span className="text-primary">Loading viewport...</span>}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 min-w-48">
          <h4 className="font-semibold text-sm mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-primary/30 border border-primary rounded"></div>
              <span>Selected Parcel</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">A</Badge>
              <span>Kerngebiet A (Core Area)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-green-50">+4</Badge>
              <span>Additional floors possible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
