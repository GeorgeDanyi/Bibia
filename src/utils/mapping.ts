export function mapMeetingType(ui:string|undefined){
  if(ui==='ordinace') return 'clinic';
  if(ui==='domu') return 'home_visit';
  return undefined;
}

export const DEFAULT_LANGUAGE = 'cestina';
