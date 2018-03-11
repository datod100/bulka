import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceReportComponent } from './balance.component';

describe('BalanceComponent', () => {
  let component: BalanceReportComponent;
  let fixture: ComponentFixture<BalanceReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BalanceReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BalanceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
