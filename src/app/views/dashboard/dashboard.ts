import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'; 
import { BaseComponent } from '../../base/base.component';
import { ErrorReportingService } from '../../services/errorReporting/error-reporting.service';
import { ConfigService } from '../../services/api.service';
import { DashboardRequest, ProviderPerformance } from '../../models/requests/dashboardRequest';
import { Title } from '@angular/platform-browser';
import { MatIcon } from "@angular/material/icon";
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs'; 
import { MatSelectChange, MatSelectModule } from '@angular/material/select'; 
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { UserDataService } from '../../services/user-data-service';
import { PhoneFormatPipe } from '../../pipes/phone-format.pipe';
import { MatProgressSpinner } from "@angular/material/progress-spinner"; 
import { BenefitsDialogService } from '../../services/benefits-dialog.service'; 
import { AddActionDialogService } from '../../services/add-action-dialog.service';
import { QualitygapDialogService } from '../../services/qualitygap-dialog.service';
import { RiskgapDialogService } from '../../services/riskgap-dialog.service';
import { CallListDialogService } from '../../services/calllist-dialog.service';
import { TaskListDialogService } from '../../services/tasklist-dialog.service'; 
import { NolongerPatientDialogService } from '../../services/nolonger-patience-dialog.service';
import { AlterPhoneDialogService } from '../../services/alternatephone-dialog.service';
import { AlterAddressDialogService } from '../../services/alteraddress-dialog.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { ActionHandlerService } from '../../services/action.service'; 
import { HeaderService } from '../../services/header.service'; 
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { take } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,MatMenuModule,
    MatButtonModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIcon, MatCheckboxModule, MatTabsModule, MatSelectModule, MatDividerModule, PhoneFormatPipe, CommonModule,
    MatProgressSpinner,
    MatTooltipModule,
    
],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard extends BaseComponent implements OnInit, AfterViewInit {
  


  displayedColumns: string[] = ['2', 'MEM_INFO', 'PHONE', 'PCP_TAX_ID', 'PCP_VISIT_FLAG', 'PRIORITY_FLAG', 'upcoming_task_date', 'Call_count', 'risk_gap_count', 'risk_comp_count', 'risk_perf', 'quality_count', 'quality_comp_count', 'quality_perf', '1'];
  displayedColumnsTransfer: string[] = [
    'medicaid_id',
    'memberName',
    'BIRTH',
    'phone',
    'address',
    'refer_by_name',
    'refer_to_name',
    'added_date',
    'referring_reason'
  ];
  displayedColumnsNolongerpatient: string[] = [
    'medicaid_id',
    'memberName',
    'BIRTH',
    'phone',
    'address', 
    'NO_LONGER_PATIENT_DATE','NO_LONGER_PATIENT_NOTE','1'
  ];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  transferdataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  nolongerpatientdataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @ViewChild('mainPaginator') mainPaginator!: MatPaginator;
  @ViewChild('mainSort') mainSort!: MatSort;

  @ViewChild('transferPaginator') transferPaginator!: MatPaginator;
  @ViewChild('transferSort') transferSort!: MatSort;

  @ViewChild('nolongerpatientPaginator') nolongerpatientPaginator!: MatPaginator;
  @ViewChild('nolongerpatientSort') nolongerpatientSort!: MatSort;

  transferlist: any[] = [];
  totalArray: any = {};
  loginUserId: number | null = null;
  loginRoleId: number | null = null;
  isLoading = false;
  isOpen = false;
  overallSummary: any = {};
  ownSummary: any = {};
  departmentList: any = {};
  recentActivity: any = {};
  referralList: any = {};
  planList: any = {}; 
  NoLongerPatientList: any = {};
  navigatorList: any[] = [];
  performanceArray: Record<string, ProviderPerformance>[] = [];
  providerTinNameMapping: Record<string, string> = {};
  vendorList: any[] = [];

  selection = new SelectionModel<any>(true, []); // true = multiple selection
  selectedAction: string | null = null; 
  selectedNavigatorId: number = 0;


  constructor(
    errorLogger: ErrorReportingService,
    matDialog: MatDialog,
    private readonly titleService: Title, private readonly apiService: ConfigService,private readonly userData: UserDataService,
    private readonly benefitsService: BenefitsDialogService,
    private readonly addActionService: AddActionDialogService,private readonly qualitygapsService:QualitygapDialogService,private readonly riskgapsService:RiskgapDialogService,
    private readonly callListService:CallListDialogService,private readonly taskListService:TaskListDialogService,
    private readonly noLongerPatientService:NolongerPatientDialogService,private readonly alternatePhoneListService:AlterPhoneDialogService,
    private readonly alternateAddressListService:AlterAddressDialogService,
    private readonly actionService:ActionHandlerService,
    private readonly headerService: HeaderService 

  ) {
    super(errorLogger, matDialog);

  }

  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('WCIP :: DASHBOARD');
    this.headerService.setTitle('DASHBOARD');

    await Promise.all([this.loadTableData(), this.loadVendors()]);
  }

  private async withLoader<T>(task: () => Promise<T>): Promise<T | undefined> {
  this.isLoading = true;
  try {
    return await task();
  } catch (err) {
    console.error(err);

    this.displayError('Something went wrong', 'Please try again');
    return undefined;
  } finally {
    this.isLoading = false;
  }
}
  

  /** Whether all rows are selected */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows;
  }

  async loadVendors(): Promise<void> {
    try {
      const result = await this.apiService.prismVendorMasterlist<any>('');
      this.vendorList = result.data || [];
      this.providerTinNameMapping = this.vendorList.reduce(
        (map: Record<string, string>, v: any) => {
          map[String(v.VENDOR_NUM)] = v.LAST_NAME;
          return map;
        },
        {}
      );
    } catch (err) {
      console.error('Failed to load vendors', err);
    }
  }

  /** Selects all rows if not all selected; otherwise clear selection */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.filteredData.forEach(row => this.selection.select(row));
    }
  }

  getSelectedRows(): any[] {
  return this.selection.selected;
  }

  /** Checkbox label (accessibility) */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.mainPaginator;
    this.dataSource.sort = this.mainSort;

     this.dataSource.filterPredicate = (data: any, filter: string) => {
      const practiceName =  this.providerTinNameMapping[data.PCP_TAX_ID]?.toLowerCase() || '';
      const searchText = filter.trim().toLowerCase();

      return (
        data.MEM_NO?.toLowerCase().includes(searchText) ||
        data.FIRST_NAME?.toLowerCase().includes(searchText) ||
        data.LAST_NAME?.toLowerCase().includes(searchText) ||
        data.BIRTH?.toLowerCase().includes(searchText) ||
        data.OTHER_PHONE?.toLowerCase().includes(searchText) ||
        data.OTHER_ADDR1?.toLowerCase().includes(searchText) ||
        data.upcoming_task_date?.toLowerCase().includes(searchText) || 
        practiceName.includes(searchText)   // ✅ PRACTICE NAME FILTER
      );
    };

    // TRANSFER TABLE
    this.transferdataSource.paginator = this.transferPaginator;
    this.transferdataSource.sort = this.transferSort;

    // NO LONGER PATIENT TABLE
    this.nolongerpatientdataSource.paginator = this.nolongerpatientPaginator;
    this.nolongerpatientdataSource.sort = this.nolongerpatientSort;

    this.dataSource.sortingDataAccessor = this.defaultSortingAccessor;
    this.transferdataSource.sortingDataAccessor = this.defaultSortingAccessor;
    this.nolongerpatientdataSource.sortingDataAccessor = this.defaultSortingAccessor;

    this.attachTableFeatures();
    this.attachTableFeaturestransfer();
    this.attachTableFeaturesnoLongerpatient();
  }

