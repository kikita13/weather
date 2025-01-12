import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  runInInjectionContext,
  Signal,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, switchMap, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { GeoLocationService, TokenService, WeatherService } from '@services';
import { WeatherResponse } from '@models';
import { IconUrlPipe } from '@pipes';

@Component({
  selector: 'app-weather-table',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, IconUrlPipe],
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

  readonly cityValueChanges = toSignal(
    this.formGroup.controls.city.valueChanges.pipe(debounceTime(300)),
  );

  cityAutoCompleteList = signal<string[]>([]);

  ngOnInit() {
    const { city, appid } = this.#activatedRoute.snapshot.queryParams;

    this.formGroup.controls.appid.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef), debounceTime(300))
      .subscribe(token => this.#tokenService.token.set(token || ''));

    if (city) {
      this.formGroup.controls.city.setValue(city);
    }

    if (appid) {
      this.formGroup.controls.appid.setValue(appid);
      this.#tokenService.token.set(appid);
    }

    if (city && appid) {
      this.onSubmit();
    }

    this.formGroup.controls.city.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(value =>
          value
            ? this.#geoLocationService
                .get({ q: value, limit: 10 })
                .pipe(
                  map(cities =>
                    cities.map(city =>
                      city.local_names ? Object.values(city.local_names) : [city.name],
                    ),
                  ),
                )
            : [],
        ),
        catchError(err => {
          this.cityAutoCompleteList.set([]);
          return [];
        }),
        takeUntilDestroyed(this.#destroyRef),
      )
      .subscribe(cities => this.cityAutoCompleteList.update(() => [...new Set(cities.flat())]));
  }

  onSubmit() {
    if (!this.formGroup.controls.appid.value || !this.formGroup.controls.city.value) {
      return;
    }

    this.updateQuery({
      city: this.formGroup.controls.city.value,
      appid: this.formGroup.controls.appid.value,
    });

    this.#geoLocationService
      .get({
        q: this.formGroup.controls.city.value,
        limit: 1,
      })
      .pipe(
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
      )
      .subscribe(weather => {
        this.weatherData.set(weather);
        this.selectedCity.set(weather.city.name);
      });
  }

  updateQuery(queryParams: Record<string, string | number>) {
    this.#router.navigate([], {
      relativeTo: this.#activatedRoute,
      queryParams,
      replaceUrl: true,
    });
  }
}
