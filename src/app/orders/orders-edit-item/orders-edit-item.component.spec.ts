import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersEditItemComponent } from './orders-edit-item.component';

describe('OrdersEditItemComponent', () => {
  let component: OrdersEditItemComponent;
  let fixture: ComponentFixture<OrdersEditItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdersEditItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdersEditItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
