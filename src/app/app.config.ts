import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppEnvService } from './services/app-env.service';
import { IStorageService, StorageService } from './services/storage.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    AppEnvService,
    {
        provide: IStorageService,
        useClass: StorageService
    },
    provideAppInitializer(() => {
      const envService = inject(AppEnvService);
      return envService.load(); // directly returns Promise<void>
    }),
  ]
};
