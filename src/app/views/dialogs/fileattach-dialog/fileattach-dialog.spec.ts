import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileattachDialog } from './fileattach-dialog';

describe('FileattachDialog', () => {
  let component: FileattachDialog;
  let fixture: ComponentFixture<FileattachDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileattachDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileattachDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
