import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { ChangePassword } from './change-password';
import { ConfigService } from '../../services/api.service';
import { UserDataService } from '../../services/user-data-service';
import { AuthService } from '../../services/auth.service';

const VALID_PASSWORD = 'aA1!aaaa'; // 8+ chars, upper, lower, number, special

describe('ChangePassword', () => {
  let component: ChangePassword;
  let fixture: ComponentFixture<ChangePassword>;
  let navigateSpy: jasmine.Spy;
  let apiServiceSpy: jasmine.SpyObj<Pick<ConfigService, 'updateCognitoUser' | 'wcUserPasswordUpdate'>>;
  let userDataSpy: jasmine.SpyObj<Pick<UserDataService, 'getUser' | 'clearUser'>>;
  let authServiceSpy: jasmine.SpyObj<Pick<AuthService, 'changePassword'>>;
  let currentUser: any;

  beforeEach(async () => {
    navigateSpy = jasmine.createSpy('navigate');
    currentUser = { ID: 42, email: 'jane@example.com', cognito_username: 'jane-cognito' };

    apiServiceSpy = jasmine.createSpyObj('ConfigService', ['updateCognitoUser', 'wcUserPasswordUpdate']);
    apiServiceSpy.updateCognitoUser.and.resolveTo({});
    apiServiceSpy.wcUserPasswordUpdate.and.resolveTo({});

    userDataSpy = jasmine.createSpyObj('UserDataService', ['getUser', 'clearUser']);
    userDataSpy.getUser.and.callFake(() => currentUser);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['changePassword']);
    authServiceSpy.changePassword.and.resolveTo();

    history.replaceState(null, '');

    await TestBed.configureTestingModule({
      imports: [ChangePassword],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: Title, useValue: { setTitle: () => {} } },
        { provide: ConfigService, useValue: apiServiceSpy },
        { provide: UserDataService, useValue: userDataSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePassword);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('passwordMismatch', () => {
    it('is false until confirmPassword is entered', () => {
      component.newPassword = 'abc';
      expect(component.passwordMismatch).toBeFalse();
    });

    it('is true when new and confirm differ', () => {
      component.newPassword = 'abc';
      component.confirmPassword = 'xyz';
      expect(component.passwordMismatch).toBeTrue();
    });

    it('is false when they match', () => {
      component.newPassword = 'abc';
      component.confirmPassword = 'abc';
      expect(component.passwordMismatch).toBeFalse();
    });
  });

  describe('ngOnInit — reading router state', () => {
    it('defaults fromLogin/returnTo to false/empty with no router state', () => {
      fixture.detectChanges();
      expect(component.fromLogin).toBeFalse();
      expect(component.returnTo).toBe('');
    });

    it('picks up fromLogin from history state (forced 30-day reset)', () => {
      history.pushState({ fromLogin: true }, '');
      fixture.detectChanges();
      expect(component.fromLogin).toBeTrue();
      expect(component.returnTo).toBe('');
    });

    it('picks up fromLogin + returnTo (soft-warning "change now" or voluntary menu link)', () => {
      history.pushState({ fromLogin: true, returnTo: '/admin' }, '');
      fixture.detectChanges();
      expect(component.fromLogin).toBeTrue();
      expect(component.returnTo).toBe('/admin');
    });
  });

  describe('cancel()', () => {
    it('returns to returnTo without clearing the session when set (voluntary/soft-warning path)', () => {
      history.pushState({ returnTo: '/field-home' }, '');
      fixture.detectChanges();

      component.cancel();

      expect(userDataSpy.clearUser).not.toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/field-home']);
    });

    it('clears the session and goes to /login when there is no returnTo (forced 30-day reset)', () => {
      fixture.detectChanges(); // no router state -> returnTo stays ''

      component.cancel();

      expect(userDataSpy.clearUser).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('onSubmit() validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('requires the current password on the voluntary path (fromLogin=false)', async () => {
      component.fromLogin = false;
      component.oldPassword = '';
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;

      await component.onSubmit();

      expect(component.errorMessage).toBe('Please enter your current password.');
      expect(authServiceSpy.changePassword).not.toHaveBeenCalled();
    });

    it('does not require the current password on the forced path (fromLogin=true)', async () => {
      component.fromLogin = true;
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;

      await component.onSubmit();

      expect(component.errorMessage).toBe('');
    });

    it('rejects mismatched new/confirm passwords', async () => {
      component.fromLogin = true;
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = 'somethingElse1!';

      await component.onSubmit();

      expect(component.errorMessage).toBe('Passwords do not match.');
    });

    it('rejects a password that fails the policy (too short)', async () => {
      component.fromLogin = true;
      component.newPassword = 'aA1!';
      component.confirmPassword = 'aA1!';

      await component.onSubmit();

      expect(component.errorMessage).toContain('at least 8 characters');
    });

    it('rejects a password missing a special character', async () => {
      component.fromLogin = true;
      component.newPassword = 'Aaaaaaa1';
      component.confirmPassword = 'Aaaaaaa1';

      await component.onSubmit();

      expect(component.errorMessage).toContain('special character');
    });

    it('redirects to /login when the session is gone', async () => {
      userDataSpy.getUser.and.returnValue(null);
      component.fromLogin = true;
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;

      await component.onSubmit();

      expect(component.errorMessage).toBe('Session expired. Please login again.');
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('onSubmit() — forced path (fromLogin=true)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.fromLogin = true;
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;
    });

    it('updates Cognito via the admin-style path, not the old-password-verifying one', async () => {
      await component.onSubmit();

      expect(apiServiceSpy.updateCognitoUser).toHaveBeenCalledWith('jane-cognito', {}, VALID_PASSWORD);
      expect(authServiceSpy.changePassword).not.toHaveBeenCalled();
    });

    it('falls back to email when cognito_username is missing', async () => {
      currentUser = { ID: 42, email: 'jane@example.com' };
      await component.onSubmit();
      expect(apiServiceSpy.updateCognitoUser).toHaveBeenCalledWith('jane@example.com', {}, VALID_PASSWORD);
    });
  });

  describe('onSubmit() — voluntary path (fromLogin=false)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.fromLogin = false;
      component.oldPassword = 'myOldPassword1!';
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;
    });

    it('verifies the old password via AuthService.changePassword, not the admin-style Cognito update', async () => {
      await component.onSubmit();

      expect(authServiceSpy.changePassword).toHaveBeenCalledWith('myOldPassword1!', VALID_PASSWORD);
      expect(apiServiceSpy.updateCognitoUser).not.toHaveBeenCalled();
    });

    it('maps NotAuthorizedException to "Current password is incorrect."', async () => {
      authServiceSpy.changePassword.and.rejectWith({ name: 'NotAuthorizedException' });
      await component.onSubmit();
      expect(component.errorMessage).toBe('Current password is incorrect.');
      expect(component.isLoading).toBeFalse();
    });

    it('maps InvalidPasswordException to a policy message', async () => {
      authServiceSpy.changePassword.and.rejectWith({ name: 'InvalidPasswordException', message: 'too weak' });
      await component.onSubmit();
      expect(component.errorMessage).toBe('too weak');
    });

    it('maps LimitExceededException to a rate-limit message', async () => {
      authServiceSpy.changePassword.and.rejectWith({ name: 'LimitExceededException' });
      await component.onSubmit();
      expect(component.errorMessage).toBe('Too many attempts. Please wait a moment and try again.');
    });

    it('does not sync the DB password if the Cognito call fails', async () => {
      authServiceSpy.changePassword.and.rejectWith({ name: 'NotAuthorizedException' });
      await component.onSubmit();
      expect(apiServiceSpy.wcUserPasswordUpdate).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit() — DB sync (regression: uppercase ID field)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.fromLogin = true;
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;
    });

    it('syncs wcUserPasswordUpdate using user.ID (uppercase, as returned by WCAuthentication)', async () => {
      currentUser = { ID: 99, email: 'x@example.com' };
      await component.onSubmit();
      expect(apiServiceSpy.wcUserPasswordUpdate).toHaveBeenCalledWith({ ID: 99, Password: VALID_PASSWORD });
    });

    it('falls back to lowercase id if ID is absent', async () => {
      currentUser = { id: 77, email: 'x@example.com' };
      await component.onSubmit();
      expect(apiServiceSpy.wcUserPasswordUpdate).toHaveBeenCalledWith({ ID: 77, Password: VALID_PASSWORD });
    });

    it('shows a sync-failure message (without implying total failure) if the DB update fails', async () => {
      apiServiceSpy.wcUserPasswordUpdate.and.rejectWith(new Error('db down'));
      await component.onSubmit();
      expect(component.errorMessage).toContain('Your password was changed');
      expect(userDataSpy.clearUser).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit() — full success', () => {
    it('clears the session and redirects to /login with a success message', async () => {
      fixture.detectChanges();
      component.fromLogin = true;
      component.newPassword = VALID_PASSWORD;
      component.confirmPassword = VALID_PASSWORD;

      await component.onSubmit();

      expect(userDataSpy.clearUser).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
        state: { successMessage: 'Password changed successfully. Please login again.' },
      });
      expect(component.isLoading).toBeFalse();
    });
  });
});
