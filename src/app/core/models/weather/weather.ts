import { WeatherListItem } from './weather-list-item';
import { City } from './city';

export interface WeatherResponse {
  cod: string;
  message: number;
  cnt: number;
  list: WeatherListItem[];
  city: City;
}
















