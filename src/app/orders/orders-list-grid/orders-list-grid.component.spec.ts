import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersListGridComponent } from './orders-list-grid.component';

describe('OrdersListGridComponent', () => {
  let component: OrdersListGridComponent;
  let fixture: ComponentFixture<OrdersListGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdersListGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersListGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
