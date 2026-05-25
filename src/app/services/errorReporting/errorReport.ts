import { HttpErrorResponse } from '@angular/common/http';
export class ErrorReport {
    id?: number;
    createdDateTime?: Date;
    applicationId?: number;
    errorMessage?: string;
    errorType?: string | null;
    userId?: number;
    machineName?: string;
    ipAddress?: string;
}

class ImportDataResults {
    importedDataFile?: string;
    totalRows?: number=0;
    rowsInserted?: number=0;
    rowsDeleted?: number=0;
    rowsUpdated?: number=0;
    rowsNotImported?: number=0;
    warnings?: string[];
}

class ImportDataResponse {
    errorMessage?: string;
    hasError?: boolean;
    results?: ImportDataResults;
}

export class ErrorReportFactory {
    static newErrorReport(message: string, ex: any): ErrorReport {
        const errorReport = new ErrorReport();
        errorReport.errorMessage = `${message}\n ${ErrorReportFactory.getErrorMessageWithStackTrace(ex)}`;
        errorReport.errorType = null;
        errorReport.createdDateTime = new Date();
        errorReport.applicationId = 3;
        errorReport.userId = 0;

        return errorReport;
    }

    public static getErrorMessageWithStackTrace(ex: any): string {
        if (ex instanceof HttpErrorResponse) {
            // tslint:disable-next-line:max-line-length
            return `Error: ${JSON.stringify(ex.error)}\nMessage: ${ex.message}\nHttpStatusCode: ${ex.status}\nStatusText:\n${ex.statusText}`;
        }
        else if (ex instanceof ErrorEvent) {
            return `${ex.message}\nLineNum: ${ex.lineno}\nFileName: ${ex.filename}\nTarget: ${ex.target}\nType: ${ex.type}\nEventPhase: ${ex.eventPhase}`;
        }
        else if (ex instanceof Error) {
            return `StackTrace:\n ${ex.stack}`;
        }

        return '';
    }
}
