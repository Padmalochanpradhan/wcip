import { Component, isDevMode, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ErrorReportingService } from '../services/errorReporting/error-reporting.service';
import { ErrorReportFactory } from '../services/errorReporting/errorReport';
import { BusyIndicatorComponent } from '../shared/components/busy-indicator/busy-indicator.component';
import { ConfirmDialogComponent } from '../shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorDialogComponent } from '../shared/components/error-dialog/error-dialog.component';
import { InfoDialogComponent } from '../shared/components/info-dialog/info-dialog.component';
import { OkDialogComponent } from '../shared/components/ok-dialog/ok-dialog.component';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.css']
})
export class BaseComponent {

  constructor(
    protected errorLogger: ErrorReportingService,
    public matDialog: MatDialog) { }

    private readonly eventSubject = new Subject<any>();

    sendEvent(data: any) {
      this.eventSubject.next(data);
    }
  
    getEvent() {
      return this.eventSubject.asObservable();
    }  
  showBusyDialog(message?: string): MatDialogRef<BusyIndicatorComponent> {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.panelClass = 'busy-dialog';

      dialogConfig.data = {
          message
      };

      return this.matDialog.open(BusyIndicatorComponent, dialogConfig);
  }

  showConfirmDialog(theTitle: string, msg: string, onClosed?: ((result: boolean) => void),confirmButtonName:string="Confirm"): void {
    const confirmDialog = this.matDialog.open(ConfirmDialogComponent, {
      data: {
        title: theTitle,
        message: msg,
        confirmButtonName:confirmButtonName
      }
    });
    confirmDialog.afterClosed().subscribe((result: any) => {
      onClosed?.(result);
    });
  }
  
  logError(errorMessage: string, ex: any): void {
    this.errorLogger.submitErrorReport(ErrorReportFactory.newErrorReport(errorMessage, ex));
  }

  displayError(
    errorMessage: string,
    title: string,
    ex?: any,
    onClosed?: ((result?: any) => void) ): void {

    if (ex) {
      this.logError(errorMessage, ex);
    }

    const errorDetails = isDevMode() ? ErrorReportFactory.getErrorMessageWithStackTrace(ex) : undefined;
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '600px';
    dialogConfig.minWidth = '300px';
    dialogConfig.data = {errorMessage, title, errorDetails};
    dialogConfig.panelClass = 'error-dialog';
    

    this.matDialog.open(ErrorDialogComponent, dialogConfig)
      .afterClosed()
      .subscribe((result: any) => {
        if (onClosed) {
          onClosed(result);
        }
      });
  }

  displayInfo(
    errorMessage: string,
    title: string,
    ex?: any,
    onClosed?: ((result?: any) => void) ): void {

      if (ex) {
        this.logError(errorMessage, ex);
      }
  
      const errorDetails = isDevMode() ? ErrorReportFactory.getErrorMessageWithStackTrace(ex) : undefined;
      const dialogConfig = new MatDialogConfig();
  
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.width = '650px';
      dialogConfig.minWidth = '200px';
      dialogConfig.data = {errorMessage, title, errorDetails};
      dialogConfig.panelClass = 'info-dialog';
      
  
      this.matDialog.open(ErrorDialogComponent, dialogConfig)
        .afterClosed()
        .subscribe(result => {
          if (onClosed) {
            onClosed(result);
          }
        });
    }  
  displayWarning(
    errorMessage: string,
    title: string,
    ex?: any,
    onClosed?: ((result?: any) => void) ): void {

    if (ex) {
      this.logError(errorMessage, ex);
    }

    const errorDetails = isDevMode() ? ErrorReportFactory.getErrorMessageWithStackTrace(ex) : undefined;
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '400px';
    dialogConfig.minWidth = '200px';
    dialogConfig.data = {errorMessage, title, errorDetails};
    dialogConfig.panelClass = 'warning-dialog';
    

    this.matDialog.open(ErrorDialogComponent, dialogConfig)
      .afterClosed()
      .subscribe(result => {
        if (onClosed) {
          onClosed(result);
        }
      });
  }
  displayInfoHTML(
    errorMessage: string,
    title: string,
    ex?: any,
    onClosed?: ((result?: any) => void) ): void {

      if (ex) {
        this.logError(errorMessage, ex);
      }
  
      const errorDetails = isDevMode() ? ErrorReportFactory.getErrorMessageWithStackTrace(ex) : undefined;
      const dialogConfig = new MatDialogConfig();
  
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.width = '650px';
      dialogConfig.minWidth = '200px';
      dialogConfig.data = {errorMessage, title, errorDetails};
      dialogConfig.panelClass = 'info-dialog';
      
  
      this.matDialog.open(InfoDialogComponent, dialogConfig)
        .afterClosed()
        .subscribe(result => {
          if (onClosed) {
            onClosed(result);
          }
        });
    }
    
  showOkDialogWarning(theTitle: string, msg: string, onClosed?: ((result: boolean) => void)): void {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.width = '400px';
    dialogConfig.minWidth = '200px';
    dialogConfig.data = {title: theTitle, message: msg};
    dialogConfig.panelClass = 'warning-dialog';
    this.matDialog.open(OkDialogComponent,dialogConfig).afterClosed().subscribe(result => {
      onClosed?.(result);
    });
  }
}
