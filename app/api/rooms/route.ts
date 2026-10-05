import { validateRequest, parseCalendar, matchRooms } from '@/lib/room-engine.mjs';
import { discoverRules, fetchPages } from '@/lib/tinyfish';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({message:'Use the Room Rescue form to search.'},{status:403,headers});
 let input;
 try{input=validateRequest(await request.json());}catch(e){return Response.json({message:e instanceof Error?e.message:'Check your search.'},{status:400,headers});}
 try{
  const discovered=await discoverRules(input.screen);
  const rulesUrl=discovered.find((s:string)=>s.endsWith('bookable-study-spaces-help'))??'https://www.ucl.ac.uk/library/using-library/libraries-and-study-spaces/bookable-study-spaces-help';
  const calendarUrls=[1,2,3,4].map(capacity=>{const url=new URL('https://library-calendars.ucl.ac.uk/r/accessible/availability');for(const [k,v] of Object.entries({lid:'692',gid:'5421',zone:'0',space:'0',capacity:String(capacity),date:input.date}))url.searchParams.set(k,v);return url.toString();});
  const [rules,calendars]=await Promise.all([fetchPages([rulesUrl],'markdown'),fetchPages(calendarUrls,'html',true)]);
  if(!rules.results.some(p=>/only UCL students and staff|UCL students and staff can/i.test(p.text)))throw new Error('The published access rules could not be verified. Please check UCL directly.');
  const candidates=[];const failed:string[]=[];
  for(const url of calendarUrls){const page=calendars.results.find(p=>p.url===url);if(!page){failed.push(url);continue;}try{candidates.push(...parseCalendar(page.text,input.date,url));}catch{failed.push(url);}}
  if(!candidates.length)throw new Error('The calendar could not be read for this date. Availability is unknown; please open UCL bookings to check.');
  const unique=[...new Map(candidates.map(r=>[r.id,r])).values()];
  const matched=matchRooms(unique,input);
  return Response.json({...matched,sources:[rulesUrl,...calendarUrls],message:failed.length?`${failed.length} capacity categories could not be checked. Results cover only the rooms successfully read.`:undefined},{headers});
 }catch(e){return Response.json({message:e instanceof Error?e.message:'The live search could not finish.'},{status:503,headers});}
}
