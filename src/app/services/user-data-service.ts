/**
 * UserDataService — typed facade over IStorageService for session data.
 *
 * The full user object (including pageAccess[]) is stored under USER_KEY
 * via setUser/getUser. IStorageService handles serialisation internally —
 * do not call JSON.stringify/parse around these methods.
 */

import { Injectable } from '@angular/core';
import { IStorageService } from './storage.service';
import { EMAIL_ID_KEY, ORG_ID_KEY, USER_ID_KEY, USER_NAME_KEY, USER_KEY } from '../constants/constant';

@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    constructor(private readonly storage: IStorageService) {}

    setUserId(id: string): void {
        this.storage.set(USER_ID_KEY, id);
    }

    getUserId(): string {
        return this.storage.get(USER_ID_KEY);
    }

    setOrgId(id: string): void {
        this.storage.set(ORG_ID_KEY, id);
    }

    getOrgId(): string {
        return this.storage.get(ORG_ID_KEY);
    }

    setUserName(id: string): void {
        this.storage.set(USER_NAME_KEY, id);
    }

    getUserName(): string {
        return this.storage.get(USER_NAME_KEY);
    }

    setEmailId(emailid: string): void {
        this.storage.set(EMAIL_ID_KEY, emailid);
    }

    getEmailId(): string {
        return this.storage.get(EMAIL_ID_KEY);
    }

    clear(): void {
        this.storage.clearStorage();
    }

    clearKey(key: string): void {
        this.storage.clear(key);
    }

    setUser(user: any): void {
        try {
            this.storage.set(USER_KEY, user);
        } catch (err) {
            console.error('Error saving user to localStorage', err);
        }
    }

    getUser<T = any>(): T | null {
        try {
            return this.storage.get<T>(USER_KEY);
        } catch {
            return null;
        }
    }

    clearUser(): void {
        localStorage.removeItem(USER_KEY);
    }

    isLoggedIn(): boolean {
        return !!this.getUser();
    }
}
