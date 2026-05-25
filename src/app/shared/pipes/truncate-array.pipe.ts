import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateArray'
})
export class TruncateArrayPipe implements PipeTransform {

  transform(value: string[], limit: number = 50, completeWords: boolean = true, ellipsis: string = '...'): string {
    if (!value || value.length === 0) return '';

    const concatenated = value.join(' ');
    if (concatenated.length <= limit) {
      return concatenated;
    }

    if (completeWords) {
      let end = limit;
      while (end < concatenated.length && concatenated[end] !== ' ') {
        end++;
      }
      return concatenated.substring(0, end) + ellipsis;
    } else {
      return concatenated.substring(0, limit) + ellipsis;
    }
  }


}
