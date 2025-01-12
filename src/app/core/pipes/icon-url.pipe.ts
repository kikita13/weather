import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'iconUrl',
  standalone: true,
})
export class IconUrlPipe implements PipeTransform {
  transform(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}.png`;
  }
}
