import entries from 'virtual:studio-content';
export type Entry={id:string;section:string;locale:string;title:string;artist:string;url:string;cover:string;accent:string;order:number;body:string};
export function collection(section:string,locale:string):Entry[]{
 const selected=new Map<string,Entry>();
 for(const item of entries)if(item.section===section&&item.locale==='zh-TW')selected.set(item.id,item);
 for(const item of entries)if(item.section===section&&item.locale===locale)selected.set(item.id,item);
 return [...selected.values()].sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
}
export function asset(url:string){return url.startsWith('/')?`${import.meta.env.BASE_URL}${url.slice(1)}`:url;}
