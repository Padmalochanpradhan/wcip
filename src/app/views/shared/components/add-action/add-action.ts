import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { ConfigService } from '../../../../services/api.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, Inject, OnInit, AfterViewInit, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { PROVIDER_TIN_MAP } from '../../../../constants/constant';
import { UserIdRequest, MedicaidIdRequest } from '../../../../models/requests/commonRequest';
import { UserDataService } from '../../../../services/user-data-service';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { LogRequest } from '../../../../models/requests/addActionMasterRequest';
import { PhoneFormatPipe } from "../../../../pipes/phone-format.pipe";
import { MatCard } from "@angular/material/card";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'app-add-action',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatTabsModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatSortModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTableModule,
    MatExpansionModule,
    MatCheckboxModule,
    CommonModule,
    MatProgressSpinner,
    MatIconModule,
    PhoneFormatPipe,
    MatCard
  ],
  providers: [
    provideNativeDateAdapter() ,DatePipe  // <-- REQUIRED FIX
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-action.html',
  styleUrl: './add-action.css',
})
export class AddAction implements OnInit , AfterViewInit {
  addActionFormGroup!: FormGroup;
  pcpVisitFormGroup!: FormGroup;
  measureForm!: FormGroup;
  appointmentFormGroup!: FormGroup;
  action_activity_category: any[] = [];
  action_ativity_type: any[] = [];
  navigatorList: any[] = [];
  appointmentList: any[] = [];
  starperformanceList: any[] = [];
  availableTins: { VENDOR_NUM: string; LAST_NAME: string }[] = [];
  measureList: any[] = [];
  providerList: any[] = [];
  appointTypeList: any[] = [];
  
  vendorLocationList: any[] = [];
  actionresult_followup_list: any[] = [];
  memberTaskList: any[] = [];
  memberGapList: any[] = [];
  memberQualityList: any[] = [];
  isLoading = false;
  memberPCPVisitList: any[] = [];
  pcpType: any[] = [];
  vendorList: any[] = [];
  PCPVisitDisplayedColumns: string[] = [
    'visit_date',
    'visit_type',
    'message',
    'added_user_name',
    'added_date'
  ];
  cptList: any[] = [];              // full list from API
  
  filteredCptOptions: Observable<any[]>[] = [];
  hspcsList: any[] = [];
  filteredhspcsOptions: Observable<any[]>[] = []; 
  icdList: any[] = [];
  filteredicdOptions: Observable<any[]>[] = [];
  suppSourceList = [
  { value: 'E', label: 'EHR Standard Supplemental' },
  { value: 'M', label: 'EHR Non-Standard Supplemental' },
  { value: 'R', label: 'Registry/HIE Standard Supplemental' },
  { value: 'H', label: 'Registry/HIE Non-Standard Supplemental' },
  { value: 'C', label: 'Case Management Standard Supplemental' },
  { value: 'P', label: 'Case Management Non-Standard Supplemental' }
];
  providerTypes = [
  { value: 'AMB', label: 'Ambulance' },
  { value: 'ANE', label: 'Anesthesiologist' },
  { value: 'CARD', label: 'Cardiologist' },
  { value: 'CD', label: 'Chemical Dependency Provider' },
  { value: 'COHO', label: 'Contracted Hospital' },
  { value: 'DME', label: 'Durable Medical Equipment' },
  { value: 'DN', label: 'Dental Provider' },
  { value: 'ENDO', label: 'Endocrinologist' },
  { value: 'FAC', label: 'Facility' },
  { value: 'GAST', label: 'Gastroenterologist' },
  { value: 'GYN', label: 'Gynecologist' },
  { value: 'HH', label: 'Home Health' },
  { value: 'INFD', label: 'Infectious Disease Specialist' },
  { value: 'LAB', label: 'Laboratory' },
  { value: 'MHN', label: 'Mental Health Provider (No Prescribing)' },
  { value: 'MHP', label: 'Mental Health Provider (With Prescribing)' },
  { value: 'NEPH', label: 'Nephrology' },
  { value: 'NPCP', label: 'Non-Physician Primary Care' },
  { value: 'OB', label: 'Obstetrician' },
  { value: 'OTHR', label: 'Other' },
  { value: 'PCP', label: 'Primary Care Provider' },
  { value: 'PNC', label: 'Prenatal Care Provider' },
  { value: 'RAD', label: 'Radiology' },
  { value: 'RN', label: 'Registered Nurse' },
  { value: 'RPH', label: 'Clinical Pharmacist' },
  { value: 'UC', label: 'Urgent Care Provider' },
  { value: 'VC', label: 'Vision Care Provider' },
  { value: 'PA', label: 'Physician Assistant' }
];
  
  pcpVisitDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  @ViewChild('mainPaginator') mainPaginator!: MatPaginator;
  @ViewChild('mainSort') mainSort!: MatSort;
  @ViewChild('actionDateInput') actionDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('nextActionDateInput') nextActionDateInput!: ElementRef<HTMLInputElement>;
  isInitializing = signal(true);
  showPcpVisitForm = signal(false);
  showPcpHistory = signal(false);
  isSavingPcpVisit = signal(false);
  pcpSuccessMessage = signal('');
  successMessage = signal('');
  appSuccessMessage = signal('');
  isLoadingPcpHistory = signal(false);
  isLoadingappHistory = signal(false);
  filteredHspcsList: any[] = [];
  cihpcrList: any[] = [];
  activityList: any[] = [];
  providers: any[] = [];
  providerLists: any[][] = [];

  showActivityTable: boolean = false;
  pcrColumns: string[] = [
    'DISCHARGE_CC_DESC_1',
    'DISCHARGE_CC_DESC_2',
    'DISCHARGE_CC_DESC_3',
    'DISCH_ORDER',
    'INDEX_ADMIT_DT',
    'INDEX_DISCH_DT',
    'INDEX_STAY',
    'NUMER',
    'READMISSION',
    'READMT_ADMIT_DT',
    'READMT_DISCH_DT'
  ];

   activityColumns: string[] = [
    'Panel_Name',
    'action_type',
    'action_result',
    'action_date',
    'action_status',
    'action_note',
    'username'
  ]; 

  currentYear: number = new Date().getFullYear();
  previousYear: number = this.currentYear - 1;

  riskTabarray = [
    { label: '--', value: '' },
    { label: this.previousYear, value: this.previousYear },
    { label: this.currentYear, value: this.currentYear }
  ];


  taskColumns: string[] = ['action_type', 'action_date', 'status', 'initial', 'action_note'];
  isProcessing: boolean = false;
  tinLoading: boolean[] = [];
  
  userId: string | null = null;
  showContent = false;

  medicaid_id: string | null = null;
  member_name: string | null = null;
  member_dob: string | null = null;
  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  addActionChangeFlag = 0;


