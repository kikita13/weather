import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, switchMap, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { GeoLocationService, TokenService, WeatherService } from '@services';
import { WeatherResponse } from '@models';

@Component({
  selector: 'app-weather-table',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './weather-table.component.html',
  styleUrl: './weather-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherTableComponent implements OnInit {
  readonly #tokenService = inject(TokenService);
  readonly #weatherService = inject(WeatherService);
  readonly #geoLocationService = inject(GeoLocationService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #router = inject(Router);
  readonly #activatedRoute = inject(ActivatedRoute);

  readonly formGroup = new FormGroup({
    appid: new FormControl<string>('', Validators.required),
    city: new FormControl<string>('', Validators.required),
  });

  readonly #countTimeStampsPerDay = 3;
  readonly #countTimeStampsInDay = 24 / this.#countTimeStampsPerDay;
  readonly #days = 5;
  readonly #countQuery = this.#days * this.#countTimeStampsInDay;

  errorCode = signal('');

  readonly selectedCity = signal<string>('');
  readonly weatherData = signal<WeatherResponse | null>(null);

  ngOnInit() {
    const { city } = this.#activatedRoute.snapshot.queryParams;

    if (city) {
      this.formGroup.controls.city.setValue(city);

      this.onSubmit();
    }
  }

  onSubmit() {
    if (!this.formGroup.controls.appid.value || !this.formGroup.controls.city.value) {
      return;
    }

    this.updateQuery({ city: this.formGroup.controls.city.value });

    this.#tokenService.token.set(this.formGroup.controls.appid.value);

    this.#geoLocationService.get({
      q: this.formGroup.controls.city.value,
      limit: 1,
    }).pipe(
      takeUntilDestroyed(this.#destroyRef),
      catchError(err => {
        if (err?.status === 404) {
          this.errorCode.set('City not found');
        } else {
          this.errorCode.set(err?.statusText || 'Unknown Error');
        }
        return throwError(() => err);
      }),
      switchMap(city => {
        if (!city || city.length === 0) {
          this.errorCode.set('City not found');
          return throwError(() => 'City not found');
        }

        return this.#weatherService.get({
          cnt: this.#countQuery,
          lon: city[0].lon,
          lat: city[0].lat,
          units: 'metric',
        });
      }),
      catchError(err => {
        this.errorCode.set(typeof err === 'string' ? err : err.statusText);
        this.weatherData.set(null);
        return throwError(() => err);
      }),
    ).subscribe(weather => {
      this.weatherData.set(weather);
      this.selectedCity.set(weather.city.name);
    });
  }

  getIconUrl(iconCode: string) {
    return `https://openweathermap.org/img/wn/${iconCode}.png`;
  }

  updateQuery(queryParams: Record<string, string | number>) {
    this.#router.navigate([], {
      relativeTo: this.#activatedRoute,
      queryParams,
      replaceUrl: true,
    });
  }
}
