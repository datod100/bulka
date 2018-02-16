import { OrderItem } from "./index";
import { Client } from "./client";
import { Status } from "./status";

export class Order {
    order_id: number;
    client_id: number;
    client:Client;
    status_id: number;
    status: Status;
    confirmation_number : string;
    confirmation_date : Date;
    supply_date : Date;
    proform_number : string;
    paid : number;
    items : OrderItem[];
}