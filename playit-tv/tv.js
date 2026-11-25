/* VIDAA remote control enhancement for PLAYIT TV Edition. No production modification. */
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const interactive='button:not([disabled]):not([hidden]),a[href],input:not([disabled]):not([hidden]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const shown=el=>!!(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&el.closest('[hidden]')===null);
function scope(){return q('#cine-dialog:not([hidden]) .cine-sheet')||q('dialog[open]')||(!q('#playit-catalog')?.hidden?q('#playit-catalog .catalog-shell'):null)||q('#access-gate');}
function candidates(){return [...(scope()?.querySelectorAll(interactive)||[])].filter(shown).filter(el=>!el.closest('[aria-hidden="true"]'));}
function moveFocus(direction){
 const nodes=candidates(),current=document.activeElement;const box=current?.getBoundingClientRect?.();
 if(!nodes.length)return;
 if(!box||!nodes.includes(current)){nodes[0].focus({preventScroll:true});nodes[0].scrollIntoView({block:'nearest',inline:'nearest'});return;}
 const center={x:box.left+box.width/2,y:box.top+box.height/2};
 const options=nodes.filter(el=>el!==current).map(el=>{
  const r=el.getBoundingClientRect(),dx=r.left+r.width/2-center.x,dy=r.top+r.height/2-center.y;
  const primary=direction==='left'?-dx:direction==='right'?dx:direction==='up'?-dy:dy;
  const lateral=direction==='left'||direction==='right'?Math.abs(dy):Math.abs(dx);
  return{el,primary,lateral};
 }).filter(v=>v.primary>7).sort((a,b)=>(a.primary+2.8*a.lateral)-(b.primary+2.8*b.lateral));
 if(options[0]){options[0].el.focus({preventScroll:true});options[0].el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
}
function focusEntry(){
 const catalog=q('#playit-catalog');if(!catalog||catalog.hidden)return;
 const first=q('#playit-catalog .catalog-platforms button')||q('#playit-catalog .catalog-search input');
 if(first&&!catalog.contains(document.activeElement))first.focus({preventScroll:true});
}
function launchCatalog(){
 if(q('#access-gate')&&!q('#access-gate').hidden&&getComputedStyle(q('#access-gate')).display!=='none')return;
 const open=q('#playit-catalog-open');if(open&&q('#playit-catalog')?.hidden){open.click();setTimeout(focusEntry,120);}
}
document.addEventListener('keydown',event=>{
 const dir={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[event.key];
 if(dir&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){
   event.preventDefault();moveFocus(dir);return;
 }
 if((event.key==='Backspace'||event.key==='BrowserBack')&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
   event.preventDefault();
   if(q('#cine-dialog:not([hidden])')){q('#cine-dialog [data-cine-close]')?.click();return;}
   if(q('#playit-catalog')&&!q('#playit-catalog').hidden){q('#playit-catalog .catalog-close')?.click();return;}
 }
 if(event.key==='Enter'&&document.activeElement?.tagName==='SUMMARY')document.activeElement.click();
},true);
document.addEventListener('focusin',event=>{if(shown(event.target))event.target.scrollIntoView({block:'nearest',inline:'nearest'});});
function init(){
 if(!q('#tv-mode-banner')){const mark=document.createElement('div');mark.id='tv-mode-banner';mark.textContent='PLAYIT · TV EDITION';document.body.append(mark);}
 const gate=q('#access-gate');if(gate)new MutationObserver(()=>launchCatalog()).observe(gate,{attributes:true,attributeFilter:['hidden','class','style']});
 q('#playit-catalog-open')?.addEventListener('click',()=>setTimeout(focusEntry,90));
 launchCatalog();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
