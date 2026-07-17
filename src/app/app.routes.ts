import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { Login } from './views/auth/login/login';
import { SurveyLayout } from './core/layout/survey-layout/survey-layout';
import { SurveyDashboard } from './views/survey-dashboard/survey-dashboard';
import { SurveyForm } from './views/survey-form/survey-form';
import { SubmissionsList } from './views/submissions-list/submissions-list';
import { SubmissionDetail } from './views/submission-detail/submission-detail';
import { AdminLayout } from './core/layout/admin-layout/admin-layout';
import { AdminDashboard } from './views/admin-dashboard/admin-dashboard';
import { AdminOverview } from './views/admin-overview/admin-overview';
import { AdminStaffActivity } from './views/admin-staff-activity/admin-staff-activity';
import { AdminWards } from './views/admin-wards/admin-wards';
import { AdminSubmissions } from './views/admin-submissions/admin-submissions';
import { AdminUsers } from './views/admin-users/admin-users';
import { AdminSurveys } from './views/admin-surveys/admin-surveys';
import { AdminSurveyBuilder } from './views/admin-survey-builder/admin-survey-builder';
import { AdminImport } from './views/admin-import/admin-import';
import { AdminPageAccess } from './views/admin-page-access/admin-page-access';
import { DataExplorer } from './views/data-explorer/data-explorer';
import { authGuard } from './shared/guards/auth.guard';
import { guestGuard } from './shared/guards/guest.guard';
import { ChangePassword } from './views/change-password/change-password';
import { AccessDenied } from './views/access-denied/access-denied';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      { path: '', component: Login, pathMatch: 'full', canActivate: [guestGuard] },
      { path: 'login', component: Login, canActivate: [guestGuard] },
      { path: 'change-password', component: ChangePassword },
    ]
  },
  {
    path: '',
    component: SurveyLayout,
    canActivate: [authGuard],
    children: [
      { path: 'field-home', component: SurveyDashboard },
      { path: 'survey/:id', component: SurveyForm },
      { path: 'submissions', component: SubmissionsList },
      { path: 'submissions/:id', component: SubmissionDetail },
      { path: 'data-explorer', component: DataExplorer },
      { path: 'access-denied', component: AccessDenied },
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AdminDashboard,
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          { path: 'overview', component: AdminOverview },
          { path: 'staff', component: AdminStaffActivity },
          { path: 'wards', component: AdminWards },
          { path: 'submissions', component: AdminSubmissions },
          { path: 'submissions/:id', component: SubmissionDetail },
          { path: 'users', component: AdminUsers },
          { path: 'page-access', component: AdminPageAccess },
          { path: 'surveys', component: AdminSurveys },
          { path: 'surveys/:id', component: AdminSurveyBuilder },
          { path: 'import', component: AdminImport },
          { path: 'access-denied', component: AccessDenied },
        ]
      },
    ]
  },
  { path: '**', redirectTo: 'login' }
];


