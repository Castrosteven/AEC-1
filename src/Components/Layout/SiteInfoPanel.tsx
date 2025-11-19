import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Ruler, FileText, Search } from 'lucide-react';

const SiteInfoPanel = () => {
  const [selectedSite, setSelectedSite] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');

  const mockSiteData = {
    address: '1010 Vienna, Stephansplatz 1',
    parcelId: 'AT-1010-001-23',
    zone: 'Kerngebiet A',
    buildingHeight: '32m',
    floorAreaRatio: '4.5',
    plotRatio: '0.8',
    currentFloors: 8,
    maxAllowedFloors: 12,
    restrictions: ['Historic District', 'Height Limitation', 'Facade Preservation']
  };

  const handleSearch = () => {
    // Mock search functionality
    if (searchAddress) {
      setSelectedSite(mockSiteData);
    }
  };

  return (
    <div className="h-full bg-panel flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-panel-border bg-panel-header">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Building className="w-5 h-5" />
          Site Information
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Search Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Vienna address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedSite && (
          <>
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="text-sm font-medium">{selectedSite.address}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Parcel ID</Label>
                  <p className="text-sm font-mono">{selectedSite.parcelId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Zoning</Label>
                  <Badge variant="secondary" className="mt-1">
                    {selectedSite.zone}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Building Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Building Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Current Floors</Label>
                    <p className="text-lg font-bold text-primary">{selectedSite.currentFloors}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max Allowed</Label>
                    <p className="text-lg font-bold text-green-600">{selectedSite.maxAllowedFloors}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Building Height</span>
                    <span className="text-sm font-medium">{selectedSite.buildingHeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Floor Area Ratio</span>
                    <span className="text-sm font-medium">{selectedSite.floorAreaRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Plot Ratio</span>
                    <span className="text-sm font-medium">{selectedSite.plotRatio}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Restrictions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Zoning Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedSite.restrictions.map((restriction, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {restriction}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Potential Analysis */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-800">Development Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    +{selectedSite.maxAllowedFloors - selectedSite.currentFloors} Floors
                  </div>
                  <p className="text-sm text-green-700">Additional floors possible</p>
                  <Button size="sm" className="w-full mt-3">
                    Analyze Development Options
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedSite && (
          <div className="flex items-center justify-center h-64 text-center">
            <div className="space-y-3">
              <Building className="w-12 h-12 text-muted-foreground mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No site selected</p>
                <p className="text-xs text-muted-foreground">
                  Search for an address or click on the map to get started
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteInfoPanel;