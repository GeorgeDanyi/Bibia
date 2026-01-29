declare module '@mapbox/mapbox-sdk' {
  interface MapboxClient {
    geocoding: any;
  }
  
  function createClient(config: { accessToken: string }): MapboxClient;
  export default createClient;
}

declare module '@mapbox/mapbox-sdk/services/geocoding' {
  interface GeocodingFeature {
    id: string;
    type: string;
    place_name: string;
    text: string;
    center: [number, number];
    context?: Array<{
      id: string;
      text: string;
    }>;
  }

  interface GeocodingResponse {
    body: {
      features: GeocodingFeature[];
    };
  }

  interface GeocodingService {
    forwardGeocode: (config: any) => Promise<GeocodingResponse>;
    reverseGeocode: (config: any) => Promise<GeocodingResponse>;
  }
  
  function createGeocodingService(client: any): GeocodingService;
  export default createGeocodingService;
}
