import {useEffect,useId,useRef,useState} from 'react';
type Option={value:string;label:string};
export default function StudioSelect({label,value,options,onChange,disabled=false,placement='down',searchable=false,searchLabel='Search'}:{label:string;value:string;options:Option[];onChange:(value:string)=>void;disabled?:boolean;placement?:'up'|'down';searchable?:boolean;searchLabel?:string}){
  const id=useId(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLDivElement>(null),search=useRef<HTMLInputElement>(null);
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0);
  const filtered=options.filter(o=>o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const selected=options.find(o=>o.value===value);
  function close(){setOpen(false);}
  function expand(){setQuery('');setActive(Math.max(0,options.findIndex(o=>o.value===value)));setOpen(true);}
  function choose(option:Option){onChange(option.value);close();trigger.current?.focus();}
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))close();};
    document.addEventListener('pointerdown',outside);
    if(searchable)search.current?.focus();
    return()=>document.removeEventListener('pointerdown',outside);
  },[open,searchable]);
  useEffect(()=>{
    if(!open)return;const row=list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`),container=list.current;
    if(row&&container){if(row.offsetTop<container.scrollTop)container.scrollTop=row.offsetTop;else if(row.offsetTop+row.offsetHeight>container.scrollTop+container.clientHeight)container.scrollTop=row.offsetTop+row.offsetHeight-container.clientHeight;}
  },[active,open]);
  return <div ref={root} className={`studio-select ${open?'is-open':''} opens-${placement}`} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))close();}} onKeyDown={e=>{
    if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();close();trigger.current?.focus();}
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open)expand();else setActive(i=>Math.max(0,Math.min(filtered.length-1,i+(e.key==='ArrowDown'?1:-1))));}
    else if(open&&(e.key==='Enter'||e.key===' '&&!searchable)){e.preventDefault();if(filtered[active])choose(filtered[active]);}
    else if(open&&e.key==='Home'&&!searchable){e.preventDefault();setActive(0);}
    else if(open&&e.key==='End'&&!searchable){e.preventDefault();setActive(filtered.length-1);}
  }}>
    <button ref={trigger} type="button" className="studio-select-trigger" role="combobox" aria-label={label} aria-expanded={open} aria-controls={id} aria-haspopup="listbox" aria-activedescendant={open&&!searchable?`${id}-${active}`:undefined} disabled={disabled} onClick={()=>open?close():expand()}><span>{selected?.label??label}</span><i className="select-chevron" aria-hidden="true"/></button>
    <div className="studio-select-popup" inert={!open} aria-hidden={!open}>
      {searchable&&<input ref={search} className="select-search" aria-label={searchLabel} placeholder={searchLabel} value={query} onChange={e=>{setQuery(e.target.value);setActive(0);}} role="combobox" aria-expanded={open} aria-controls={id} aria-autocomplete="list" aria-activedescendant={filtered[active]?`${id}-${active}`:undefined}/>}
      <div ref={list} className="studio-select-options" id={id} role="listbox" aria-label={label}>{filtered.map((o,i)=><button type="button" key={o.value} id={`${id}-${i}`} role="option" aria-selected={value===o.value} tabIndex={-1} data-index={i} className={i===active?'is-active':''} onPointerMove={()=>setActive(i)} onClick={()=>choose(o)}><span>{o.label}</span><span aria-hidden="true">{value===o.value?'✓':''}</span></button>)}</div>
    </div>
  </div>;
}
