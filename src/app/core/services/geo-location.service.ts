import { Injectable } from '@angular/core';

import { BaseApi } from './base-api';
import { GeoLocation, GeoLocationQuery } from '@models';

@Injectable({
  providedIn: 'root',
})
export class GeoLocationService extends BaseApi<GeoLocation[], GeoLocationQuery> {
  endpoint = 'https://api.openweathermap.org/geo/1.0/direct';
}
