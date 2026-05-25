import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IStorageService } from './storage.service';
import { EMAIL_ID_KEY, ORG_ID_KEY, USER_ID_KEY, USER_NAME_KEY, USER_KEY } from '../constants/constant';

@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    constructor(
        private readonly storage: IStorageService,
        private readonly router: Router) {
    }
    
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
    // ✅ Save user data
    setUser(user: any): void {
    try {
        this.storage.set(USER_KEY, user); // ❌ remove JSON.stringify
    } catch (err) {
        console.error('Error saving user to localStorage', err);
    }
    }
    getUser<T = any>(): T | null {
    try {
        return this.storage.get<T>(USER_KEY);  // ❌ remove JSON.parse
    } catch {
        return null;
    }
    }

    // ✅ Remove user data (logout)
    clearUser(): void {
        localStorage.removeItem(USER_KEY);
    }

    // ✅ Check if logged in
    isLoggedIn(): boolean {
        return !!this.getUser();
    }

}
