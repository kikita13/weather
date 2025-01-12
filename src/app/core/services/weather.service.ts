import { Injectable } from '@angular/core';

import { BaseApi } from './base-api';
import { WeatherQuery, WeatherResponse } from '@models';

@Injectable({
  providedIn: 'root',
})
export class WeatherService extends BaseApi<WeatherResponse, WeatherQuery> {
  endpoint = 'https://api.openweathermap.org/data/2.5/forecast';
}
