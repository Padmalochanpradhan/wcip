import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from "@angular/material/card";
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Title } from '@angular/platform-browser';
import { ConfigService } from '../../../services/api.service';
import { IdleTimeoutService } from '../../../services/idle-timeout';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '../../../services/auth';
import { LoginRequest, UsernameRequest } from '../../../models/requests/loginRequest';
import { MatIconModule } from '@angular/material/icon';
import { UserDataService } from '../../../services/user-data-service';

import { AuthService } from '../../../services/auth.service';

import { MatDialog } from '@angular/material/dialog';
import { PasswordWarningDialog } from '../../dialogs/password-warning-dialog/password-warning-dialog';
import { QRCodeComponent   } from 'angularx-qrcode';

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    CommonModule,
    QRCodeComponent
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  username = '';
  password = '';
  userId: number = 0;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  session: string = '';
  qrCodeData: string = '';
  otp: string = '';
  @ViewChild('firstOtpInput') firstOtpInput!: ElementRef<HTMLInputElement>;
  @ViewChild('loginOtpInput') loginOtpInput!: ElementRef<HTMLInputElement>;

  showQrScreen: boolean = false;
  showOtpScreen: boolean = false;
  constructor(private readonly router: Router,
    private readonly authService: Auth,
    private readonly userData: UserDataService,
    private readonly titleService: Title,
    private readonly idleService: IdleTimeoutService,
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
    
   
    private readonly apiService: ConfigService,
    private readonly dialog: MatDialog) { }

  ngOnInit() {
    this.titleService.setTitle('WCIP :: LOGIN');
    this.errorMessage = window.history.state?.message || '';
    this.successMessage = window.history.state?.successMessage || '';
  }

  ngOnDestroy(): void {}


  async onSubmit() {
    this.isLoading = true;
    this.clearError();
 
    try {
      const cognitoResult = await this.auth.login(this.username, this.password);
      if (cognitoResult.status === "SUCCESS") {

        await this.continueBackendLogin();
 
      } else if (cognitoResult.status === "MFA_SETUP") {

        this.session = cognitoResult.session;

        this.setupQrCode();

      } else if (cognitoResult.status === "SOFTWARE_TOKEN_MFA") {

        this.session = cognitoResult.session;
        this.otp = '';
        this.showOtpScreen = true;
        this.cdr.detectChanges();
        setTimeout(() => this.loginOtpInput?.nativeElement?.focus(), 0);

      }
    } catch (error) {
      const err = error as Error;
      this.errorMessage = err.message;
      
      if (err.message?.includes("Invalid credentials") || err.name === "NotAuthorizedException") {

          try {
            if (err.message?.includes("User is disabled.") && err.name === "NotAuthorizedException") {
              this.errorMessage = "Your account is locked. Please contact the administrator.";
              return;
            }
           
            const request: UsernameRequest = {
              username: this.username
            };
            const result = await this.authService.loginfailedincrement<any>(request);
            if (result.is_locked) {
              
               const lockeRresult =await this.authService.lockedUser<any>(request);
              
              if(lockeRresult.statusCode==200){
                this.errorMessage = "Your account is locked. Please contact the administrator.";
              }
              const message = `Account is locked due to multiple login failures (${this.username}).`;
              this.logAction('Account Lock', message);
              
              return;
            }

           
            this.errorMessage = `Invalid credentials. You have used ${result.attempts} of ${result.max_attempts} allowed attempts.`;

          } catch {
            this.errorMessage = "Login failed. Please try again.";
          }

          return;
        }

        // 🔒 User already disabled in Cognito
        if (err.name === "UserDisabledException") {
          this.errorMessage = "Your account is locked. Contact admin.";
          return;
        }
    } finally {
      this.isLoading = false;
    }
  }
