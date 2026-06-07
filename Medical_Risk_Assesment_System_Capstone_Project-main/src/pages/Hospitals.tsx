import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, MapPin, Phone, Globe, Navigation, Loader2, List, Map as MapIcon, Hospital as HospitalIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom red icon for hospitals
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom blue icon for user
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Mock specialties for demo purposes
const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
  'Oncology', 'Dermatology', 'Emergency Medicine', 'General Surgery'
];

const getRandomSpecialties = () => {
  const shuffled = [...SPECIALTIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
};

// Component to center map on results/location
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 2 });
  }, [center, map]);
  return null;
}

interface HospitalLocation {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name: string;
  specialties?: string[];
  address?: any;
}

const Hospitals = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalLocation[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.0168, 76.9558]); // Default Coimbatore
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const { toast } = useToast();

  useEffect(() => {
    // Get user location on mount with high accuracy
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("Got location:", latitude, longitude);
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          // Auto search nearby
          searchHospitals(latitude, longitude);
        },
        (error) => {
          console.error("Location error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            toast({ title: "Location Denied", description: "Please enable location to find nearby hospitals.", variant: "destructive" });
          } else {
            // Default to Coimbatore/KCT if loc fails
            searchHospitals(11.0168, 76.9558);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const searchHospitals = async (lat?: number, lon?: number, manualQuery?: string) => {
    setLoading(true);
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&limit=25`;

      const searchLat = lat || mapCenter[0];
      const searchLon = lon || mapCenter[1];

      if (manualQuery) {
        url += `&q=${encodeURIComponent(manualQuery + ' hospital')}`;
      } else {
        // Construct query for hospitals near location using viewbox
        const boxSize = 0.1; // roughly 10km
        url += `&q=hospital&viewbox=${searchLon - boxSize},${searchLat + boxSize},${searchLon + boxSize},${searchLat - boxSize}&bounded=1`;
      }

      const response = await fetch(url, {
        headers: { 'User-Agent': 'HealthRiskApp/1.0' }
      });

      const data = await response.json();

      const mapped: HospitalLocation[] = data.map((item: any) => ({
        place_id: item.place_id,
        lat: item.lat,
        lon: item.lon,
        display_name: item.display_name,
        name: item.display_name.split(',')[0],
        specialties: getRandomSpecialties() // Add mock specialties
      }));

      // Sort by distance to center
      mapped.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(parseFloat(a.lat) - searchLat, 2) + Math.pow(parseFloat(a.lon) - searchLon, 2));
        const distB = Math.sqrt(Math.pow(parseFloat(b.lat) - searchLat, 2) + Math.pow(parseFloat(b.lon) - searchLon, 2));
        return distA - distB;
      });

      setHospitals(mapped);

      if (mapped.length > 0 && manualQuery) {
        setMapCenter([parseFloat(mapped[0].lat), parseFloat(mapped[0].lon)]);
      }

    } catch (err: any) {
      toast({ title: 'Search failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchHospitals(undefined, undefined, query);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-slate-950 border-b p-4 shadow-sm z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl">Hospital Locator</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Find nearby medical facilities</p>
              </div>
            </div>

            <form onSubmit={handleManualSearch} className="flex-1 max-w-xl flex gap-2 w-full">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search location (e.g. Coimbatore)"
                  className="pl-9 border-muted-foreground/20 focus:border-primary transition-all"
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                setUserLocation([latitude, longitude]);
                setMapCenter([latitude, longitude]);
                searchHospitals(latitude, longitude);
              }, err => toast({ title: "Location Error", description: err.message, variant: "destructive" }))} title="Use my location">
                <MapPin className="w-4 h-4 text-primary" />
              </Button>
              <Button type="submit" disabled={loading} className="gradient-primary text-white shadow-md hover:shadow-lg transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </form>

            <div className="flex gap-2">
              <Button variant={viewMode === 'map' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('map')}>
                <MapIcon className="w-4 h-4 mr-2" /> Map
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4 mr-2" /> List
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex">

          {/* Map View */}
          <div className={`flex-1 relative transition-all duration-300 ${viewMode === 'list' ? 'hidden md:block md:w-1/2 lg:w-2/3' : 'w-full'}`}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={mapCenter} />

              {/* User Location Marker */}
              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>
                    <div className="font-semibold text-center p-1">
                      <div className="text-blue-600 font-bold mb-1">You are here</div>
                      <div className="text-xs text-muted-foreground">Coordinates: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Hospital Markers */}
              {hospitals.map((hospital) => (
                <Marker
                  key={hospital.place_id}
                  position={[parseFloat(hospital.lat), parseFloat(hospital.lon)]}
                  icon={hospitalIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[220px]">
                      <h3 className="font-bold text-sm mb-1">{hospital.name}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {hospital.specialties?.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{s}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{hospital.display_name}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`, '_blank')}>
                          <Navigation className="w-3 h-3 mr-1" /> Direct
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                          <Phone className="w-3 h-3 mr-1" /> Call
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Overlay Loading */}
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* List View (Sidebar on large screens, full on mobile if list mode) */}
          <div className={`bg-white dark:bg-slate-900 border-l overflow-y-auto transition-all duration-300 ${viewMode === 'map' ? 'hidden md:block md:w-1/2 lg:w-1/3' : 'w-full'}`}>
            <div className="p-4 space-y-4">
              <h2 className="font-semibold text-lg flex items-center">
                Nearby Facilities <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-muted-foreground">{hospitals.length} found</span>
              </h2>

              {hospitals.length === 0 && !loading && (
                <div className="text-center py-10 text-muted-foreground">
                  No hospitals found. Try a different search.
                </div>
              )}

              {hospitals.map((hospital) => (
                <Card
                  key={hospital.place_id}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary hover:shadow-md"
                  onClick={() => setMapCenter([parseFloat(hospital.lat), parseFloat(hospital.lon)])}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Placeholder Image or Icon */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
                        <HospitalIcon className="w-8 h-8 opacity-80" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{hospital.name}</h3>
                          <div className="flex flex-wrap gap-1 my-1">
                            {hospital.specialties?.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">{s}</span>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{hospital.display_name}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" className="h-8 text-xs bg-secondary/50 hover:bg-secondary" onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`, '_blank'); }}>
                            <Navigation className="w-3 h-3 mr-1.5" /> Directions
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/search?q=${encodeURIComponent(hospital.name + ' hospital website')}`, '_blank'); }}>
                            <Globe className="w-3 h-3 mr-1.5" /> Website
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); }}>
                            <Phone className="w-3 h-3 mr-1.5" /> Call
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default Hospitals;
