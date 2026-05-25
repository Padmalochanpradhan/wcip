import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './app/interceptors/token.interceptor';

bootstrapApplication(App, {
  ...appConfig, // spread your existing config
  providers: [
    // existing providers (if any)
    ...(appConfig.providers || []),
    // Provide HttpClient with interceptor
    provideHttpClient(
      withInterceptors([tokenInterceptor])
    ),
  ]
})
.catch((err) => console.error(err));
