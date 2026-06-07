import React from 'react';
import { Phone, Navigation, Globe, Star, MapPin, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Hospital {
  id: number;
  name: string;
  lat: number;
  lng: number;
  phone?: string;
  type: string;
  emergency: string;
  website?: string;
  rating: number;
  address: string;
}

interface HospitalCardProps {
  hospital: Hospital;
  onClose?: () => void;
  userLocation?: google.maps.LatLngLiteral | null;
}

const HospitalCard: React.FC<HospitalCardProps> = ({ hospital, onClose, userLocation }) => {
  const getEmergencyColor = (emergency: string) => {
    if (emergency.toLowerCase().includes('24')) return 'bg-green-100 text-green-800 border-green-200';
    if (emergency.toLowerCase().includes('yes')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleCall = () => {
    if (hospital.phone) {
      window.open(`tel:${hospital.phone}`, '_self');
    }
  };

  const handleDirections = () => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.lat},${hospital.lng}`;
      window.open(url, '_blank');
    } else {
      // Fallback to just showing the location
      const url = `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleWebsite = () => {
    if (hospital.website) {
      window.open(hospital.website, '_blank');
    }
  };

  // Generate a placeholder image URL based on hospital name
  const getHospitalImage = (name: string) => {
    // Using a hospital-themed placeholder service
    const encodedName = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
    return `https://images.unsplash.com/800x400/?hospital,medical,clinic&sig=${hospital.id}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 overflow-hidden">
      {/* Hospital Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <img
          src={getHospitalImage(hospital.name)}
          alt={hospital.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a generic hospital image
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/800x400/?hospital,medical&sig=fallback';
          }}
        />
        <div className="absolute top-4 right-4">
          <Badge className={`${getEmergencyColor(hospital.emergency)} font-medium`}>
            <Shield className="w-3 h-3 mr-1" />
            {hospital.emergency}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-white/90 text-gray-900">
              {hospital.type}
            </Badge>
            <div className={`flex items-center bg-white/90 px-2 py-1 rounded-full ${getRatingColor(hospital.rating)}`}>
              <Star className="w-4 h-4 mr-1 fill-current" />
              <span className="font-semibold">{hospital.rating}</span>
            </div>
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
          {hospital.name}
        </CardTitle>
        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed">{hospital.address}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Button
            onClick={handleCall}
            disabled={!hospital.phone}
            className="flex flex-col items-center gap-2 h-auto py-4 bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-medium">Call</span>
          </Button>

          <Button
            onClick={handleDirections}
            className="flex flex-col items-center gap-2 h-auto py-4 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-xs font-medium">Directions</span>
          </Button>

          <Button
            onClick={handleWebsite}
            disabled={!hospital.website}
            className="flex flex-col items-center gap-2 h-auto py-4 bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Globe className="w-5 h-5" />
            <span className="text-xs font-medium">Website</span>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="space-y-3 text-sm">
          {hospital.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Phone className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{hospital.phone}</p>
                <p className="text-xs text-gray-500">Tap call button above</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Emergency Services</p>
              <p className="text-xs text-gray-500">{hospital.emergency}</p>
            </div>
          </div>

          {hospital.website && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Globe className="w-4 h-4 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Official Website</p>
                <p className="text-xs text-gray-500 truncate">{hospital.website}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Hospital ID: {hospital.id} • Coimbatore, Tamil Nadu
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospitalCard;
