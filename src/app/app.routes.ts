import { Routes } from '@angular/router';
import { WeatherTableComponent } from '@features';

export const routes: Routes = [
  {
    title: 'Weather',
    path: '',
    pathMatch: 'full',
    component: WeatherTableComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
