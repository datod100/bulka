import { Price } from ".";

export class Client {
    client_id: number;
    name: string;    
    hetpei: number;
    address: string;
    email: string;
    phone: string;
    contact_person: string;
    travel_duration: string;
    group_id: number;
    default_time1: string;
    default_time2: string;
    default_time3: string;
    prices : Price[];
}