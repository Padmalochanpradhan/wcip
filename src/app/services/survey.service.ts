import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout, BehaviorSubject } from 'rxjs';
import { AppEnvService } from './app-env.service';
import { Survey, SurveyDetail, Ward, SubmissionPayload } from '../models/survey.models';

@Injectable({ providedIn: 'root' })
export class SurveyService {

  private readonly _todayCount$ = new BehaviorSubject<number>(0);
  readonly todayCount$ = this._todayCount$.asObservable();

  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private readonly http: HttpClient,
    private readonly env: AppEnvService
  ) {}

  private url(name: string): string {
    return `${this.env.endpointUrl()}${name}-${this.env.envType()}`;
  }

  async getSurveys(): Promise<Survey[]> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetSurveys'), '{}', { headers: this.headers }).pipe(timeout(30000))
    );
    const data = typeof res?.data === 'string' ? JSON.parse(res.data) : res?.data;
    return data ?? [];
  }

  async getSurveyDetail(id: number): Promise<SurveyDetail> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetSurveyDetail'), JSON.stringify({ id }), { headers: this.headers }).pipe(timeout(30000))
    );
    return typeof res?.data === 'string' ? JSON.parse(res.data) : res?.data;
  }

  async getWards(): Promise<Ward[]> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetWards'), '{}', { headers: this.headers }).pipe(timeout(30000))
    );
    const data = typeof res?.data === 'string' ? JSON.parse(res.data) : res?.data;
    return data ?? [];
  }

  async getTodayCount(userId: number): Promise<number> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetTodayCount'), JSON.stringify({ user_id: userId }), { headers: this.headers }).pipe(timeout(30000))
    );
    const data = typeof res?.data === 'string' ? JSON.parse(res.data) : res?.data;
    const count = res?.count ?? data?.count ?? data?.[0]?.count ?? 0;
    this._todayCount$.next(count);
    return count;
  }

  incrementTodayCount(): void {
    this._todayCount$.next(this._todayCount$.value + 1);
  }

  async submitSurvey(payload: SubmissionPayload): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(this.url('survey-submit'), JSON.stringify(payload), { headers: this.headers }).pipe(timeout(60000))
    );
  }
}
