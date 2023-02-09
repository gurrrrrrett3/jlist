export interface List {
    name: string;
    path: string;
    items: Item[];
}

export interface Item {
    name: string;
    addDate: Date;
    strikethrough: boolean;   
    reason: string;
}