private logAction(log_name: string, note: string): Promise<any> {
  const logPayload = {
    table_name: 'MEM_SYSTEM_LOG',
    insertDataArray: [{
     
      log_name: log_name,
      log_details: note,
      log_status: 'SUCCESS',
      log_by: 0,
      action_type: 'LOCK'
    }]
  };

  return this.apiService.insert(logPayload);
}
async setupQrCode() {
  try {
    const response =
      await this.auth.associateSoftwareToken(this.session);
    this.session = response.Session;

    const secretCode = response.SecretCode;

    this.qrCodeData = `otpauth://totp/WC:${encodeURIComponent(this.username)}?secret=${secretCode}&issuer=WC`;
    this.otp = '';
    this.showQrScreen = true;
    this.cdr.detectChanges();
    setTimeout(() => this.firstOtpInput?.nativeElement?.focus(), 0);
  }
  catch (err) {
    console.error(err);
    this.errorMessage = "Failed to setup MFA";
  }
}  
  async verifyFirstOtp() {
    this.isLoading = true;
    try {
      const verify = await this.auth.verifySoftwareToken(this.session, this.otp);
      if (!verify.Session) {
        throw new Error("Session missing from Cognito response");
      }
      await this.auth.confirmMfaSetup(this.username, verify.Session, this.otp);
      this.showQrScreen = false;
      await this.continueBackendLogin();
    } catch {
      this.errorMessage = 'Invalid OTP';
    } finally {
      this.isLoading = false;
    }
  }
  async verifyLoginOtp() {
    this.isLoading = true;
    try {
      await this.auth.verifyLoginOtp(this.username, this.session, this.otp);
      this.showOtpScreen = false;
      await this.continueBackendLogin();
    } catch {
      this.errorMessage = 'Invalid OTP';
    } finally {
      this.isLoading = false;
    }
  }
  async continueBackendLogin() {
    try {
      this.isLoading = true;
       const requestUnkock: LoginRequest = {
        username: this.username
      };
      await this.authService.loginSuccessReset<any>(requestUnkock);
      const request: LoginRequest = {
        username: this.username,
        password: this.password
      };
      const result = await this.authService.login<any>(request);
      const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
      if (data && data.length > 0) {
        const user = data[0];
        user.pageAccess = result.pageAccess;
        this.userData.setUser(user);
        // 🔒 Password expired (STRICT)
        if (user.is_password_expired === 1) {
          this.isLoading = false;
          this.openPasswordWarningDialog(user,true);
          return;
        }
        // ⚠️ Password expiry warning (SOFT)
        if (user.password_expiry_warning === 1) {
          this.isLoading = false;
          this.openPasswordWarningDialog(
            user,
            false
          );
          return;
        }
        // ✅ Normal login success
        this.completeLogin(user);
      }
      else {
        this.errorMessage = "Invalid login credentials";
      }
    }
    catch (err: any) {
      this.errorMessage = err.message || "Login failed";
    }
    finally {
      this.isLoading = false;
    }
  }  
  onOtpInput(value: string) {
    this.errorMessage = '';
    if (value.length === 6) {
      if (this.showQrScreen) {
        this.verifyFirstOtp();
      } else if (this.showOtpScreen) {
        this.verifyLoginOtp();
      }
    }
  }

  clearError() {
    this.errorMessage = '';
  }
  private openPasswordWarningDialog(
    user: any,
    isExpired: boolean
  ): void {

    const dialogRef = this.dialog.open(PasswordWarningDialog, {
      width: '500px',
      disableClose: true,
      data: {
        message: user.password_message,
        is_password_expired: isExpired
      }
    });

    dialogRef.afterClosed().subscribe((action: 'change' | 'skip') => {
      // 🔒 Expired → must reset
      if (isExpired) {
        if (action === 'change') {
          this.router.navigate(['/change-password']);
        }
        return; // ⛔ never allow login
      }

      // ⚠️ Warning → optional
      if (action === 'change') {
        this.router.navigate(['/change-password']);
      } else {
        this.completeLogin(user);
      }
    });
  }

  private completeLogin(user: any): void {
    this.userData.setUser(user);
    this.userId = user.ID;
    this.idleService.startWatching();
    this.addloginHistory();
    this.router.navigate(user.role_id === 2 ? ['/admin'] : ['/field-home']);
  }

  addloginHistory() {
    const logpayload = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: 0,
        log_name: 'LOGIN',
        log_details: `Login By ${this.username}`,
        log_status: 'SUCCESS',
        log_by: this.userId,
        action_type: `${this.username}`
      }]
    };
    return this.apiService.insert(logpayload);
  }
}
