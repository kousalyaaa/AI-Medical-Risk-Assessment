import React, { useEffect, useRef, useState } from "react";
import { MapPin, AlertCircle, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HospitalCard from "./HospitalCard";

const HospitalMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [status, setStatus] = useState<string>('Loading map...');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredHospitals, setFilteredHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  // Hospital data from Coimbatore
  const coimbatoreHospitals = [
    {
      id: 1,
      name: "Muthu Hospital",
      lat: 11.073530499999999,
      lng: 77.00228229999999,
      phone: "+917094614000",
      type: "Multispeciality",
      emergency: "Yes",
      website: "https://www.muthushospital.com/",
      rating: 4.5,
      address: "4-A, Railway Station Back Side, Coimbatore"
    },
    {
      id: 2,
      name: "Kumaran Medical Centre",
      lat: 11.1073322,
      lng: 77.0239801,
      phone: "+914222226222",
      type: "Multispeciality",
      emergency: "Yes",
      website: "https://kumaranmedical.com/",
      rating: 4.3,
      address: "17, Mettupalayam Road, Coimbatore"
    },
    {
      id: 3,
      name: "Vimal Jyothi Hospital",
      lat: 11.0891336,
      lng: 77.0078983,
      phone: "+918270314565",
      type: "General Hospital",
      emergency: "Yes",
      website: "http://www.vimaljyothihospital.com/",
      rating: 3.8,
      address: "Ganapathy, Coimbatore"
    },
    {
      id: 4,
      name: "Geetha Hospital",
      lat: 11.071879299999999,
      lng: 77.00248289999999,
      phone: "+919489675511",
      type: "General Hospital",
      emergency: "Varies",
      website: "http://www.geethasreehospitals.com/",
      rating: 4.4,
      address: "164, Sathy Road, Coimbatore"
    },
    {
      id: 5,
      name: "Aravind Eye Hospital",
      lat: 11.081851,
      lng: 77.0049894,
      phone: "+914227110000",
      type: "Clinic / Hospital",
      emergency: "Varies",
      website: "",
      rating: 3.9,
      address: "Avinashi Road, Coimbatore"
    },
    {
      id: 6,
      name: "Sri Ramakrishna Hospital",
      lat: 11.073486899999999,
      lng: 77.0015451,
      phone: "+919488972828",
      type: "Medical Centre",
      emergency: "Varies",
      website: "",
      rating: 4.4,
      address: "395, Sarojini Naidu Road, Coimbatore"
    },
    {
      id: 7,
      name: "PSG Hospitals",
      lat: 11.0185844,
      lng: 77.0068149,
      phone: "+914224345353",
      type: "Multispeciality",
      emergency: "24×7",
      website: "https://www.psghospitals.com/",
      rating: 4.1,
      address: "Peelamedu, Coimbatore"
    },
    {
      id: 8,
      name: "Kongunad Hospitals",
      lat: 11.017726399999999,
      lng: 76.9604544,
      phone: "+914224316000",
      type: "Multispeciality",
      emergency: "24×7",
      website: "http://www.kongunad.com/",
      rating: 4.8,
      address: "213, Trichy Road, Coimbatore"
    },
    {
      id: 9,
      name: "KG Hospital",
      lat: 11.0002319,
      lng: 76.97157349999999,
      phone: "",
      type: "General / Specialty",
      emergency: "24×7",
      website: "https://www.kghospital.com/",
      rating: 4.5,
      address: "5, Government Arts College Road, Coimbatore"
    },
    {
      id: 10,
      name: "NG Hospital",
      lat: 11.0004084,
      lng: 77.0292903,
      phone: "+914222595963",
      type: "Multispeciality",
      emergency: "24×7",
      website: "https://nghospitalscbe.com/",
      rating: 4.5,
      address: "577, Trichy Road, Coimbatore"
    },
    {
      id: 11,
      name: "Sri Ramakrishna Hospital",
      lat: 11.02318,
      lng: 76.9777328,
      phone: "+914223500000",
      type: "Multispeciality",
      emergency: "24×7",
      website: "http://www.sriramakrishnahospital.com/",
      rating: 4.1,
      address: "No. 395, Sarojini Naidu Road, Coimbatore"
    },
    {
      id: 12,
      name: "FIMS Hospital",
      lat: 10.957823,
      lng: 76.972314,
      phone: "+918300108108",
      type: "Multispeciality",
      emergency: "24×7",
      website: "http://www.fimshospitals.com/",
      rating: 4.7,
      address: "Edappadi, Coimbatore"
    },
    {
      id: 13,
      name: "GKNM Hospital",
      lat: 11.012272,
      lng: 76.9806818,
      phone: "+914224305212",
      type: "General / Specialty",
      emergency: "24×7",
      website: "https://www.gknmhospital.org/",
      rating: 4.3,
      address: "P N Palayam, Coimbatore"
    },
    {
      id: 14,
      name: "Royal Care Hospital",
      lat: 11.023781399999999,
      lng: 76.95833069999999,
      phone: "+914224719797",
      type: "General Hospital",
      emergency: "Varies",
      website: "",
      rating: 4.8,
      address: "1612, Trichy Road, Coimbatore"
    },
    {
      id: 15,
      name: "GEM Hospital",
      lat: 10.9996215,
      lng: 76.9954638,
      phone: "+914224695100",
      type: "Multispeciality",
      emergency: "24×7",
      website: "https://gemhospitals.com/",
      rating: 4.4,
      address: "45, Pankaja Mill Road, Coimbatore"
    },
    {
      id: 16,
      name: "Coimbatore Medical College Hospital",
      lat: 10.9954372,
      lng: 76.9702762,
      phone: "+914222301393",
      type: "Government Hospital",
      emergency: "24×7",
      website: "",
      rating: 3.3,
      address: "Avinashi Road, Coimbatore"
    },
    {
      id: 17,
      name: "Sankara Eye Hospital",
      lat: 11.0424028,
      lng: 77.04042129999999,
      phone: "+914224323800",
      type: "Multispeciality",
      emergency: "24×7",
      website: "",
      rating: 3.3,
      address: "Sathy Road, Coimbatore"
    },
    {
      id: 18,
      name: "Bethel Hospital",
      lat: 11.0189004,
      lng: 76.961265,
      phone: "+914224713822",
      type: "General Hospital",
      emergency: "Varies",
      website: "https://www.bethelhospital.in/",
      rating: 4.7,
      address: "No. 7, Venkatramana Road, Coimbatore"
    },
    {
      id: 19,
      name: "CSI Mission Hospital",
      lat: 11.0210104,
      lng: 76.9661658,
      phone: "",
      type: "General Hospital",
      emergency: "Varies",
      website: "https://csrhospitals.com/",
      rating: 4.3,
      address: "No. 1319, Trichy Road, Coimbatore"
    },
    {
      id: 20,
      name: "Kovai Medical Center",
      lat: 11.0095029,
      lng: 76.961957,
      phone: "+914222236730",
      type: "General Hospital",
      emergency: "Varies",
      website: "",
      rating: 4.9,
      address: "99, Avinashi Road, Coimbatore"
    }
  ];

  // 🔥 Load Google Maps Script (With Places API for hospitals)
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsMapReady(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API key missing. Add VITE_GOOGLE_MAPS_API_KEY to .env.local");
      return;
    }

    (window as any).initMap = () => {
      setIsMapReady(true);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      setError("Failed to load Google Maps script. Check your API key and internet connection.");
    };

    document.head.appendChild(script);
  }, []);

  // 🔥 Initialize Basic Map INSTANTLY
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;

    setLoading(false);
    setError(null);

    // Center on Coimbatore, India
    const coimbatoreCenter = { lat: 11.0168, lng: 76.9558 };

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: coimbatoreCenter,
      zoom: 12,
      mapId: 'hospital-map',
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    setMap(mapInstance);
    setUserLocation(coimbatoreCenter);

    // Add all Coimbatore hospitals
    addCoimbatoreHospitals(mapInstance);

    // Try to get user location for comparison
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userLoc = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            console.log('User location found:', userLoc);
            setUserLocation(userLoc);

            // Add user location marker
            const userMarker = new google.maps.Marker({
              position: userLoc,
              map: mapInstance,
              title: 'Your Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#2563eb" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
              },
            });
          },
          (error) => {
            console.log('Geolocation failed, staying on Coimbatore:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000
          }
        );
      }
    };

    getUserLocation();
  }, [isMapReady]);

  // Function to add Coimbatore hospitals with markers and search
  const addCoimbatoreHospitals = (mapInstance: google.maps.Map) => {
    const markers: google.maps.Marker[] = [];
    const infoWindows: google.maps.InfoWindow[] = [];

    coimbatoreHospitals.forEach((hospital) => {
      const position = { lat: hospital.lat, lng: hospital.lng };

      const marker = new google.maps.Marker({
        position,
        map: mapInstance,
        title: hospital.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#dc2626"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 280px;">
            <h3 style="margin: 0 0 8px 0; color: #dc2626;">🏥 ${hospital.name}</h3>
            <p style="margin: 0 0 4px 0;">📍 ${hospital.address}</p>
            ${hospital.phone ? `<p style="margin: 0 0 4px 0;">📞 ${hospital.phone}</p>` : ''}
            <p style="margin: 0 0 4px 0;">🏷️ ${hospital.type}</p>
            <p style="margin: 0 0 4px 0;">🚑 Emergency: ${hospital.emergency}</p>
            <p style="margin: 0 0 4px 0;">⭐ Rating: ${hospital.rating}/5</p>
            ${hospital.website ? `<p style="margin: 0 0 4px 0;"><a href="${hospital.website}" target="_blank" style="color: #2563eb;">🌐 Visit Website</a></p>` : ''}
            <p style="margin: 0; font-size: 12px; color: #666;">
              Coimbatore Hospital - ID: ${hospital.id}
            </p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        // Close all info windows first
        infoWindows.forEach(iw => iw.close());
        // Open this one
        infoWindow.open(mapInstance, marker);
        // Zoom to hospital
        mapInstance.setZoom(16);
        mapInstance.setCenter(position);
        setSelectedHospital(hospital);
      });

      markers.push(marker);
      infoWindows.push(infoWindow);
    });

    // Store markers for search functionality
    (mapInstance as any).hospitalMarkers = markers;
    (mapInstance as any).hospitalInfoWindows = infoWindows;

    setStatus(`✅ Loaded ${coimbatoreHospitals.length} hospitals in Coimbatore`);
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!map || !query.trim()) {
      setFilteredHospitals([]);
      return;
    }

    const filtered = coimbatoreHospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(query.toLowerCase()) ||
      hospital.address.toLowerCase().includes(query.toLowerCase()) ||
      hospital.type.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredHospitals(filtered);

    // If only one result, zoom to it
    if (filtered.length === 1) {
      const hospital = filtered[0];
      const position = { lat: hospital.lat, lng: hospital.lng };
      map.setCenter(position);
      map.setZoom(16);

      // Find and click the marker
      const markers = (map as any).hospitalMarkers as google.maps.Marker[];
      const marker = markers.find((m, index) => {
        const markerHospital = coimbatoreHospitals[index];
        return markerHospital.id === hospital.id;
      });

      if (marker) {
        google.maps.event.trigger(marker, 'click');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Hospital Map Status</h3>
            <p className="text-sm text-blue-700 mt-1">
              {status}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              🔍 Check browser console (F12) for detailed logs
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search hospitals by name, address, or type..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg"
        />
      </div>

      {/* Search Results */}
      {filteredHospitals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 mb-2">Search Results ({filteredHospitals.length})</h4>
          <div className="space-y-2">
            {filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  const position = { lat: hospital.lat, lng: hospital.lng };
                  if (map) {
                    map.setCenter(position);
                    map.setZoom(16);
                    // Trigger marker click
                    const markers = (map as any).hospitalMarkers as google.maps.Marker[];
                    const marker = markers.find((m, index) => {
                      const markerHospital = coimbatoreHospitals[index];
                      return markerHospital.id === hospital.id;
                    });
                    if (marker) {
                      google.maps.event.trigger(marker, 'click');
                    }
                  }
                  setSelectedHospital(hospital);
                  setFilteredHospitals([]); // Close search results
                }}
              >
                <div className="font-medium text-gray-900">{hospital.name}</div>
                <div className="text-sm text-gray-600">{hospital.address}</div>
                <div className="text-xs text-gray-500">{hospital.type} • ⭐ {hospital.rating}/5</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 p-4 border rounded mb-4">
          <AlertCircle className="inline mr-2" />
          {error}
        </div>
      )}

      {/* ✅ Map container - ALWAYS VISIBLE */}
      <div ref={mapRef} className="w-full h-96 rounded-lg border bg-gray-100 flex items-center justify-center">
        {loading && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}
      </div>

      {/* Interactive Hospital Card */}
      {selectedHospital && (
        <div className="mt-4 relative">
          <div className="flex justify-center">
            <div className="relative max-w-md w-full">
              <Button
                onClick={() => setSelectedHospital(null)}
                variant="outline"
                size="sm"
                className="absolute -top-2 -right-2 z-20 bg-white hover:bg-gray-50 rounded-full p-1 h-8 w-8 shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
              <HospitalCard
                hospital={selectedHospital}
                onClose={() => setSelectedHospital(null)}
                userLocation={userLocation}
              />
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>🔍 <strong>Debug Info:</strong> Open browser console (F12) to see location detection and hospital search logs</p>
        <p>📍 <strong>Current Status:</strong> {status}</p>
      </div>
    </div>
  );
};

export default HospitalMap;
