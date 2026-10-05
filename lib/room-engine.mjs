export function validateRequest(value, now = new Date()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Check your search requirements.');
  const { size, level, date, start, flexible, screen } = value;
  const duration = Number(value.duration);
  if (!Number.isInteger(size) || size < 2 || size > 12) throw new Error('Choose a group size between 2 and 12.');
  if (!['undergraduate','postgraduate'].includes(level)) throw new Error('Choose your UCL student level.');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid meeting date.');
  const d = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== date) throw new Error('Choose a valid meeting date.');
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const days = (d.getTime() - new Date(today+'T12:00:00Z').getTime()) / 86400000;
  if (days < 0 || days > 3) throw new Error('UCL allows bookings up to three days ahead. Choose today or one of the next three days.');
  if (typeof start !== 'string' || !/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(start)) throw new Error('Choose a start time on the hour or half-hour.');
  if (![60,90,120,180].includes(duration)) throw new Error('Choose a supported session duration.');
  if (minutes(start)+duration > 1440) throw new Error('Your session must finish before midnight.');
  if (typeof flexible !== 'boolean' || typeof screen !== 'boolean') throw new Error('Check your search options.');
  return {size,level,date,start,duration,flexible,screen};
}
export const minutes = t => Number(t.slice(0,2))*60 + Number(t.slice(3,5));
export const clock = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const text = html => html.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const attr = (tag,name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
export function parseCalendar(html, expectedDate, source) {
  if (typeof html !== 'string' || !html.includes('s-lc-eq-times-form')) throw new Error('The calendar did not expose booking intervals.');
  const select = html.match(/<select\b[^>]*\bid="date"[^>]*>([\s\S]*?)<\/select>/i)?.[1];
  const chosen = select?.match(/<option\b(?=[^>]*\bselected)(?=[^>]*\bvalue="([^"]+)")[^>]*>/i)?.[1];
  if (chosen !== expectedDate) throw new Error('The calendar did not confirm the requested date.');
  const markers = [...html.matchAll(/<div\b[^>]*\bid="slots-(\d+)"[^>]*>/g)];
  if (!markers.length) throw new Error('The calendar did not expose any room records.');
  return markers.map((m,i) => {
    const begin=m.index, end=markers[i+1]?.index ?? html.length;
    const headerStart=html.lastIndexOf('<h2',begin);
    const header=html.slice(headerStart,html.indexOf('</h2>',headerStart));
    const name=text(header.split('<span')[0]);
    const section=html.slice(begin,end), plain=text(section);
    const capacity=Number(plain.match(/Maximum capacity:\s*(\d+)/i)?.[1] ?? text(header).match(/Capacity\s*(\d+)/i)?.[1]);
    if (!capacity || !name) throw new Error('Room capacity could not be verified.');
    const details=plain.match(/Facilities:\s*(.*?)\s*Building:/i)?.[1] ?? '';
    const facilities=details.split(',').map(s=>s.trim()).filter(Boolean).slice(0,8);
    const floor=plain.match(/Location:\s*(.*?)\s*Building accessibility:/i)?.[1] ?? 'Science Library';
    const slots=[...section.matchAll(/<input\b[^>]*\bclass="booking-checkbox"[^>]*>/g)].map(x=>({id:attr(x[0],'data-eid'),start:attr(x[0],'data-start'),end:attr(x[0],'data-end'),disabled:/\bdisabled/.test(x[0])})).filter(s=>s.id===m[1] && !s.disabled && s.start?.startsWith(expectedDate+' ') && s.end?.startsWith(expectedDate+' ')).map(s=>({start:minutes(s.start.slice(11,16)),end:minutes(s.end.slice(11,16))}));
    return {id:m[1],name,capacity,floor,facilities,source:`https://library-calendars.ucl.ac.uk/space/${m[1]}`,calendarSource:source,slots,postgraduate:/postgraduate\s+(?:students?\s+)?only/i.test(name+' '+plain)};
  });
}
export function covers(slots,start,end) {
  let cursor=start;
  for(const s of [...slots].sort((a,b)=>a.start-b.start)) { if(s.end<=cursor) continue; if(s.start>cursor) return false; cursor=Math.max(cursor,s.end); if(cursor>=end) return true; }
  return false;
}
export function matchRooms(candidates,input,checkedAt=new Date().toISOString()) {
  const excluded=[], rooms=[];
  for(const room of candidates) {
    const hasScreen=room.facilities.some(s=>/screen|TV|projection|projector|monitor/i.test(s) && !/coming soon|planned|unavailable|not available/i.test(s));
    const reason=room.capacity<input.size?`Capacity ${room.capacity} is below your group size of ${input.size}.`:room.postgraduate && input.level==='undergraduate'?'Restricted to postgraduate students.':input.screen&&!hasScreen?'A screen or projector is not listed in the official facilities.':null;
    if(reason){excluded.push({name:room.name,reason});continue;}
    const start=minutes(input.start), offsets=input.flexible?[0,30,60]:[0];
    const offset=offsets.find(o=>start+o+input.duration<=1440 && covers(room.slots,start+o,start+o+input.duration));
    const available=offset!==undefined;
    rooms.push({...room,slots:undefined,checkedAt,available,alternative:available&&offset>0,interval:available?`${clock(start+offset)}–${clock(start+offset+input.duration)} · ${input.date}`:undefined,match:`Seats your group of ${input.size}${input.screen?' and has a listed screen or projector':''}. UCL ID required.`,evidence:available?`Every interval covering this ${input.duration}-minute session was present in UCL’s available-slot list.${offset>0?` Start ${offset} minutes later than requested.`:''}`:`No continuous ${input.duration}-minute interval fits ${input.start}${input.flexible?' or starts 30–60 minutes later':''}.`});
  }
  rooms.sort((a,b)=>Number(b.available)-Number(a.available)||Number(a.alternative)-Number(b.alternative)||a.capacity-b.capacity);
  return {rooms,excluded,checkedAt};
}