/** Load dashboard data from API */
async loadTableData(): Promise<void> {
  await this.withLoader(async () => {
    const user = this.userData.getUser();
    if (user.role_id === 7 || user.role_id === 21) {
      this.loginUserId = this.selectedNavigatorId;
    } else {
      this.loginUserId = user.ID;
    }
    this.loginRoleId = user.role_id;

    const request: DashboardRequest = { user_id: this.loginUserId };
    const result = await this.apiService.dashboard<any>(request);
    const members = result?.data || [];

    this.dataSource.data = members.map((m: any) => ({
      medicaid_id: m.medicaid_id,
      MEM_NO: m.MEM_NO,
      FIRST_NAME: m.FIRST_NAME,
      LAST_NAME: m.LAST_NAME,
      BIRTH: m.BIRTH,
      OTHER_ADDR1: m.OTHER_ADDR1,
      OTHER_PHONE: m.OTHER_PHONE,
      latest_alt_address: m.latest_alt_address,
      latest_alt_phone: m.latest_alt_phone,
      PCP_TAX_ID: m.PCP_TAX_ID,
      PCP_VISIT_DATE: m.PCP_VISIT_DATE,
      PCP_VISIT_FLAG: m.PCP_VISIT_FLAG,
      PCP_VISIT_PRE_DATE: m.PCP_VISIT_PRE_DATE,
      PCP_VISIT_PRE_FLAG: m.PCP_VISIT_PRE_FLAG,
      PRIORITY_FLAG: m.PRIORITY_FLAG,
      upcoming_task_date: m.upcoming_task_date || 'N/A',
      Call_count: m.Call_count,
      risk_gap_count: m.risk_gap_count,
      risk_comp_count: m.risk_comp_count,
      risk_perf: m.risk_perf,
      quality_count: m.quality_count,
      quality_comp_count: m.quality_comp_count,
      quality_perf: m.quality_perf
    }));

    this.selection.clear();
  });

  // Load overview stats in background — does not block the member table spinner
  this.loadprojectoverviewData();
}

