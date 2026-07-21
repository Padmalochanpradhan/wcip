import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { IStorageService, StorageService } from './services/storage.service';
import { UserDataService } from './services/user-data-service';
import { App } from './app';

// Minimal stand-in for the real window.navigation (Navigation API) — lets
// tests fire a controlled 'navigate' event with a chosen navigationType,
// then a 'pagehide', without depending on the test browser's real history.
class FakeNavigation {
  private listeners: ((e: any) => void)[] = [];
  addEventListener(_type: string, cb: (e: any) => void) { this.listeners.push(cb); }
  removeEventListener(_type: string, cb: (e: any) => void) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }
  fireNavigate(navigationType: string) {
    this.listeners.forEach(cb => cb({ navigationType }));
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should run ngOnInit (session check + idle watch) without throwing', () => {
    const fixture = TestBed.createComponent(App);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});

describe('App — logout on back/forward navigation out of the site', () => {
  let fakeNav: FakeNavigation;
  let originalNavigation: any;
  let clearUserSpy: jasmine.Spy;

  beforeEach(async () => {
    originalNavigation = (window as any).navigation;
    fakeNav = new FakeNavigation();
    Object.defineProperty(window, 'navigation', { value: fakeNav, configurable: true });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
      ],
    }).compileComponents();

    clearUserSpy = spyOn(TestBed.inject(UserDataService), 'clearUser');
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigation', { value: originalNavigation, configurable: true });
  });

  it('clears the session when the last navigation was a back/forward traversal', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    fakeNav.fireNavigate('traverse');
    window.dispatchEvent(new Event('pagehide'));

    expect(clearUserSpy).toHaveBeenCalled();
  });

  it('does not clear the session on a plain refresh', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    fakeNav.fireNavigate('reload');
    window.dispatchEvent(new Event('pagehide'));

    expect(clearUserSpy).not.toHaveBeenCalled();
  });

  it('does not clear the session for normal in-app navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    fakeNav.fireNavigate('push');
    window.dispatchEvent(new Event('pagehide'));

    expect(clearUserSpy).not.toHaveBeenCalled();
  });

  it('does not throw and skips the feature when window.navigation is unsupported', () => {
    Object.defineProperty(window, 'navigation', { value: undefined, configurable: true });

    const fixture = TestBed.createComponent(App);
    expect(() => fixture.detectChanges()).not.toThrow();

    expect(() => window.dispatchEvent(new Event('pagehide'))).not.toThrow();
    expect(clearUserSpy).not.toHaveBeenCalled();
  });
});

describe('App — logout when returning via bfcache (back-out then forward-in)', () => {
  let clearUserSpy: jasmine.Spy;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
      ],
    }).compileComponents();

    clearUserSpy = spyOn(TestBed.inject(UserDataService), 'clearUser');
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
  });

  it('logs out and redirects to /login when the page is restored from bfcache', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

    expect(clearUserSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('does nothing on a normal (non-bfcache) page load', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));

    expect(clearUserSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
