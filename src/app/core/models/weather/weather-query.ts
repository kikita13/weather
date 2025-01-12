export interface WeatherQuery {
  lat: number;
  lon: number;
  units: 'standard' | 'metric' | 'imperial';
  cnt: number;
}