showRiskgaps(row: any) { 
   this.withLoader(() => this.riskgapsService.showRiskgapDialog(row));
}

private defaultSortingAccessor(item: any, property: string) {
  if (property === 'MEM_INFO') {
    return item.medicaid_id;
  }
  return item[property];
}


showQualitygaps(row: any) {
  this.withLoader(() => this.qualitygapsService.showQualitygapDialog(row));
}

showBenefits(row: any) {
  this.withLoader(() => this.benefitsService.showBenefitsDialog(row));
}

showCallList(row: any) {
  this.withLoader(() => this.callListService.showcallListDialog(row));
}  

confirmAction(row: any) {
  this.withLoader(async () => {
    const result = await this.noLongerPatientService.confirmbox(row);

    if (result?.refresh) {
      const note = result.note;
      this.removeMemberFromTable(row.medicaid_id);
      // 2️⃣ add to no longer patient table

      
      this.nolongerpatientdataSource.data = [
      {
        medicaid_id: row.medicaid_id,
        FIRST_NAME: row.FIRST_NAME,
        LAST_NAME: row.LAST_NAME,
        memberName: row.FIRST_NAME+' '+row.LAST_NAME,
        BIRTH: row.BIRTH,     
        address: row.OTHER_ADDR1,
        phone: row.OTHER_PHONE,     
        NO_LONGER_PATIENT_NOTE: note ,  
        NO_LONGER_PATIENT_DATE: this.formatMDY(new Date())
      },
      ...this.nolongerpatientdataSource.data
    ];

    }
  });
}

confirmboxUndo(row: any) {

  this.withLoader(async () => {
    const result = await this.noLongerPatientService.confirmboxUndo(row);
    if (result?.refresh) {
      this.removeNolongerFromTable(row.medicaid_id);
      // 2️⃣ add to no longer patient table

      this.dataSource.data = [
      {
        medicaid_id: row.medicaid_id,
        MEM_NO: row.MEM_NO,
        FIRST_NAME: row.FIRST_NAME,
        LAST_NAME: row.LAST_NAME,
        BIRTH: row.BIRTH,
        OTHER_ADDR1: row.OTHER_ADDR1,
        OTHER_PHONE: row.OTHER_PHONE,
        latest_alt_address: row.latest_alt_address,
        latest_alt_phone: row.latest_alt_phone,
        PCP_TAX_ID: row.PCP_TAX_ID,
        PCP_VISIT_DATE: row.PCP_VISIT_DATE,
        PCP_VISIT_FLAG: row.PCP_VISIT_FLAG,
        PCP_VISIT_PRE_DATE: row.PCP_VISIT_PRE_DATE,
        PCP_VISIT_PRE_FLAG: row.PCP_VISIT_PRE_FLAG,
        PRIORITY_FLAG: row.PRIORITY_FLAG,
        upcoming_task_date: row.upcoming_task_date || 'N/A',
        Call_count: row.Call_count,
        risk_gap_count: row.risk_gap_count,
        risk_comp_count: row.risk_comp_count,
        risk_perf: row.risk_perf,
        quality_count: row.quality_count,
        quality_comp_count: row.quality_comp_count,
        quality_perf: row.quality_perf
      },
      ...this.dataSource.data
    ];

    }
  });
}


