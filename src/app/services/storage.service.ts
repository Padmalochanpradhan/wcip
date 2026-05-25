import { Injectable } from '@angular/core';
import { AppEnvService } from './app-env.service';
import CryptoJS from 'crypto-js';
import { DecryptException } from '../exceptions/decrypt.exception';
import { Router } from '@angular/router';

export abstract class IStorageService {
    abstract get<T>(key: string): T;
    abstract set<T>(key: string, value: T): void;
    abstract clearStorage(): void;
    abstract clear(key: string): void;
}

@Injectable()
export class StorageService extends IStorageService {
    isEncryptionEnabled: boolean;
    secretKey: string;
    constructor (private readonly appEnvService: AppEnvService, private readonly router: Router) {
        super();
        this.isEncryptionEnabled = this.appEnvService.encryptionConfig();
        this.secretKey = this.generateSecretKey();
    }

    public get<T>(key: string): T {
        const item = localStorage.getItem(key);
        if (item === null) {
            throw new Error(`Key "${key}" not found in localStorage.`);
        }

        try {
            if (this.isEncryptionEnabled) {
            const decrypted = this.decrypt(item); // item is definitely a string here
            return JSON.parse(decrypted) as T;
            } else {
            return JSON.parse(item) as T;
            }
        } catch (ex) {
            // ex is unknown, safely cast only if it's actually an Error
            const err = ex instanceof Error ? ex : new Error(String(ex));
            throw new DecryptException('Unable to decrypt', err);
        }
    }

    public set<T>(key: string, value: T): void {
        if (this.isEncryptionEnabled === true) {
            const encryptedValue = this.encrypt(JSON.stringify(value));
            localStorage.setItem(key, encryptedValue);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }

    public clear(key: string): void {
        if (this.isEncryptionEnabled === true) {
            const encryptedKey = this.encrypt(key);
            localStorage.removeItem(encryptedKey);
        } else {
            localStorage.removeItem(key);
        }
    }

    public clearStorage(): void {
        localStorage.clear();
    }

    private encrypt(value: string): string {
        const cipherText = CryptoJS.AES.encrypt(value, this.secretKey, {
            mode: CryptoJS.mode.ECB
        }).toString();
        return cipherText;
    }

    private decrypt(cipherText: string): string {
        const bytes = CryptoJS.AES.decrypt(cipherText, this.secretKey, {
            mode: CryptoJS.mode.ECB
        });
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    }

    private generateSecretKey(): string {
        let key = '';
        const stringArrayKey = this.generateSecretKey.name.split('');
        stringArrayKey.forEach(x => {
            key = key + x.charCodeAt(0);
        });
        return key;
    }
}
