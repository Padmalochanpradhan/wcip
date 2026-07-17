import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IAppEnvironment } from '../models/iapp-types';
import CryptoJS from 'crypto-js';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AppEnvService {
    private config!: IAppEnvironment;
    constructor(
        public http: HttpClient,
        // private storageService: IStorageService
    ) {
    }

    encryptionConfig(): boolean {
        return false; 
    }
    version(): string {
        return this.config.version ?? 'unknown';
    }
    build(): string {
        return this.config.build ?? 'unknown';
    }
    endpointUrl(): string {
        return this.config.endpointUrl ?? 'unknown';
    }
    fieldApiUrl(): string {
        return this.config.fieldApiUrl ?? '';
    }
    envType(): string {
        return this.config.envType ?? 'unknown';
    }
    s3bucket(): string {
        return 'cih-plan-document';
    }
    async load(): Promise<void> {
        try {
            const env: any = await firstValueFrom(this.http.get('assets/environment.json'));
            if (env.encrypted !== undefined) {
                const bytes = CryptoJS.AES.decrypt(env.encrypted, '0123456789');
                const original = bytes.toString(CryptoJS.enc.Utf8);
                this.config = JSON.parse(original);
            } else {
                this.config = env;
            }
             
        } catch (error) {
            console.error('❌ Error loading environment configuration:', error);
            throw error;
        }
    }
}