removeNolongerFromTable(medicaidId: number): void {
  const updatedData = this.nolongerpatientdataSource.data.filter(
    nolongerpatientlist => nolongerpatientlist.medicaid_id !== medicaidId
  );

  this.nolongerpatientdataSource.data = updatedData;
} 

formatMDY(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

removeMemberFromTable(medicaidId: number): void {
  const updatedData = this.dataSource.data.filter(
    member => member.medicaid_id !== medicaidId
  );

  this.dataSource.data = updatedData;
} 

async onActionChange(event: MatSelectChange) {
  if (!event.value) return;

  const selectedRows = this.getSelectedRows();
  if (!selectedRows.length) {
    alert('Please select at least one member');
    this.selectedAction = null;
    return;
  }

  await this.withLoader(async () => {
    const result = await this.actionService.handleAction(
      event.value,
      selectedRows,
      this.planList,
      this.departmentList
    );

    if (result?.refresh) {
      this.removeRowsFromTable(selectedRows);
    }
  });

  this.selectedAction = null;
  this.selection.clear();
}

removeRowsFromTable(rows: any[]) {
  const ids = new Set(rows.map(r => r.medicaid_id));
  this.dataSource.data = this.dataSource.data.filter(
    r => !ids.has(r.medicaid_id)
  );
}

addalterAddr(row: any) {
  this.withLoader(async () => {
    const dialogRef = await this.alternateAddressListService.showalterAddressListDialog(row);
    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result?.refresh) {
        this.syncMemberAltAddress(result.medicaid_id);
      }
    });
  });
}

addalternativePhone(row: any) {
  this.withLoader(async () => {
    const dialogRef = await this.alternatePhoneListService.showalterPhoneListDialog(row);
    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result?.refresh) {
        this.syncMemberAltPhone(result.medicaid_id);
      }
    });
  });
}

syncMemberAltAddress(medicaidId: number) {
  this.withLoader(async () => {
    const res = await this.apiService.alternateaddressList<any>({ medicaid_id: medicaidId });
    const addr = res?.data?.altaddress?.[0];
    if (!addr) return;

    this.updateRow(medicaidId, { latest_alt_address: addr.alt_address });
  });
}

syncMemberAltPhone(medicaidId: number) {
  this.withLoader(async () => {
    const res = await this.apiService.alternatephoneList<any>({ medicaid_id: medicaidId });
    const latest = res?.data?.prismMemberaltphone?.[0]?.alt_phone_no;
    if (!latest) return;

    this.updateRow(medicaidId, { latest_alt_phone: latest });
  });
}

private updateRow(medicaidId: number, changes: any) {
  const index = this.dataSource.data.findIndex(m => m.medicaid_id === medicaidId);
  if (index === -1) return;

  const updated = [...this.dataSource.data];
  updated[index] = { ...updated[index], ...changes };
  this.dataSource.data = updated;
}

showTasklist(row: any) {
  this.withLoader(async () => {
    const dialogRef = await this.taskListService.showtaskListDialog(row);
    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result?.refresh) {
        this.refreshMemberRow(result.medicaid_id);
      }
    });
  });
}   

  async refreshMemberRow(medicaid_id: string): Promise<void> {
    await this.withLoader(async () => {
      const res = await this.apiService.dashboard<any>({ user_id: this.loginUserId });
      const members = res.data || [];
      const updatedMember = members.find((m: any) => m.medicaid_id === medicaid_id);
      if (!updatedMember) return;

      const index = this.dataSource.data.findIndex(m => m.medicaid_id === medicaid_id);
      if (index !== -1) {
        const updated = [...this.dataSource.data];
        updated[index] = {
          ...updated[index],
          upcoming_task_date: updatedMember.upcoming_task_date,
          Call_count: updatedMember.Call_count,
          risk_gap_count: updatedMember.risk_gap_count,
          quality_count: updatedMember.quality_count
        };
        this.dataSource.data = updated;
      }
    });
  }


