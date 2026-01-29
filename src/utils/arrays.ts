export const uniqueById = <T extends {id:string|number}>(xs:T[]) =>
  Object.values(xs.reduce<Record<string|number,T>>((m,x)=>{m[x.id]=x;return m;},{}));
