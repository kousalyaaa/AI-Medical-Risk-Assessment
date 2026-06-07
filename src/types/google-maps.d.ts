/// <reference types="@types/google.maps" />
declare global {
  namespace google {
    namespace maps {
      interface Map {}
      interface Marker {}
      interface InfoWindow {}
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      namespace places {
        interface PlaceResult {
          place_id?: string;
          name?: string;
          vicinity?: string;
          geometry?: {
            location?: {
              lat(): number;
              lng(): number;
            };
          };
          rating?: number;
          types?: string[];
        }
        interface PlaceSearchRequest {
          location?: LatLngLiteral;
          radius?: number;
          type?: string;
          keyword?: string;
        }
        interface TextSearchRequest {
          query?: string;
          location?: LatLngLiteral;
          radius?: number;
        }
        enum PlacesServiceStatus {
          OK = 'OK',
          ZERO_RESULTS = 'ZERO_RESULTS',
          OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
          REQUEST_DENIED = 'REQUEST_DENIED',
          INVALID_REQUEST = 'INVALID_REQUEST',
          UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        }
        class PlacesService {
          constructor(attrContainer: any);
          nearbySearch(request: PlaceSearchRequest, callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void): void;
          textSearch(request: TextSearchRequest, callback: (results: PlaceResult[] | null, status: PlacesServiceStatus) => void): void;
        }
      }
    }
  }
}

export {};
