export type SearchInput={size:number;level:string;date:string;start:string;duration:number;flexible:boolean;screen:boolean};
export type Candidate={id:string;name:string;capacity:number;floor:string;facilities:string[];source:string;calendarSource:string;slots:{start:number;end:number}[];postgraduate:boolean};
export function validateRequest(value:unknown,now?:Date):SearchInput;
export function parseCalendar(html:string,date:string,source:string):Candidate[];
export function matchRooms(candidates:Candidate[],input:SearchInput,checkedAt?:string):{rooms:unknown[];excluded:{name:string;reason:string}[];checkedAt:string};
export function covers(slots:{start:number;end:number}[],start:number,end:number):boolean;
export function minutes(time:string):number;
export function clock(minutes:number):string;
