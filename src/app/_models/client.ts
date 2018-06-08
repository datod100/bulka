import { Price, Group } from ".";

export class Client {
    client_id: number;
    name: string;
    active: boolean;
    hetpei: number;
    address: string;
    email: string;
    phone: string;
    contact_person: string;
    payment_phone: string;
    payment_person: string;
    travel_duration: string;
    group_id: number;
    group_order : number;
    default_time1: string;
    default_time2: string;
    default_time3: string;
    prices : Price[];
    packages : Price[];    
    group: Group;
}