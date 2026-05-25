import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {

  transform(value: string, limit: number = 50, completeWords: boolean = false, ellipsis: string = '...'): string {
    if (!value) return '';

    if (completeWords) {
      let end = limit;
      while (end < value.length && value[end] !== ' ') {
        end++;
      }
      return value.length > limit ? value.substring(0, end) + ellipsis : value;
    } else {
      return value.length > limit ? value.substring(0, limit) + ellipsis : value;
    }
  }
}
//Usage
// <div>{{ longText | truncate:50 }}</div>
// <div>{{ longText | truncate:50:true }}</div>
// <div>{{ longText | truncate:50:false:'--' }}</div>