async openAddActionDialog(
  medicaid_id: string,
  member_name: string,
  member_db: string,
  addr: string,
  phone: string,
  practice: string,
  PCP_TAX_ID: number,
) {
  await this.withLoader(async () => {
    await this.addActionService.showAddActionDialog(
      medicaid_id, member_name, member_db, addr, phone, practice, PCP_TAX_ID
    );
    await this.loadTableData();
  });
}

copyToClipboard(text: string) {
  if (navigator?.clipboard?.writeText) {
    // Modern supported browser
    navigator.clipboard.writeText(text)
      .then(() => {})
      .catch(() => {
        this.fallbackCopy(text);
      });
  } else {
    // Fallback
    this.fallbackCopy(text);
  }
}

fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
} 

onNavigatorChange(navigatorId: number): void {

  this.selectedNavigatorId = navigatorId;
  this.loadTableData();
}

  async loadprojectoverviewData(): Promise<void> {
    const request: DashboardRequest = {
      user_id: this.loginUserId
    };

    try {
      const res = await this.apiService.poweroverview<any>(request);
 
      if (res.data) {

        this.overallSummary = res.data.overallRiskQualitySummary || [];
        this.ownSummary = res.data.ownRiskQualitySummary || [];
        this.navigatorList = res.data.navigatorList || []; 

        this.departmentList = res.data.departmentList || [];
        this.planList = res.data.planList || []; 
        this.calculatePerformance(res.data);
        this.loadTransfertabledata(res.data.referralList);
        this.loadNopatienttabledata(res.data.NoLongerPatientList);
      }

    } catch (error) {
      console.error('loadprojectoverviewData failed:', error);
    }

  }

  loadTransfertabledata(transferlist: any) {
    if (transferlist?.length > 0) {

      const transferDATA = transferlist.map((r: any, index: number) => ({
        medicaid_id: r.medicaid_id,
        memberName: r.memberName,
        BIRTH: r.BIRTH,
        phone: r.phone,
        address: r.address,
        added_date: r.added_date,
        refer_by_name: r.refer_by_name,
        refer_to_name: r.refer_to_name,
        referring_reason: r.referring_reason
      }));

      this.transferdataSource.data = transferDATA;
    }
  }

  loadNopatienttabledata(nolongerpatientlist: any) {
    if (nolongerpatientlist?.length > 0) {
      const nopatientDATA = nolongerpatientlist.map((r: any, index: number) => ({
        medicaid_id: r.medicaid_id,
        memberName: r.memberName,
        BIRTH: r.BIRTH,
        phone: r.phone,
        address: r.address,
        FIRST_NAME: r.FIRST_NAME,
        LAST_NAME: r.LAST_NAME,
        MEM_NO: r.MEM_NO,         
        OTHER_ADDR1: r.OTHER_ADDR1,
        OTHER_PHONE: r.OTHER_PHONE,
        latest_alt_address: r.latest_alt_address,
        latest_alt_phone: r.latest_alt_phone,
        PCP_TAX_ID: r.PCP_TAX_ID,
        PCP_VISIT_DATE: r.PCP_VISIT_DATE,
        PCP_VISIT_FLAG: r.PCP_VISIT_FLAG,
        PRIORITY_FLAG: r.PRIORITY_FLAG,
        NO_LONGER_PATIENT_DATE: r.NO_LONGER_PATIENT_DATE,
        NO_LONGER_PATIENT_NOTE: r.NO_LONGER_PATIENT_NOTE
      }));

      this.nolongerpatientdataSource.data = nopatientDATA;
    }
  }
  /** Attach paginator & sorting */
  attachTableFeatures(): void {
    if (this.mainPaginator) this.dataSource.paginator = this.mainPaginator;
    if (this.mainSort) this.dataSource.sort = this.mainSort;
  }

  attachTableFeaturestransfer(): void {
    if (this.transferPaginator) this.transferdataSource.paginator = this.transferPaginator;
    if (this.transferSort) this.transferdataSource.sort = this.transferSort;
  }

  attachTableFeaturesnoLongerpatient(): void {
    if (this.nolongerpatientPaginator) this.nolongerpatientdataSource.paginator = this.nolongerpatientPaginator;
    if (this.nolongerpatientSort) this.nolongerpatientdataSource.sort = this.nolongerpatientSort;
  }

  /** Trigger error popup */
  showErrorPopup(): void {
    this.displayError('ERROR MESSAGE DISPLAY', 'ERROR POPUP TEST');
  }

  /** Search filter */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value || '';
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyFiltertransfer(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value || '';
    this.transferdataSource.filter = filterValue.trim().toLowerCase();
  }

  applyFilternopatient(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value || '';
    this.nolongerpatientdataSource.filter = filterValue.trim().toLowerCase();
  }


  toggleDiv() {
    this.isOpen = !this.isOpen;
  }

  calculatePerformance(data: any) {
    const performanceList = data.priorityAndOtherPerformanceSummary || [];
    const performanceArray: Record<string, ProviderPerformance>[] = [];
    const totalArray: any = this.initializeTotals();



    for (const item of performanceList) {
      const pcpId = String(item['PCP_TAX_ID']);
      const values: any = { ...item };
      delete values['PCP_TAX_ID'];

      const num = (v: any) => Number.parseFloat(v || 0);

      // ---------- PRIORITY CALL ----------
      const priority_count = num(values.priority_count);
      const call_count = num(values.call_count);
      totalArray.total_priority_count += priority_count;
      totalArray.total_call_count += call_count;

      values.priority_percentage = this.percent(call_count, priority_count);
      values.priority_color = this.getColor(values.priority_percentage);

      // ---------- OTHER CALL ----------
      const other_call_count = num(values.other_call_count);
      const other_count = num(values.other_count);
      totalArray.total_other_call_count += other_call_count;
      totalArray.total_other_count += other_count;

      values.other_call_percentage = this.percent(other_call_count, other_count);
      values.other_call_color = this.getColor(values.other_call_percentage);

      // ---------- RISK GAPS ----------
      const priority_complete_gaps_count = num(values.priority_complete_gaps_count);
      const priority_gaps_count = num(values.priority_gaps_count);
      totalArray.total_priority_complete_gaps_count += priority_complete_gaps_count;
      totalArray.total_priority_gaps_count += priority_gaps_count;

      values.priority_gaps_percentage = this.percent(priority_complete_gaps_count, priority_gaps_count);
      values.priority_gaps_color = this.getColor(values.priority_gaps_percentage);

      const other_gaps_count = num(values.other_gaps_count);
      const other_complete_gaps_count = num(values.other_complete_gaps_count);
      totalArray.total_other_gaps_count += other_gaps_count;
      totalArray.total_other_complete_gaps_count += other_complete_gaps_count;

      values.other_gaps_percentage = this.percent(other_complete_gaps_count, other_gaps_count);
      values.other_gaps_color = this.getColor(values.other_gaps_percentage);

      // ---------- QUALITY GAPS ----------
      const priority_complete_quality_gaps_count = num(values.priority_complete_quality_gaps_count);
      const priority_quality_gaps_count = num(values.priority_quality_gaps_count);
      totalArray.total_priority_complete_quality_gaps_count += priority_complete_quality_gaps_count;
      totalArray.total_priority_quality_gaps_count += priority_quality_gaps_count;

      values.priority_quality_gaps_percentage = this.percent(priority_complete_quality_gaps_count, priority_quality_gaps_count);
      values.priority_quality_gaps_color = this.getColor(values.priority_quality_gaps_percentage);

      const other_quality_gaps_count = num(values.other_quality_gaps_count);
      const other_complete_quality_gaps_count = num(values.other_complete_quality_gaps_count);
      totalArray.total_other_quality_gaps_count += other_quality_gaps_count;
      totalArray.total_other_complete_quality_gaps_count += other_complete_quality_gaps_count;

      values.other_quality_gaps_percentage = this.percent(other_complete_quality_gaps_count, other_quality_gaps_count);
      values.other_quality_gaps_color = this.getColor(values.other_quality_gaps_percentage);

      // ---------- PCP VISITS ----------
      const priority_pcp_visit_count = num(values.priority_pcp_visit_count);
      const other_pcp_visit_count = num(values.other_pcp_visit_count);
      totalArray.total_priority_count_pcp += priority_pcp_visit_count;
      totalArray.total_other_count_pcp += other_pcp_visit_count;


      values.priority_pcp_visit_percentage = this.percent(priority_pcp_visit_count, priority_count);
      values.priority_pcp_visit_color = this.getColor(values.priority_pcp_visit_percentage);

      values.other_pcp_visit_percentage = this.percent(other_pcp_visit_count, other_count);
      values.other_pcp_visit_color = this.getColor(values.other_pcp_visit_percentage);

      // ---------- PROVIDER NAME ----------
      values.provider_name = this.providerTinNameMapping[pcpId] || '';

      performanceArray.push({ [pcpId]: values });
    }

    // ---------- TOTAL PERCENTAGES ----------
    totalArray.priority_call_percentage = this.percent(totalArray.total_call_count, totalArray.total_priority_count);
    totalArray.other_call_percentage = this.percent(totalArray.total_other_call_count, totalArray.total_other_count);

    totalArray.priority_gaps_percentage = this.percent(totalArray.total_priority_complete_gaps_count, totalArray.total_priority_gaps_count);
    totalArray.other_gaps_percentage = this.percent(totalArray.total_other_complete_gaps_count, totalArray.total_other_gaps_count);

    totalArray.priority_quality_gaps_percentage = this.percent(totalArray.total_priority_complete_quality_gaps_count, totalArray.total_priority_quality_gaps_count);
    totalArray.other_quality_gaps_percentage = this.percent(totalArray.total_other_complete_quality_gaps_count, totalArray.total_other_quality_gaps_count);

    totalArray.priority_pcp_percentage = this.percent(totalArray.total_priority_count_pcp, totalArray.total_priority_count);
    totalArray.other_pcp_percentage = this.percent(totalArray.total_other_count_pcp, totalArray.total_other_count);

    // ---------- TOTAL COLORS ----------
    totalArray.priority_call_color = this.getColor(totalArray.priority_call_percentage);
    totalArray.other_call_color = this.getColor(totalArray.other_call_percentage);
    totalArray.priority_gaps_color = this.getColor(totalArray.priority_gaps_percentage);
    totalArray.other_gaps_color = this.getColor(totalArray.other_gaps_percentage);
    totalArray.priority_quality_gaps_color = this.getColor(totalArray.priority_quality_gaps_percentage);
    totalArray.other_quality_gaps_color = this.getColor(totalArray.other_quality_gaps_percentage);
    totalArray.priority_pcp_color = this.getColor(totalArray.priority_pcp_percentage);
    totalArray.other_pcp_color = this.getColor(totalArray.other_pcp_percentage);

    // ---------- SAVE FINAL ----------
    this.performanceArray = performanceArray;
    this.totalArray = totalArray;

    //console.log('✅ Provider performance summary:', this.performanceArray);

  }


  initializeTotals() {
    return {
      total_priority_count: 0,
      total_call_count: 0,
      total_other_call_count: 0,
      total_other_count: 0,
      total_priority_complete_gaps_count: 0,
      total_priority_gaps_count: 0,
      total_other_gaps_count: 0,
      total_other_complete_gaps_count: 0,
      total_priority_complete_quality_gaps_count: 0,
      total_priority_quality_gaps_count: 0,
      total_other_quality_gaps_count: 0,
      total_other_complete_quality_gaps_count: 0,
      total_priority_count_pcp: 0,
      total_other_count_pcp: 0
    };
  }

  percent(a: number, b: number): number {
    return b > 0 ? +(a / b * 100).toFixed(2) : 0;
  }

  getColor(percent: number): string {
    if (percent < 60) return 'red';
    if (percent < 80) return '#FFAE42';
    return 'green';
  }
}
