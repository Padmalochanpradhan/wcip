import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { AppEnvService } from './app-env.service';
import { DataSourcePlugin, DataResult } from '../models/data-source.models';
import { CensusACSSource } from './sources/census-acs.source';
import { BRFSSSource }     from './sources/brfss.source';
import { CDCEJISource }    from './sources/cdc-eji.source';

/*
  To add a new data source:
  1. Create src/app/services/sources/your-source.source.ts implementing DataSourcePlugin
  2. Import it here and add it to the SOURCES array — nothing else changes.
*/
const SOURCES: DataSourcePlugin[] = [
  CensusACSSource,
  BRFSSSource,
  CDCEJISource,
  // BLSSource,
  // EPASource,
];

@Injectable({ providedIn: 'root' })
export class DataSourceService {
  readonly sources: DataSourcePlugin[] = SOURCES;

  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private readonly http: HttpClient,
    private readonly env: AppEnvService
  ) {}

  getSource(id: string): DataSourcePlugin | undefined {
    return this.sources.find(s => s.id === id);
  }

  async fetch(sourceId: string, params: Record<string, string>): Promise<DataResult> {
    const source = this.getSource(sourceId);
    if (!source) throw new Error(`Unknown source: ${sourceId}`);

    const { externalUrl } = source.buildProxyRequest(params);

    const proxyUrl = `${this.env.endpointUrl()}WCdataProxy-${this.env.envType()}`;

    const res = await firstValueFrom(
      this.http.post<any>(
        proxyUrl,
        JSON.stringify({ url: externalUrl }),
        { headers: this.headers }
      ).pipe(timeout(30000))
    );

    // Unwrap Lambda proxy response
    const raw = typeof res?.body === 'string' ? JSON.parse(res.body) : (res?.body ?? res);

    return source.parseResult(raw, externalUrl, params);
  }
}
