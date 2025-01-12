import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { GeoLocationService, TokenService, WeatherService } from '@services';
import { WeatherResponse } from '@models';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-weather-table',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './weather-table.component.html',
  styleUrl: './weather-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherTableComponent {
  readonly #tokenService = inject(TokenService);
  readonly #weatherService = inject(WeatherService);
  readonly #geoLocationService = inject(GeoLocationService);
  readonly #destroyRef = inject(DestroyRef);

  readonly formGroup = new FormGroup({
    appid: new FormControl<string>('', Validators.required),
    city: new FormControl<string>('', Validators.required),
  });

  readonly #countTimeStampsPerDay = 3;
  readonly #countTimeStampsInDay = 24 / this.#countTimeStampsPerDay;
  readonly #days = 5;
  readonly #countQuery = this.#days * this.#countTimeStampsInDay;

  readonly selectedCity = signal<string>('');
  readonly weatherData = signal<WeatherResponse | null>(null);

  onSubmit() {
    if (!this.formGroup.controls.appid.value || !this.formGroup.controls.city.value) {
      return;
    }

    this.#tokenService.token.set(this.formGroup.controls.appid.value);

    this.#geoLocationService.get({
      q: this.formGroup.controls.city.value,
      limit: 1,
    }).pipe(takeUntilDestroyed(this.#destroyRef), switchMap(city => {
      return this.#weatherService.get({ cnt: this.#countQuery, lon: city[0].lon, lat: city[0].lat, units: 'metric' });
    })).subscribe(weather => {
      this.weatherData.set(weather);
      this.selectedCity.set(weather.city.name);
    });
  }

  getIconUrl(iconCode: string) {
    return `https://openweathermap.org/img/wn/${iconCode}.png`;
  }
}