  constructor(
    private readonly apiService: ConfigService,
    private readonly cdr: ChangeDetectorRef,
    private readonly userData: UserDataService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly dialogRef: MatDialogRef<AddAction>,
    private readonly fb: FormBuilder,private readonly datePipe: DatePipe
  ) {

    this.addActionFormGroup = this.fb.group({
      // CURRENT ACTIVITY
      action_id: [18],
      panel_id: [17],
      action_date: [new Date()],
      action_status: ['Success'],
      action_result_id: [''],
      action_note: [''],

      // NEXT ACTIVITY
      next_panel_id: [''],
      next_action_date: [''],
      next_action_note: [''],

      //Member level
      update_action_id: [null],
      medicaid_id: [''],
      action_type_source: ['Member Action'],

      LOINC: [''],
      LOINCAnswer: [''],
      // RISK GAPS
      riskGapsList: this.fb.array([]),
      qualityGapsList: this.fb.array([])
    });
    this.appointmentFormGroup = this.fb.group({
      vendor_id: [null, Validators.required],
      provider_id: [{ value: null, disabled: true }, Validators.required],
      appointment_date: [new Date(), Validators.required],
      appointment_time: ['', Validators.required],
      action_status: ['Scheduled', Validators.required],
      place_of_appointment: [{ value: null, disabled: true }, Validators.required],
      appointment_type: [1, Validators.required],
      appointment_note: ['']
    });

    this.pcpVisitFormGroup = this.fb.group({
      pcp_visit_date: [null, Validators.required],
      visit_type: [null, Validators.required],
      pcp_visit_message: ['']
    });


    this.measureForm = this.fb.group({
      MEASURE: ['', Validators.required],
      MEASURE_DATE: ['', Validators.required],
      NUM_COUNT: ['', Validators.required],
      PCP_TAX_ID: ['', Validators.required]
    });
    
    this.medicaid_id = data?.medicaid_id;
    this.member_name = data?.member_name;
    this.member_dob = data?.member_dob;
    this.measureForm.patchValue({
      PCP_TAX_ID: data.PCP_TAX_ID,
      MEASURE_DATE: new Date(),
      NUM_COUNT: 1
    });
    if (this.medicaid_id) {
      this.addActionFormGroup.patchValue({
        medicaid_id: this.medicaid_id
      });
      
    }

  }

