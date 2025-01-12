import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { TokenService } from './token.service';

export abstract class BaseApi<T, QueryParams> {
  readonly #http = inject(HttpClient);
  readonly #tokenService = inject(TokenService);

  protected abstract endpoint: string;

  get(params?: QueryParams): Observable<T> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    httpParams = httpParams.set('appid', this.#tokenService.token());

    return this.#http.get<T>(this.endpoint, { params: httpParams });
  }
}
