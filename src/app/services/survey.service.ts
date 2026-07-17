import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout, BehaviorSubject } from 'rxjs';
import { AppEnvService } from './app-env.service';
import { Survey, SurveyDetail, Ward, Location, SubmissionPayload, SurveySubmission, AirtableRow, AirtableImportResult } from '../models/survey.models';

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

  async getLocations(): Promise<Location[]> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetLocations'), '{}', { headers: this.headers }).pipe(timeout(30000))
    );
    const unwrapped = this.unwrapLambda(res);
    const data = typeof unwrapped?.data === 'string' ? JSON.parse(unwrapped.data) : unwrapped?.data;
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

  async manageSurvey(payload: any): Promise<any> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCmanageSurveys'), JSON.stringify(payload), { headers: this.headers }).pipe(timeout(30000))
    );
    return this.unwrapLambda(res);
  }

  async getAllSubmissions(): Promise<SurveySubmission[]> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetAllSubmissions'), '{}', { headers: this.headers }).pipe(timeout(30000))
    );
    const unwrapped = this.unwrapLambda(res);
    const data = typeof unwrapped?.data === 'string' ? JSON.parse(unwrapped.data) : unwrapped?.data;
    return (data ?? []).map((s: any) => ({
      ...s,
      ai_analysis: typeof s.ai_analysis === 'string' ? JSON.parse(s.ai_analysis) : s.ai_analysis
    }));
  }

  async getSubmissions(userId: number): Promise<SurveySubmission[]> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetSubmissions'), JSON.stringify({ user_id: userId }), { headers: this.headers }).pipe(timeout(30000))
    );
    const unwrapped = this.unwrapLambda(res);
    const data = typeof unwrapped?.data === 'string' ? JSON.parse(unwrapped.data) : unwrapped?.data;
    return (data ?? []).map((s: any) => ({
      ...s,
      ai_analysis: typeof s.ai_analysis === 'string' ? JSON.parse(s.ai_analysis) : s.ai_analysis
    }));
  }

  async getSubmissionDetail(id: number): Promise<SurveySubmission> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCgetSubmissionDetail'), JSON.stringify({ id }), { headers: this.headers }).pipe(timeout(30000))
    );
    const unwrapped = this.unwrapLambda(res);
    const data = typeof unwrapped?.data === 'string' ? JSON.parse(unwrapped.data) : unwrapped?.data;
    if (!data) throw new Error('Submission not found');
    return {
      ...data,
      ai_analysis: typeof data.ai_analysis === 'string' ? JSON.parse(data.ai_analysis) : data.ai_analysis
    };
  }

  private unwrapLambda(res: any): any {
    if (res?.data != null) return res;                        // already unwrapped
    if (typeof res?.body === 'string') return JSON.parse(res.body); // proxy string body
    if (res?.body != null) return res.body;                   // proxy object body
    return res;
  }

  async flagSubmission(id: number): Promise<void> {
    await firstValueFrom(
      this.http.post<any>(this.url('WCupdateSubmissionStatus'), JSON.stringify({ id, status: 'flagged' }), { headers: this.headers }).pipe(timeout(15000))
    );
  }

  async analyzeEnvScan(
    envData: string,
    ward: string,
    location: string,
    staffName: string
  ): Promise<{ summary: string; scores: { label: string; value: string }[]; themes: string[]; sentiment?: string; trust_signal?: string }> {
    const payload = {
      action: 'analyze',
      system: `You are the WellCentricPulse environmental AI for Washington DC. Respond ONLY with valid JSON, no markdown: {"summary":"3-4 sentence plain-language intelligence summary. Be specific and actionable.","scores":[{"label":"Built environment","value":"Good|Fair|Poor|Critical"},{"label":"Environmental burden","value":"Low|Moderate|High|Critical"},{"label":"Food access","value":"Good|Limited|Poor|Desert"},{"label":"Safety","value":"High|Moderate|Low|Critical"}],"themes":["theme1","theme2","theme3"],"sentiment":"Positive|Mixed|Negative|Urgent","trust_signal":"High|Moderate|Low|Erosion"}`,
      messages: [{
        role: 'user',
        content: `Ward: ${ward}\nLocation: ${location}\nStaff: ${staffName}\nDate: ${new Date().toLocaleDateString()}\n\n${envData}`
      }]
    };
    const res = await firstValueFrom(
      this.http.post<any>(this.env.fieldApiUrl(), JSON.stringify(payload), { headers: this.headers }).pipe(timeout(60000))
    );
    // Unwrap Lambda proxy response ({ statusCode, body: "..." }) or use direct Claude message
    const message = res?.content
      ? res
      : typeof res?.body === 'string'
        ? JSON.parse(res.body)
        : res?.body;
    return JSON.parse(message.content[0].text);
  }

  async analyzeNarrative(
    narrativeData: string,
    ward: string,
    location: string,
    staffName: string
  ): Promise<{ summary: string; themes: string[]; urgency: string; urgency_label: string; trust_signal: string; trust_label: string }> {
    const payload = {
      action: 'analyze',
      system: `You are the WellCentricPulse narrative AI for Washington DC. Analyze community field notes and respond ONLY with valid JSON, no markdown: {"summary":"3-4 sentence plain-language intelligence summary focused on community concerns and recommended action.","themes":["theme1","theme2","theme3"],"urgency":"Urgent|High|Moderate|Low","urgency_label":"one sentence describing the urgency level observed","trust_signal":"Erosion|Low|Moderate|High","trust_label":"one sentence describing the institutional trust level observed"}`,
      messages: [{
        role: 'user',
        content: `Ward: ${ward}\nLocation: ${location}\nStaff: ${staffName}\nDate: ${new Date().toLocaleDateString()}\n\n${narrativeData}`
      }]
    };
    const res = await firstValueFrom(
      this.http.post<any>(this.env.fieldApiUrl(), JSON.stringify(payload), { headers: this.headers }).pipe(timeout(60000))
    );
    const message = res?.content
      ? res
      : typeof res?.body === 'string'
        ? JSON.parse(res.body)
        : res?.body;
    return JSON.parse(message.content[0].text);
  }

  async importAirtableData(rows: AirtableRow[]): Promise<AirtableImportResult> {
    const res = await firstValueFrom(
      this.http.post<any>(this.url('WCimportSurveyData'), JSON.stringify({ rows }), { headers: this.headers }).pipe(timeout(60000))
    );
    return this.unwrapLambda(res);
  }

  async saveEnvScanToAirtable(fields: Record<string, string>): Promise<void> {
    await firstValueFrom(
      this.http.post<any>(
        this.env.fieldApiUrl(),
        JSON.stringify({ action: 'save', fields }),
        { headers: this.headers }
      ).pipe(timeout(30000))
    );
  }
}
