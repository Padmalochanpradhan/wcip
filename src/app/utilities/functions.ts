import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { AppEnvService } from '../services/app-env.service';

export async function commonPostApi<T>(
  http: HttpClient,
  env: AppEnvService,
  apiName: string,
  body: any,
  params?: Record<string, any>
): Promise<T> {

  // ✅ FIX HERE
  let url = `${env.endpointUrl()}${apiName}-${env.envType()}`; 

  if (params) {
    const httpParams = new HttpParams({ fromObject: params });
    const queryString = httpParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return await firstValueFrom(
    http.post<T>(url, JSON.stringify(body), { headers }).pipe(timeout(90000))
  );
}





export function onDomLoad(callBackFunc: () => void): void {
    setTimeout(() => {
        callBackFunc();
    }, 0);
}

export function GetUTC(): number {
    return Math.floor(Date.now() / 1000);
}

 