  async ngOnInit(): Promise<void> {
    const user = this.userData.getUser();
    this.userId = user.ID;

    try {
      const [resTin, result] = await Promise.all([
        this.apiService.getVendorListByplan<any>({ plan: 'AHC' }),
        this.apiService.addActionMaster<any>({ medicaid_id: this.medicaid_id })
      ]);

      this.availableTins = resTin.data || [];
      this.action_activity_category = result.data.actionActivityCategory || [];
      this.action_ativity_type = result.data.actionActivityType || [];
      this.navigatorList = result.data.navigatorList || [];
      this.starperformanceList = result.data.starperformanceList || [];
      this.measureList = result.data.measureList || [];
      this.pcpType = result.data.pcpType || [];
      this.vendorList = result.data.vendorList || [];
      this.appointTypeList = result.data.appointTypeList || [];
      this.hspcsList = result.data.hspcsList || [];
      this.cptList = result.data.cptList || [];
      this.icdList = result.data.icdList || [];

      if (this.medicaid_id) {
        await Promise.all([
          this.getMemberTaskList(this.medicaid_id),
          this.getMemberGapsList(this.medicaid_id)
        ]);
      }

      this.appointmentHistory();
      this.setScheduledActionStatus('17');
      this.setPCPVisitHistory();

    } catch (err) {
      console.error('Failed to initialize add-action dialog', err);
    } finally {
      this.isInitializing.set(false);
    }

    this.cdr.detectChanges();
    if (user.role_id === 9) {
      this.addActionFormGroup.get('panel_id')?.setValue(18);
    }

    this.appointmentFormGroup
      .get('appointment_time')
      ?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.cdr.detectChanges(); });

    this.addActionFormGroup.get('LOINC')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        if (!val || !val.trim()) {
          this.addActionFormGroup.get('LOINCAnswer')?.reset();
        }
      });
  }

  async onTinChange(tin: any, index: number, providerId?: string) {
    try {
      this.tinLoading[index] = true;

      const row = this.qualityGapsList.at(index);

      // ❗ ONLY reset if NOT edit mode
      if (!providerId) {
        row.get('provider_id')?.setValue('');
      }

      if (!tin) {
        this.providerLists[index] = [];
        return;
      }

      const payload = { tin };

      const result = await this.apiService.getProviderListByTin<any>(payload);

      this.providerLists[index] = result.data || [];
      //console.log('providerLists:',result);
      // ✅ IMPORTANT FIX → delay patching until UI is ready
      if (providerId && this.providerLists[index].length) {

        const match = this.providerLists[index].find(
          (p: any) => String(p.Provider_ID) === String(providerId)
        );

        if (match) {
          setTimeout(() => {
            row.get('provider_id')?.setValue(match.Provider_ID);
            this.cdr.detectChanges(); // 🔥 force UI update
          }, 0);
        }
      }

    } catch (error) {
      console.error('Error fetching provider list:', error);
      this.providerLists[index] = [];
    } finally {
      this.tinLoading[index] = false;
      this.cdr.detectChanges();
    }
  }

 

  toggleActivity() {
    this.showActivityTable = !this.showActivityTable;
  }    

  ngAfterViewInit() {
    this.pcpVisitDataSource.paginator = this.mainPaginator;
    this.pcpVisitDataSource.sort = this.mainSort;
  }
  get riskGapsList(): FormArray {
    return this.addActionFormGroup.get('riskGapsList') as FormArray;
  }
  get qualityGapsList(): FormArray {
    return this.addActionFormGroup.get('qualityGapsList') as FormArray;
  }
  async setScheduledActionStatus(id: string) {
    const user = this.userData.getUser();

    const role_id = user.role_id;
    const payload = { scheduled_type: id, role_id: role_id };
    const result = await this.apiService.getActionresultfollowup<any>(payload);

    this.actionresult_followup_list = result.data;
  }



  async onVendorChange(vendorId: string) {
    //alert('Vendor changed: ' + vendorId); // Debug alert
    if (!vendorId) return;

    // 🔄 Reset dependent fields
    this.providerList = [];
    this.vendorLocationList = [];

    this.appointmentFormGroup.get('provider_id')?.reset();
    this.appointmentFormGroup.get('place_of_appointment')?.reset();

    this.appointmentFormGroup.get('provider_id')?.disable();
    this.appointmentFormGroup.get('place_of_appointment')?.disable();

    try {
      const result = await this.apiService.getProviderList<any>({
        vendor_id: vendorId
      });

      this.providerList = result.data.providerList || [];
      this.vendorLocationList = result.data.vendorLocationList || [];

      // ✅ Enable once data arrives
      if (this.providerList.length) {
        this.appointmentFormGroup.get('provider_id')?.enable();
      }
      if (this.vendorLocationList.length) {
        this.appointmentFormGroup.get('place_of_appointment')?.enable();
      }

      this.cdr.detectChanges(); // OnPush

    } catch (error) {
      console.error('Vendor change failed', error);
    }
  }

  trackByValue(i: number, y: any) {
    return y.value + i; // guaranteed unique
  }

  async addAppointment() {
    if (this.appointmentFormGroup.invalid) {
      this.appointmentFormGroup.markAllAsTouched();
      return;
    }

    const formValue = this.appointmentFormGroup.getRawValue();

    try {

      await this.insertappiontment(formValue);
      await this.applogSuccess();
      await this.appointmentHistory();

      this.appSuccessMessage.set('Appointment added successfully');
      this.appointmentFormGroup.reset();

      // 🔒 Disable dependent fields again
      this.appointmentFormGroup.get('provider_id')?.disable();
      this.appointmentFormGroup.get('place_of_appointment')?.disable();

      setTimeout(() => this.appSuccessMessage.set(''), 3000);

    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  }

  private async insertappiontment(form: any): Promise<void> {
    const payload = {
      table_name: 'MEM_SCHEDULE_APPOINTMENT_ACTION',
      insertDataArray: [{
        medicaid_id: this.medicaid_id,
        action_date: this.datePipe.transform(form.appointment_date, 'yyyy-MM-dd'),
        action_time: form.appointment_time,
        status: form.action_status,
        appiontment_type: form.appointment_type,
        vendor_id: form.vendor_id,
        provider_id: form.provider_id,
        note: form.appointment_note,
        place_of_appointment: form.place_of_appointment,
        added_by: this.userId
      }]
    };

    await this.apiService.insert(payload);
  }



  async savePcpVisit() {
    if (this.pcpVisitFormGroup.invalid || this.isSavingPcpVisit()) {
      return;
    }

    this.isSavingPcpVisit.set(true);

    const form = this.pcpVisitFormGroup.value;

    const insert_data = {
      MEDICAID_ID: this.medicaid_id,
      VISIT_DATE: this.datePipe.transform(form.pcp_visit_date, 'yyyy-MM-dd'),
      MESSAGE: form.pcp_visit_message,
      VISIT_TYPE: form.visit_type,
      ADDED_BY: this.userId
    };

    try {
      await this.apiService.multipleRowInsert({
        table_name: 'MEM_MEMBER_PCP_VISIT',
        insertDataArray: [insert_data]
      });

      await this.addTaskLog('ADD PCP VISIT', form.pcp_visit_message);

      this.pcpSuccessMessage.set('PCP visit saved successfully');

      this.pcpVisitFormGroup.reset();
      await this.setPCPVisitHistory();

      setTimeout(() => this.pcpSuccessMessage.set(''), 3000);

    } catch (error) {
      console.error('Error saving PCP visit:', error);
    } finally {
      this.isSavingPcpVisit.set(false);
    }
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.pcpVisitDataSource.filter = filterValue.trim().toLowerCase();

    // 🔥 REQUIRED for paginator count update
    if (this.pcpVisitDataSource.paginator) {
      this.pcpVisitDataSource.paginator.firstPage();
      this.cdr.detectChanges();
    }
  }


  async setPCPVisitHistory() {
    if (!this.medicaid_id) return;

    this.isLoadingPcpHistory.set(true);
    try {
      const result = await this.apiService.getMemberVisitList<any>({
        medicaid_id: this.medicaid_id
      });
      const data = result.data ?? [];
      this.pcpVisitDataSource.data = data;
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoadingPcpHistory.set(false);
      this.cdr.detectChanges();
    }
  }

  async appointmentHistory() {
    if (!this.medicaid_id) return;

    this.isLoadingappHistory.set(true);
    try {
      const result = await this.apiService.getAppointmentList<any>({
        medicaid_id: this.medicaid_id
      });
      this.appointmentList = result.data ?? [];

    } catch (error) {
      console.error(error);
    } finally {
      this.isLoadingappHistory.set(false);
      this.cdr.detectChanges();
    }
  }




  createRiskGapForm(gap: any): FormGroup {
    return this.fb.group({
      PROCESS_STATUS: [false],
      DIAG_DESC: [gap.DIAG_DESC],
      PLAN_YEAR: [this.extractYear(gap.PLAN_YEAR)],
      RISKGAP_ID: [gap.ID],
      DIAG_CODE: [gap.DIAG_CODE],
      risk_gap_id: [gap.risk_gap_id],
      PLANYEAR: [this.extractYear(gap.PLAN_YEAR)],
      Observation_Date: [gap.Observation_Date],
      Observation_Code: [gap.Observation_Code],
      CPT_Code_Modifier: [gap.CPT_Code_Modifier],
      Observation_Code_Set: [gap.Observation_Code_Set],
      Observation_Result: [gap.Observation_Result],

      Service_Provider_NPI: [gap.Service_Provider_NPI],
      Service_Provider_Taxonomy_Code: [gap.Service_Provider_Taxonomy_Code],
      Service_Provider_Name: [gap.Service_Provider_Name],
      Service_Provider_Type: [gap.Service_Provider_Type],
      Service_Provider_RxProviderFlag: [gap.Service_Provider_RxProviderFlag],

      Provider_Group_NPI: [gap.Provider_Group_NPI],
      Provider_Group_Taxonomy_Code: [gap.Provider_Group_Taxonomy_Code],
      Provider_Group_Name: [gap.Provider_Group_Name],

      note: [gap.note]
    });
  }

  allowOnlyDateChars(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'
    ];

    // allow navigation & control keys
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // allow digits and '/'
    const regex = /^[0-9/]$/;

    if (!regex.test(event.key)) {
      event.preventDefault(); // ❌ block other characters
    }
  }

  allowAlphaNumeric(event: KeyboardEvent) {
  const charCode = event.key;
  if (!/^[a-zA-Z0-9]$/.test(charCode)) {
    event.preventDefault();
  }
}


  async add_update_action_submit() { 

    const formValues = this.addActionFormGroup.getRawValue();
    const action_id = formValues.update_action_id;

    //console.log('Form Values on Submit:', formValues);     

    this.isProcessing = true; // 🔹 show loader
    this.addActionChangeFlag = 1; 
    // 🔹 Validate action_date is a valid date
    if (!formValues.action_date || Number.isNaN(new Date(formValues.action_date).getTime())) {
      alert('Please select a valid Action Date');
      this.isProcessing = false;

      setTimeout(() => {
        this.actionDateInput.nativeElement.focus();
      }, 0);
      return;  
    } 

    if (!action_id) {
      const insert_data = {
        medicaid_id: formValues.medicaid_id,
        action_type_source: formValues.action_type_source,
        action_id: formValues.action_id,
        panel_id: formValues.panel_id,
        action_date: this.datePipe.transform(formValues.action_date, 'yyyy-MM-dd'),
        action_status: formValues.action_status,
        add_by: this.userId || '', // if you store user info in authService/session
        action_note: formValues.action_note,
        action_result_id: formValues.action_result_id,
      };

      const apiPayload = {
        table_name: 'MEM_MEMBER_ACTION_FOLLOW_UP',
        insertDataArray: [insert_data],
      };
      let insertedActionId = 0;
      try {
        if (formValues.action_result_id) {
          const result = await this.apiService.multipleRowInsert<any>(apiPayload);
          insertedActionId = result.insertedIds;
        }

        const next_panel_id = formValues.next_panel_id;

        if (next_panel_id) {
          const taskPayload = {
            table_name: 'MEM_TASK_FOLLOW_UP',
            insertDataArray: [
              {
                medicaid_id: formValues.medicaid_id,
                action_id: next_panel_id,
                action_date: this.datePipe.transform(formValues.next_action_date, 'yyyy-MM-dd'),
                action_note: formValues.next_action_note,
                status: 'Open',
                assign_to: this.userId,
                add_by: this.userId,
              },
            ],
          };
          await this.apiService.multipleRowInsert<any>(taskPayload);
        }

        const isValid = await this.updateQualityAndRiskData(formValues, insertedActionId);
        if (!isValid) return;

        this.getMemberTaskList(formValues.medicaid_id);
        this.getMemberGapsList(formValues.medicaid_id);
        this.resetActionFields();
        this.cdr.detectChanges();

      } catch (error) {
        console.error('Submit failed:', error);
      } finally {
        this.isProcessing = false;
      }

    } else {
      // === UPDATE MODE ===
      const updateData = {
        action_type_source: formValues.action_type_source,
        action_id: formValues.action_id,
        panel_id: formValues.panel_id,
        action_date: this.datePipe.transform(formValues.action_date, 'yyyy-MM-dd'),
        action_status: formValues.action_status,
        action_note: formValues.action_note,
        action_result_id: formValues.action_result_id,
      };

      try {
        await this.apiService.multipleRowAndFieldUpdate<any>({
          table_name: 'MEM_MEMBER_ACTION_FOLLOW_UP',
          id_field_name: 'id',
          updates: [{ ...updateData, id: action_id }]
        });

        const isValid = await this.updateQualityAndRiskData(formValues, action_id);
        if (!isValid) return;

        this.getMemberTaskList(formValues.medicaid_id);
        this.getMemberGapsList(formValues.medicaid_id);
        this.resetActionFields();
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Update failed:', error);
      } finally {
        this.isProcessing = false;
      }
    }
  }
