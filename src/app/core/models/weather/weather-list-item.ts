import { MainWeather } from './main-weather';
import { WeatherDescription } from './weather-description';
import { Clouds } from './clouds';
import { Wind } from './wind';
import { System } from './system';

export interface WeatherListItem {
  dt: number;
  main: MainWeather;
  weather: WeatherDescription[];
  clouds: Clouds;
  wind: Wind;
  visibility: number;
  pop: number;
  sys: System;
  dt_txt: string;
}