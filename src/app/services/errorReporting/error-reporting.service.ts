import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ErrorReport } from './errorReport';
import { map } from 'rxjs/operators';
import { GetAllErrorReportsResponse } from '../../models/response/getAllErrorReportsResponse';
import { AppEnvService } from '../app-env.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorReportingService {

  constructor(
    private readonly httpClient: HttpClient,
    private readonly environmentService: AppEnvService) { }

  submitErrorReport(errorReport: ErrorReport): Promise<ErrorReport> {

    const requestUrl = `${this.environmentService.endpointUrl()}/api/ErrorReport/insertErrorReport`;
    const headers: HttpHeaders = new  HttpHeaders( {'content-type': 'application/json'});
    const body = JSON.stringify(errorReport);
    const result = firstValueFrom(this.httpClient.post<ErrorReport>(requestUrl, body, { headers }));
    return result;
  }

  getAllErrors(pageIndex: number, rowsPerPage: number): Promise<GetAllErrorReportsResponse> {
    console.log('getting error reports...');

    const requestUrl = `${this.environmentService.endpointUrl()}/api/ErrorReport/index?pageIndex=${pageIndex}&rowsPerPage=${rowsPerPage}`;
    const headers: HttpHeaders = new  HttpHeaders( {'content-type': 'application/json'});
    const result = firstValueFrom(this.httpClient.post<GetAllErrorReportsResponse>(requestUrl, { headers }).pipe(
      map((response) => {
        const data = response.errors;
        data.forEach(r => {
          if (r.createdDateTime) {
            r.createdDateTime = new Date(r.createdDateTime);
          }
        });
        return response;
      })));

    return result;
  }
}
