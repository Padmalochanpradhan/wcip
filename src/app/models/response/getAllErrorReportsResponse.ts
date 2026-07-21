import { ErrorReport } from "../../services/errorReporting/errorReport";


export interface GetAllErrorReportsResponse {
    errors: ErrorReport[];
    totalErrors: number;
}
