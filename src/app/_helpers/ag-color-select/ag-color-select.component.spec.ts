import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgColorSelectComponent } from './ag-color-select.component';

describe('AgColorSelectComponent', () => {
  let component: AgColorSelectComponent;
  let fixture: ComponentFixture<AgColorSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgColorSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgColorSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
