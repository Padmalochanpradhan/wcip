import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { Login } from './views/auth/login/login';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { Dashboard } from './views/dashboard/dashboard';
import { SurveyLayout } from './core/layout/survey-layout/survey-layout';
import { SurveyDashboard } from './views/survey-dashboard/survey-dashboard';
import { SurveyForm } from './views/survey-form/survey-form';
import { SubmissionsList } from './views/submissions-list/submissions-list';
import { SubmissionDetail } from './views/submission-detail/submission-detail';
import { AdminLayout } from './core/layout/admin-layout/admin-layout';
import { AdminDashboard } from './views/admin-dashboard/admin-dashboard';
import { AdminSubmissions } from './views/admin-submissions/admin-submissions';
import { AdminUsers } from './views/admin-users/admin-users';
import { AdminSurveys } from './views/admin-surveys/admin-surveys';
import { AdminSurveyBuilder } from './views/admin-survey-builder/admin-survey-builder';
import { DataExplorer } from './views/data-explorer/data-explorer';

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
      { path: 'submissions', component: SubmissionsList },
      { path: 'submissions/:id', component: SubmissionDetail },
      { path: 'data-explorer', component: DataExplorer },
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', component: AdminDashboard },
      { path: 'submissions', component: AdminSubmissions },
      { path: 'submissions/:id', component: SubmissionDetail },
      { path: 'users', component: AdminUsers },
      { path: 'surveys', component: AdminSurveys },
      { path: 'surveys/:id', component: AdminSurveyBuilder },
    ]
  },
  { path: '**', redirectTo: 'login' }
];


