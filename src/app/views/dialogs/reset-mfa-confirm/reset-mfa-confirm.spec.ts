import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IStorageService, StorageService } from '../../../services/storage.service';
import { ConfigService } from '../../../services/api.service';
import { UserDataService } from '../../../services/user-data-service';

import { ResetMfaConfirm } from './reset-mfa-confirm';

describe('ResetMfaConfirm', () => {
  let component: ResetMfaConfirm;
  let fixture: ComponentFixture<ResetMfaConfirm>;
  let dialogCloseSpy: jasmine.Spy;
  let apiServiceSpy: jasmine.SpyObj<Pick<ConfigService, 'resetUserMfa' | 'insert'>>;
  let userDataSpy: jasmine.SpyObj<Pick<UserDataService, 'getUser'>>;

  const dialogData = {
    userId: 12,
    cognito_username: 'cognito-sub-abc',
    email: 'jane@example.com',
    role: 'Field Staff',
    name: 'Jane Doe',
  };

  beforeEach(async () => {
    dialogCloseSpy = jasmine.createSpy('close');

    apiServiceSpy = jasmine.createSpyObj('ConfigService', ['resetUserMfa', 'insert']);
    apiServiceSpy.resetUserMfa.and.resolveTo({ message: 'ok', newPassword: 'Xk9#mPq2Rw7z' });
    apiServiceSpy.insert.and.resolveTo({});

    userDataSpy = jasmine.createSpyObj('UserDataService', ['getUser']);
    userDataSpy.getUser.and.returnValue({ ID: 1 });

    await TestBed.configureTestingModule({
      imports: [ResetMfaConfirm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: IStorageService, useClass: StorageService },
        { provide: ConfigService, useValue: apiServiceSpy },
        { provide: UserDataService, useValue: userDataSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: { close: dialogCloseSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetMfaConfirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes without calling the API when the user cancels', async () => {
    await component.confirm(false);

    expect(apiServiceSpy.resetUserMfa).not.toHaveBeenCalled();
    expect(dialogCloseSpy).toHaveBeenCalledWith({ refresh: false });
  });

  it('recreates the account using the staff email, since WCResetUserMfa looks up cognito_username by email', async () => {
    await component.confirm(true);

    expect(apiServiceSpy.resetUserMfa).toHaveBeenCalledWith({ username: 'jane@example.com' });
  });

  it('holds the new password on the component instead of closing immediately', async () => {
    await component.confirm(true);

    expect(component.newPassword).toBe('Xk9#mPq2Rw7z');
    expect(dialogCloseSpy).not.toHaveBeenCalled();
  });

  it('only closes once the admin dismisses the password screen via done()', async () => {
    await component.confirm(true);
    expect(dialogCloseSpy).not.toHaveBeenCalled();

    component.done();

    expect(dialogCloseSpy).toHaveBeenCalledWith({ refresh: true });
  });

  it('logs the reset action with staff-readable context', async () => {
    await component.confirm(true);

    const logCall = apiServiceSpy.insert.calls.mostRecent().args[0] as any;
    expect(logCall.table_name).toBe('SYSTEM_LOG');
    expect(logCall.insertDataArray[0].log_name).toBe('RESET MFA');
    expect(logCall.insertDataArray[0].log_details).toContain('jane@example.com');
  });

  it('surfaces an error message and does not show a password on failure', async () => {
    apiServiceSpy.resetUserMfa.and.rejectWith(new Error('Cognito unavailable'));

    await component.confirm(true);

    expect(component.errorMessage).toBe('Cognito unavailable');
    expect(component.newPassword).toBe('');
    expect(dialogCloseSpy).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('copyPassword() copies the new password to the clipboard', async () => {
    spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    await component.confirm(true);

    await component.copyPassword();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Xk9#mPq2Rw7z');
    expect(component.copied).toBeTrue();
  });
});
