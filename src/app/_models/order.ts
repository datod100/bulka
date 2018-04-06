import { OrderItem } from "./index";
import { Client } from "./client";

export class Order {
    index_id: number;
    order_id: number;
    client_id: number;
    client:Client;
    status_id: number;
    group_id: number;
    supply_time: string;
    sort_order:number;
    invoice_number:number;
}

export class OrderSummaryItem{    
    index_id: number;
    order_id: number;
    cycle_id: number;
    product_id: number;
    quantity: number;
}