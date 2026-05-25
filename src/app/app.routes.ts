import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { Login } from './views/auth/login/login';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { Dashboard } from './views/dashboard/dashboard';
import { SurveyLayout } from './core/layout/survey-layout/survey-layout';
import { SurveyDashboard } from './views/survey-dashboard/survey-dashboard';
import { SurveyForm } from './views/survey-form/survey-form';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: Login },
    ]
  },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
    ]
  },
  {
    path: '',
    component: SurveyLayout,
    children: [
      { path: 'field-home', component: SurveyDashboard },
      { path: 'survey/:id', component: SurveyForm },
    ]
  },
  { path: '**', redirectTo: 'login' }
];


