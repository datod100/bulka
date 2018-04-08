import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Group } from '../_models/index';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class GroupService {
    private groups: Group[] = [];
    private colors: string[] = ["#dae9f6", "#f57878", "#FFFF00", "#8cf58c", "#00FFFF", "#f3bd6c", "#ff80ff", "#6ab9ff","#28a745","#4684b9","#ffc107","#ce3947"];
    private names: string[] = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח","ט","י",'י"א','י"ב'];

    constructor() {
        for (let i: number = 0; i < this.names.length; i++) {
            this.groups.push(new Group(i, "קבוצה " + this.names[i], this.colors[i]));
        }
    }
    getAll() {
        return Observable.of(this.groups);
    }

    getById(group_id: number) {
        return this.groups.find(group => group.group_id == group_id);
    }

}
