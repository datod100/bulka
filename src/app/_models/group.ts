export class Group {
    group_id: number;
    name: string;
    color: string;

    constructor(group_id, name, color){
        this.group_id = group_id;
        this.name = name;
        this.color = color;
    }
}