resetActionFields() {
  this.addActionFormGroup.patchValue({
    action_result_id: '',
    action_note: '',
    next_panel_id: '',
    next_action_note: '',
    next_action_date: ''
  });

  // reset validation state
  ['action_result_id', 'action_note', 'next_panel_id', 'next_action_note', 'next_action_date']
    .forEach(field => {
      const control = this.addActionFormGroup.get(field);
      control?.markAsPristine();
      control?.markAsUntouched();
      control?.updateValueAndValidity();
    });
}
 
private async updateQualityAndRiskData(
  formValues: any,
  action_id: number
): Promise<boolean> {

  const medicaid_id = formValues.medicaid_id;

  const diagCodes: string[] = [];
  const qualitySubMeasures: string[] = [];
  const riskObsInsertArray: any[] = [];
  const qualityObsInsertArray: any[] = [];
  const riskObsUpdateArray: any[] = [];
  const UpdateArray: any[] = [];

  let isValid = true; // ✅ validation flag

  /* ----------------------------------
     BUILD RISK GAP DATA
  -----------------------------------*/
  (this.riskGapsList.controls as FormGroup[]).forEach((fg) => {

    const riskGap = fg.getRawValue();

    const processStatus = riskGap.PROCESS_STATUS;

    UpdateArray.push({
      medicaid_id: medicaid_id,
      PLANYEAR: riskGap.PLANYEAR,
      PLAN_YEAR: riskGap.PLAN_YEAR,
      DIAG_CODE: riskGap.DIAG_CODE,
    });

    if ((processStatus === true || processStatus === '1') && riskGap.DIAG_CODE) {
      diagCodes.push(riskGap.DIAG_CODE);
    }

    const commonData = {
      medicaid_id,
      Type: riskGap.Type,
      Gap_Code: riskGap.DIAG_CODE,
      Observation_Date: this.datePipe.transform(riskGap.Observation_Date, 'yyyy-MM-dd'),
      Observation_Year: riskGap.Observation_Date
        ? new Date(riskGap.Observation_Date).getFullYear()
        : null,
      Observation_Code: riskGap.Observation_Code,
      CPT_Code_Modifier: riskGap.CPT_Code_Modifier,
      Observation_Code_Set: riskGap.Observation_Code_Set,
      Observation_Result: riskGap.Observation_Result,
      Service_Provider_NPI: riskGap.Service_Provider_NPI,
      Service_Provider_Taxonomy_Code: riskGap.Service_Provider_Taxonomy_Code,
      Service_Provider_Name: riskGap.Service_Provider_Name,
      Service_Provider_Type: riskGap.Service_Provider_Type,
      Service_Provider_RxProviderFlag: riskGap.Service_Provider_RxProviderFlag,
      Provider_Group_NPI: riskGap.Provider_Group_NPI,
      Provider_Group_Taxonomy_Code: riskGap.Provider_Group_Taxonomy_Code,
      Provider_Group_Name: riskGap.Provider_Group_Name,
      Source: 'CIH',
      note: riskGap.note
    };

    // ✅ UPDATE only if dirty
    if (riskGap.risk_gap_id) {
      if (fg.dirty) {
        riskObsUpdateArray.push({
          ...commonData,
          id: riskGap.risk_gap_id,
          updated_date: new Date()
        });
      }
    } else {
      const hasAnyValue = [
          riskGap.Observation_Date,
          riskGap.Observation_Code,
          riskGap.CPT_Code_Modifier,
          riskGap.Observation_Code_Set,
          riskGap.Observation_Result,
          riskGap.Service_Provider_NPI,
          riskGap.Service_Provider_Taxonomy_Code,
          riskGap.Service_Provider_Name,
          riskGap.Service_Provider_Type,
          riskGap.Service_Provider_RxProviderFlag,
          riskGap.Provider_Group_NPI,
          riskGap.Provider_Group_Taxonomy_Code,
          riskGap.Provider_Group_Name,
          riskGap.note
      ].some(v => v !== null && v !== undefined && v !== "");

      if (hasAnyValue) {
        riskObsInsertArray.push({
          ...commonData,
          added_by: this.userId,
          added_date: new Date()
        });
      }
    }
  });

  /* ----------------------------------
     BUILD QUALITY GAP DATA
  -----------------------------------*/
  (this.qualityGapsList.controls as FormGroup[]).forEach((fg) => {

    const qualityGap = fg.getRawValue();

    const processStatus = qualityGap.PROCESS_STATUS;

    if ((processStatus === true || processStatus === '1') && qualityGap.SUB_MEASURE) {
      qualitySubMeasures.push(qualityGap.SUB_MEASURE);
    }

    const commonData = {
        medicaid_id,
        Type: qualityGap.Type,
        Gap_Code: qualityGap.SUB_MEASURE,
        Observation_Date: this.datePipe.transform(qualityGap.Observation_Date, 'yyyy-MM-dd'),         
        Observation_Year: qualityGap.Observation_Date ? new Date(qualityGap.Observation_Date).getFullYear() : null,
        Observation_Code: qualityGap.Observation_Code,
        CPT_Code_Modifier: qualityGap.CPT_Code_Modifier,
        Observation_Code_Set: qualityGap.Observation_Code_Set,
        Observation_Result: qualityGap.Observation_Result,
        Service_Provider_NPI: qualityGap.Service_Provider_NPI,
        Service_Provider_Taxonomy_Code: qualityGap.Service_Provider_Taxonomy_Code,
        Service_Provider_Name: qualityGap.Service_Provider_Name,
        Service_Provider_Type: qualityGap.Service_Provider_Type,
        Service_Provider_RxProviderFlag: qualityGap.Service_Provider_RxProviderFlag,
        Provider_Group_NPI: qualityGap.Provider_Group_NPI,
        Provider_Group_Taxonomy_Code: qualityGap.Provider_Group_Taxonomy_Code,
        Provider_Group_Name: qualityGap.Provider_Group_Name,
        Source: 'CIH',

        // 🔥 ADD THESE
        tin: qualityGap.tin,
        provider_id: qualityGap.provider_id,
        DOSThru: this.datePipe.transform(qualityGap.Observation_Date, 'yyyy-MM-dd'),
        CPTPx: qualityGap.CPTPx,
        HCPCSPx: qualityGap.HCPCSPx,
        LOINC: qualityGap.LOINC,
        SNOMED: qualityGap.SNOMED,
        ICDDX: qualityGap.ICDDX,
        ICDDX10: qualityGap.ICDDX10,
        RxNorm: qualityGap.RxNorm,
        CVX: qualityGap.CVX,
        Modifier: qualityGap.Modifier,
        RxProviderFlag: qualityGap.RxProviderFlag,
        PCPFlag: qualityGap.PCPFlag,
        QuantityDispensed: qualityGap.QuantityDispensed,
        //ICDPx: qualityGap.ICDPx,
        //ICDPx10: qualityGap.ICDPx10,
        SuppSource: qualityGap.SuppSource,
        LOINCAnswer: qualityGap.LOINCAnswer,
        Result: qualityGap.Result,
        //Sex: qualityGap.Sex,
        note: qualityGap.note
    };

    //console.log('commonData:',commonData);
    const providerId = Number(commonData.provider_id);
//alert(typeof providerId); 
    // ✅ UPDATE only if dirty
    //console.log('qualityGap.quality_gap_id:', qualityGap);
    //alert('qualityGap.quality_gap_id: ' + qualityGap.quality_gap_id);
    if (qualityGap.quality_gap_id) {

      if (fg.dirty) {

        // 🔴 TIN VALIDATION
        if (!commonData.tin || commonData.tin.toString().trim() === '') {
          alert('TIN is required for quality gap entries');

          fg.get('tin')?.setErrors({ required: true });
          fg.get('tin')?.markAsTouched();

          isValid = false;
          return;
        }

        //alert('TIN: ' + commonData.tin + '\nProvider ID: ' + commonData.provider_id);

        // 🔴 PROVIDER VALIDATION
        if (!providerId) {
          alert('Provider is required for quality gap entries');

          fg.get('provider_id')?.setErrors({ required: true });
          fg.get('provider_id')?.markAsTouched();

          isValid = false;
          return;
        }

        
        // 🔴 DOS VALIDATION
        if (!commonData.Observation_Date || commonData.Observation_Date.toString().trim() === '') {
          alert('DOS is required for quality gap entries');

          fg.get('Observation_Date')?.setErrors({ required: true });
          fg.get('Observation_Date')?.markAsTouched();

          isValid = false;
          return;
        }

        // ✅ 🔥 AT LEAST ONE CODE REQUIRED VALIDATION
        const hasAtLeastOneCode =
          (commonData.CPTPx && commonData.CPTPx.toString().trim() !== '') ||
          (commonData.HCPCSPx && commonData.HCPCSPx.toString().trim() !== '') ||
          (commonData.ICDDX10 && commonData.ICDDX10.toString().trim() !== '');

        if (!hasAtLeastOneCode) {
          alert('Enter at least one code (CPTPx or HCPCSPx or ICDDX10)');

          // ❗ Set error on all 3 fields for better UX
          //fg.get('CPTPx')?.setErrors({ required: true });
         // fg.get('HCPCSPx')?.setErrors({ required: true });
          //fg.get('ICDDX10')?.setErrors({ required: true });

          fg.get('CPTPx')?.markAsTouched();
          fg.get('HCPCSPx')?.markAsTouched();
          fg.get('ICDDX10')?.markAsTouched();

          isValid = false;
          return;
        }

        // 🔴 RxProviderFlag
        if (commonData.RxProviderFlag === null || commonData.RxProviderFlag === undefined || commonData.RxProviderFlag.toString().trim() === '') {
          alert('RxProviderFlag is required for quality gap entries');

          fg.get('RxProviderFlag')?.setErrors({ required: true });
          fg.get('RxProviderFlag')?.markAsTouched();

          isValid = false;
          return;
        }

        // 🔴 PCPFlag
        if (commonData.PCPFlag === null || commonData.PCPFlag === undefined || commonData.PCPFlag.toString().trim() === '') {
          alert('PCPFlag is required for quality gap entries');

          fg.get('PCPFlag')?.setErrors({ required: true });
          fg.get('PCPFlag')?.markAsTouched();

          isValid = false;
          return;
        }

        // 🔴 SuppSource
        if (!commonData.SuppSource || commonData.SuppSource.toString().trim() === '') {
          alert('Supp Source is required for quality gap entries');

          fg.get('SuppSource')?.setErrors({ required: true });
          fg.get('SuppSource')?.markAsTouched();

          isValid = false;
          return;
        }

        riskObsUpdateArray.push({
          ...commonData,
          id: qualityGap.quality_gap_id,
          updated_date: new Date()
        });
      }

    } else {

      const hasValue = [
        qualityGap.Observation_Date,
          qualityGap.Observation_Code,
          qualityGap.CPT_Code_Modifier,
          qualityGap.Observation_Code_Set,
          qualityGap.Observation_Result,
          qualityGap.Service_Provider_NPI,
          qualityGap.Service_Provider_Taxonomy_Code,
          qualityGap.Service_Provider_Name,
          qualityGap.Service_Provider_Type,
          qualityGap.Service_Provider_RxProviderFlag,
          qualityGap.Provider_Group_NPI,
          qualityGap.Provider_Group_Taxonomy_Code,
          qualityGap.Provider_Group_Name,

          qualityGap.tin,
          qualityGap.provider_id,
          qualityGap.Observation_Date, 
          qualityGap.CPTPx,
          qualityGap.HCPCSPx,
          qualityGap.LOINC,
          qualityGap.SNOMED,
          qualityGap.ICDDX,
          qualityGap.ICDDX10,
          qualityGap.RxNorm,
          qualityGap.CVX,
          qualityGap.Modifier,
          qualityGap.RxProviderFlag,
          qualityGap.PCPFlag,
          qualityGap.QuantityDispensed,

          qualityGap.SuppSource,
          qualityGap.LOINCAnswer,
          qualityGap.Result,
           
          qualityGap.note
      ].some(v => {
  return (
    v !== null &&
    v !== undefined &&
    v.toString().trim() !== "" &&
    v.toString().toLowerCase() !== "null"
  );
});

      if (hasValue) { 

        // 🔴 TIN VALIDATION
        if (!commonData.tin || commonData.tin.toString().trim() === '') {
          alert('TIN is required for quality gap entries');

          fg.get('tin')?.setErrors({ required: true });
          fg.get('tin')?.markAsTouched();

          isValid = false;
          return;
        }
        //alert('Provider ID: ' + providerId);

        // 🔴 PROVIDER VALIDATION
        if (!providerId) {

          alert('Provider is required for quality gap entries');

          fg.get('provider_id')?.setErrors({ required: true });
          fg.get('provider_id')?.markAsTouched();

          isValid = false;
          return;
        }

        
        // 🔴 DOS VALIDATION
        if (!commonData.Observation_Date || commonData.Observation_Date.toString().trim() === '') {
          alert('DOS is required for quality gap entries');

          fg.get('Observation_Date')?.setErrors({ required: true });
          fg.get('Observation_Date')?.markAsTouched();

          isValid = false;
          return;
        }

        // ✅ 🔥 AT LEAST ONE CODE REQUIRED VALIDATION
        const hasAtLeastOneCode =
          (commonData.CPTPx && commonData.CPTPx.toString().trim() !== '') ||
          (commonData.HCPCSPx && commonData.HCPCSPx.toString().trim() !== '') ||
          (commonData.ICDDX10 && commonData.ICDDX10.toString().trim() !== '');

        if (!hasAtLeastOneCode) {
          alert('Enter at least one code (CPTPx or HCPCSPx or ICDDX10)');

          // ❗ Set error on all 3 fields for better UX
          //fg.get('CPTPx')?.setErrors({ required: true });
         // fg.get('HCPCSPx')?.setErrors({ required: true });
          //fg.get('ICDDX10')?.setErrors({ required: true });

          fg.get('CPTPx')?.markAsTouched();
          fg.get('HCPCSPx')?.markAsTouched();
          fg.get('ICDDX10')?.markAsTouched();

          isValid = false;
          return;
        }

        // 🔴 RxProviderFlag
        if (commonData.RxProviderFlag === null || commonData.RxProviderFlag === undefined || commonData.RxProviderFlag.toString().trim() === '') {
          alert('RxProviderFlag is required for quality gap entries');

          fg.get('RxProviderFlag')?.setErrors({ required: true });
          fg.get('RxProviderFlag')?.markAsTouched();

          isValid = false;
          return;
        }

        // 🔴 PCPFlag
        if (commonData.PCPFlag === null || commonData.PCPFlag === undefined || commonData.PCPFlag.toString().trim() === '') {
          alert('PCPFlag is required for quality gap entries');

          fg.get('PCPFlag')?.setErrors({ required: true });
          fg.get('PCPFlag')?.markAsTouched();

          isValid = false;
          return;
        }

        // 🔴 SuppSource
        if (!commonData.SuppSource || commonData.SuppSource.toString().trim() === '') {
          alert('Supp Source is required for quality gap entries');

          fg.get('SuppSource')?.setErrors({ required: true });
          fg.get('SuppSource')?.markAsTouched();

          isValid = false;
          return;
        }

        qualityObsInsertArray.push({
          ...commonData,
          added_by: this.userId,
          added_date: new Date()
        });
      }
    }
  });

  // ⛔ STOP IF INVALID
  if (!isValid) {
    this.isProcessing = false;
    return false;
  }

  try {
     /* ----------------------------------
         STEP 1: UNSET MEMBER GAP STATUS
      -----------------------------------*/
      const paramsunsetq = {
        medicaid_id: medicaid_id,
        action_id: action_id
      };
      const result = await this.apiService.unSetMemberGapsStatus<any>(paramsunsetq);


    /* ----------------------------------
         STEP 2: UPDATE RISK STATUS
      -----------------------------------*/
      const diagVal = diagCodes.length > 0 ? `'${diagCodes.join("','")}'` : '';
      if(diagVal){
         const paramsupdate = {
          medicaid_id: medicaid_id,
          diag_codes: diagVal,
          action_id: action_id
        };
        const updategapresult = await this.apiService.updategapStatus<any>(paramsupdate);
      }

    /* ----------------------------------
         STEP 3: UPDATE QUALITY STATUS
      -----------------------------------*/
      const subMeasureVal = qualitySubMeasures.length > 0 ? `'${qualitySubMeasures.join("','")}'` : '';
      if(subMeasureVal){
        const qualityparamsupdate = {
          medicaid_id: medicaid_id,
          measur_code_val: subMeasureVal,
          action_id: action_id
        };
        const updatequalitygapresult = await this.apiService.updatequalityStatus<any>(qualityparamsupdate);
      }

    /* ----------------------------------
         STEP 4: UPDATE OBSERVATIONS
      -----------------------------------*/
      if (riskObsUpdateArray.length) {
        const apiparamUpdate = {
          table_name: "MEM_GAP_OBSERVATION_DATA",
          id_field_name: "id",
          updates: riskObsUpdateArray
        };
        const updatequalitygapresult = await this.apiService.multipleRowAndFieldUpdate<any>(apiparamUpdate);

      }

    /* ----------------------------------
         STEP 5: INSERT OBSERVATIONS
      -----------------------------------*/
      if (riskObsInsertArray.length) {
        await this.apiService.multipleRowInsert({
          table_name: 'MEM_GAP_OBSERVATION_DATA',
          insertDataArray: riskObsInsertArray
        });
      }
    /* ----------------------------------
         STEP 5: INSERT OBSERVATIONS
      -----------------------------------*/
      if (qualityObsInsertArray.length) {
        await this.apiService.multipleRowInsert({
          table_name: 'MEM_GAP_OBSERVATION_DATA',
          insertDataArray: qualityObsInsertArray
        });
      }


    /* ----------------------------------
        STEP 4: UPDATE PLAN YEAR
     -----------------------------------*/

      if (UpdateArray.length) {
        await Promise.all(
          UpdateArray
            .filter((newArray: any) => newArray.PLANYEAR !== newArray.PLAN_YEAR)
            .map((newArray: any) => this.apiService.updatePlanyearForRiskgap<any>(newArray))
        );
      }

  } catch (error) {
    console.error('❌ Error updating quality/risk data:', error);
    return false;
  } finally {
    this.successMessage.set('Saved successfully');
    setTimeout(() => this.successMessage.set(''), 4000);
    this.isProcessing = false;
  }

  return true; // ✅ FINAL RETURN
}

  

  trackByIndex(index: number) {
    return index;
  }
  async getMemberTaskList(medicaid_id: string) {


    const request: MedicaidIdRequest = {
      medicaid_id: medicaid_id
    };
    const result = await this.apiService.getMemberTaskList<any>(request);
    this.memberTaskList = result.data || [];

  }
  async getMemberGapsList(medicaid_id: string) {
    const request = {
      medicaid_id: medicaid_id
    };
    const result = await this.apiService.getMemberGapsList<any>(request);

    this.cihpcrList = result.data.prismCihPcrList || [];
    this.activityList = result.data.prismActivityList || [];
    this.memberGapList = (result.data.prismGapList || []).map((gap: { Observation_Date: string; }) => ({
      ...gap,
      Observation_Date: this.formatDateToMDY(gap.Observation_Date)
    }));
    this.memberQualityList = (result.data.prismQualityList || []).map((qgap: { Observation_Date: string; }) => ({
      ...qgap,
      Observation_Date: this.formatDateToMDY(qgap.Observation_Date)
    }));

    await this.setRiskGapsData(this.memberGapList);
    await this.setQualityGapsData(this.memberQualityList);
    this.cdr.detectChanges();


  }
  async setRiskGapsData(riskGapsdata: any) {

    this.riskGapsList.clear();

    if (riskGapsdata && Array.isArray(riskGapsdata)) {
      riskGapsdata.forEach((t: any) => {

        const fg = this.fb.group({
          DIAG_CODE: [this.sanitize(t.DIAG_CODE)],
          DIAG_DESC: [this.sanitize(t.DIAG_DESC)],
          RELEVANT_DATE: [t.RELEVANT_DATE],
          HCC_CATEGORY: [t.HCC_CATEGORY],
          HCC_MODEL: [t.HCC_MODEL],
          PLAN_YEAR: [this.extractYear(t.PLAN_YEAR)],

          PROCESS_STATUS: [{ value: !!t.Observation_Result, disabled: true }],

          risk_gap_id: [t.id],
          Type: ['risk'],
          Gap_Code: [this.sanitize(t.Gap_Code)],

          Observation_Date: [
            (t.Observation_Date &&
              t.Observation_Date !== '1900-01-01T00:00:00.000Z' &&
              t.Observation_Date !== '01/01/1900')
              ? new Date(t.Observation_Date)
              : ''
          ],
          RISKGAP_ID: [t.ID],
          PLANYEAR: [Number(this.extractYear(t.PLAN_YEAR))],

          Observation_Year: [this.sanitize(t.Observation_Year)],
          Observation_Code: [this.sanitize(t.Observation_Code)],
          CPT_Code_Modifier: [this.sanitize(t.CPT_Code_Modifier)],
          Observation_Code_Set: [this.sanitize(t.Observation_Code_Set)],
          Observation_Result: [this.sanitize(t.Observation_Result)],
          Service_Provider_NPI: [this.sanitize(t.Service_Provider_NPI)],
          Service_Provider_Taxonomy_Code: [this.sanitize(t.Service_Provider_Taxonomy_Code)],
          Service_Provider_Name: [this.sanitize(t.Service_Provider_Name)],
          Service_Provider_Type: [this.sanitize(t.Service_Provider_Type)],
          Service_Provider_RxProviderFlag: [this.sanitize(t.Service_Provider_RxProviderFlag)],
          Provider_Group_NPI: [this.sanitize(t.Provider_Group_NPI)],
          Provider_Group_Taxonomy_Code: [this.sanitize(t.Provider_Group_Taxonomy_Code)],
          Provider_Group_Name: [this.sanitize(t.Provider_Group_Name)],
          note: [this.sanitize(t.note)]
        });

        fg.get('Observation_Result')?.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(value => {
            fg.get('PROCESS_STATUS')?.setValue(!!value, { emitEvent: false });
          });
        fg.markAsPristine();
        fg.markAsUntouched();
        this.riskGapsList.push(fg);

      });
    }
  }

  extractYear(value: any): string {

    if (!value || value === '1900-01-01T00:00:00.000Z') {
      return ''; // treat as blank
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return ''; // invalid date safety
    }

    return d.getFullYear().toString();
  }


  sanitize(value: any) {
    return value === null || value === undefined || value === 'null' ? '' : value;
  }
  async setQualityGapsData(qualityGapsdata: any) {
    // Clear existing list
    this.qualityGapsList.clear();    

    if (qualityGapsdata && Array.isArray(qualityGapsdata)) {
      qualityGapsdata.forEach((t: any) => {

        const fg = this.fb.group({
          SUB_MEASURE: [this.sanitize(t.SUB_MEASURE)],
          MEASURE_NAME: [this.sanitize(t.MEASURE_NAME)],         
          // 🔒 Disabled checkbox, auto-controlled
          PROCESS_STATUS: [{ value: !!t.Observation_Result, disabled: true }],

          quality_gap_id: [t.id],
          Type: ['quality'],
          Gap_Code: [this.sanitize(t.Gap_Code)],

          Observation_Date: [
            t.Observation_Date &&
              t.Observation_Date !== '1900-01-01T00:00:00.000Z' &&
              t.Observation_Date !== '01/01/1900'
              ? new Date(t.Observation_Date)
              : ''
          ], 

          DOSThru: [
            t.DOSThru &&
              t.DOSThru !== '1900-01-01T00:00:00.000Z' &&
              t.DOSThru !== '01/01/1900'
              ? new Date(t.DOSThru)
              : ''
          ], 
          
          // 🔥 ADD THESE NEW FIELDS (IMPORTANT)
          // ✅ REQUIRED FIELD
          tin: [String(t.tin)],
          provider_id: [this.sanitize(t.provider_id)],
          CPTPx: [this.sanitize(t.CPTPx)],          
          HCPCSPx: [this.sanitize(t.HCPCSPx)],
          LOINC: [this.sanitize(t.LOINC)],
          SNOMED: [this.sanitize(t.SNOMED)],
          ICDDX: [this.sanitize(t.ICDDX)],
          ICDDX10: [this.sanitize(t.ICDDX10)],
          RxNorm: [this.sanitize(t.RxNorm)],
          CVX: [this.sanitize(t.CVX)],
          Modifier: [this.sanitize(t.Modifier)],
          RxProviderFlag: [this.sanitize(t.RxProviderFlag)],
          PCPFlag: [this.sanitize(t.PCPFlag)],
          QuantityDispensed: [this.sanitize(t.QuantityDispensed)],
          //ICDPx: [this.sanitize(t.ICDPx)],
          //ICDPx10: [this.sanitize(t.ICDPx10)],
          SuppSource: [this.sanitize(t.SuppSource)],
          LOINCAnswer: [this.sanitize(t.LOINCAnswer)],
          Result: [this.sanitize(t.Result)],
          //Sex: [this.sanitize(t.Sex)],

          Observation_Year: [this.sanitize(t.Observation_Year)],
          Observation_Code: [this.sanitize(t.Observation_Code)],
          CPT_Code_Modifier: [this.sanitize(t.CPT_Code_Modifier)],
          Observation_Code_Set: [this.sanitize(t.Observation_Code_Set)],
          Observation_Result: [this.sanitize(t.Observation_Result)],
          Service_Provider_NPI: [this.sanitize(t.Service_Provider_NPI)],
          Service_Provider_Taxonomy_Code: [this.sanitize(t.Service_Provider_Taxonomy_Code)],
          Service_Provider_Name: [this.sanitize(t.Service_Provider_Name)],
          Service_Provider_Type: [this.sanitize(t.Service_Provider_Type)],
          Service_Provider_RxProviderFlag: [this.sanitize(t.Service_Provider_RxProviderFlag)],
          Provider_Group_NPI: [this.sanitize(t.Provider_Group_NPI)],
          Provider_Group_Taxonomy_Code: [this.sanitize(t.Provider_Group_Taxonomy_Code)],
          Provider_Group_Name: [this.sanitize(t.Provider_Group_Name)],
          note: [this.sanitize(t.note)]
        });

const indexq = this.qualityGapsList.length;

this.filteredCptOptions[indexq] = fg.get('CPTPx')!.valueChanges.pipe(
  startWith(''),
  debounceTime(300),
  distinctUntilChanged(),
  map(value => {
    const filterValue = (value || '').toLowerCase();

    return this.cptList
      .filter(cpt =>
        (cpt.code || '').toLowerCase().includes(filterValue) ||
        (cpt.label || '').toLowerCase().includes(filterValue)
      )
      .slice(0, 50);
  })
);
this.filteredhspcsOptions[indexq] = fg.get('HCPCSPx')!.valueChanges.pipe(
  startWith(''),
  debounceTime(300),
  distinctUntilChanged(),
  map(value => {
    const filterValue = (value || '').toLowerCase();

    return this.hspcsList
      .filter(cpt =>
        (cpt.HCPCS_Code || '').toLowerCase().includes(filterValue) ||
        (cpt.subcategory || '').toLowerCase().includes(filterValue)
      )
      .slice(0, 50);
  })
);
this.filteredicdOptions[indexq] = fg.get('ICDDX10')!.valueChanges.pipe(
  startWith(''),
  debounceTime(300),
  distinctUntilChanged(),
  map(value => {
    const filterValue = (value || '').toLowerCase();

    return this.icdList
      .filter(cpt =>
        (cpt.code || '').toLowerCase().includes(filterValue) ||
        (cpt.label || '').toLowerCase().includes(filterValue)
      )
      .slice(0, 50);
  })
);
        fg.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {

          const hasAnyValue =
            val.Observation_Date ||
            val.CPTPx ||
            val.HCPCSPx ||
            val.SNOMED ||
            val.ICDDX ||
            val.ICDDX10 ||
            val.LOINC ||
            val.RxNorm ||
            val.CVX ||
            val.QuantityDispensed ||
            val.Observation_Result ||
            val.note;

          const tinControl = fg.get('tin');

          if (hasAnyValue) {
            tinControl?.setValidators([Validators.required]);
          } else {
            tinControl?.clearValidators();
          }

          tinControl?.updateValueAndValidity({ emitEvent: false });

        });


        fg.get('Observation_Result')?.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(value => {
            fg.get('PROCESS_STATUS')?.setValue(!!value, { emitEvent: false });
          });
        fg.markAsPristine();
        fg.markAsUntouched();
        this.qualityGapsList.push(fg);
        // ✅ Auto trigger on page load if tin exists
        const index = this.qualityGapsList.length - 1;

        if (t.tin) {
          this.onTinChange(t.tin, index, t.provider_id);
        }
      });
    }

  }

  toggleContent() {
    this.showContent = !this.showContent;
  }

  cancel() {
    this.showContent = false;
  }

  getProviderGroupByTin(tin: string): string {
    const providerName = PROVIDER_TIN_MAP[tin];
    return `${providerName}`;
  }

  async addMeasure() {

    if (this.measureForm.invalid) {
      this.measureForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      // 🚫 DUPLICATE CHECK FIRST
      const isDuplicate = await this.isDuplicateMeasure();

      if (isDuplicate) {
        this.measureForm.get('MEASURE')?.setErrors({ duplicateMeasure: true });
        this.measureForm.markAllAsTouched();
        return;
      }

      // ✅ ONLY INSERT IF NOT DUPLICATE
      const payload = this.buildAddressPayload();
      await this.apiService.insert(payload);

      await this.logSuccess();

      // ✅ ADD ROW TO TABLE
      this.addStarPerformanceRow();

      // ✅ RESET FORM
      this.measureForm.reset();
      this.showContent = false;

    } catch (error) {
      console.error('Add measure failed', error);
    } finally {
      this.isLoading = false;
    }
  }

  private addStarPerformanceRow() {
    const f = this.measureForm.value;
    this.starperformanceList = [
      ...this.starperformanceList,
      {
        TYPE: 'PRISM',
        RECIP_NO: this.medicaid_id,
        SUB_MEASURE: f.MEASURE,
        PCP_TAX_ID: f.PCP_TAX_ID,
        NUMERATOR_GAP: f.NUM_COUNT,
        ADDED_DATE: new Date()
      }
    ];
  }

  trackByMedicaidId(index: number, star: any): any {
    return star.medicaid_id;
  }

  trackByMedicaidIdapp(index: number, app: any): any {
    return app.medicaid_id;
  }


  async isDuplicateMeasure(): Promise<boolean> {
    const f = this.measureForm.value;

    return this.starperformanceList.some(row =>
      row.RECIP_NO === this.medicaid_id &&
      row.SUB_MEASURE === f.MEASURE &&
      row.PCP_TAX_ID === f.PCP_TAX_ID
    );
  }


  private buildAddressPayload() {
    const user = this.userData.getUser();
    const f = this.measureForm.value;
    const MEASURE_YEAR = new Date(f.MEASURE_DATE).getFullYear();

    return {
      table_name: 'MEM_STAR_PERFORMANCE_PRISM_DATA',
      insertDataArray: [{
        MEDICAID_ID: this.medicaid_id,
        MEASURE: f.MEASURE,
        MEASURE_DATE: this.datePipe.transform(f.MEASURE_DATE, 'yyyy-MM-dd'),
        MEASURE_YEAR: MEASURE_YEAR,
        NUM_COUNT: f.NUM_COUNT,
        PCP_TAX_ID: f.PCP_TAX_ID,
        ADDED_BY: user.ID
      }]
    };
  }

  private logSuccess(): Promise<any> {
    const user = this.userData.getUser();
    if (!this.medicaid_id) {
      throw new Error('medicaid_id is missing');
    }
    const logpayload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: this.medicaid_id,
        log_name: 'ADD NUM COUNT',
        log_details: `ADD NUM COUNT FOR ${this.medicaid_id}`,
        log_status: 'SUCCESS',
        log_by: user.ID,
        action_type: 'ADD NUM COUNT'
      }]
    };
    return this.apiService.insert(logpayload);
  }

  private applogSuccess(): Promise<any> {
    const user = this.userData.getUser();
    if (!this.medicaid_id) {
      throw new Error('medicaid_id is missing');
    }
    const logpayload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: this.medicaid_id,
        log_name: 'APPOINTMENT',
        log_details: `APPOINTMENT CREATED FOR ${this.medicaid_id}`,
        log_status: 'SUCCESS',
        log_by: user.ID,
        action_type: 'APPOINTMENT CREATED'
      }]
    };
    return this.apiService.insert(logpayload);
  }

  formatYMD(date:Date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }



  formatDateToMDY(dateStr: string): string {
    if (!dateStr) return '';

    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-');
    return `${month}/${day}/${year}`;
  }


  formatDateToYMD(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`; // m/d/Y format
  }
  add_system_log(request: LogRequest): Promise<any> {
    return this.apiService.insert<any, LogRequest>(request);
  }
  private addTaskLog(type: string, note: string): Promise<any> {
    if (!this.medicaid_id) {
      return Promise.reject('medicaid_id is required');
    }
    const payload: LogRequest = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [{
        medicaid_id: this.medicaid_id,
        log_name: type,
        log_details: `${type} FOR ${this.medicaid_id} - ${note}`,
        log_status: 'SUCCESS',
        log_by: Number(this.userId),
        action_type: type
      }]
    };
    return this.add_system_log(payload);
  }
  isValidPcpVisitDate(): boolean {
    const value = this.pcpVisitFormGroup.get('pcp_visit_date')?.value;
    if (!value) {
      return false;
    }

    const date = value instanceof Date ? value : new Date(value);
    return !isNaN(date.getTime());
  }
trackByCpt(index: number, item: any) {
  return item.code;
}
}

