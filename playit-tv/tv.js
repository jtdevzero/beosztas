/* VIDAA remote control enhancement for PLAYIT TV Edition. No production modification. */
(()=>{
'use strict';
const q=s=>document.querySelector(s);
const interactive='button:not([disabled]):not([hidden]),a[href],input:not([disabled]):not([hidden]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const shown=el=>!!(el&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&el.closest('[hidden]')===null);
function scope(){return q('#cine-dialog:not([hidden]) .cine-sheet')||q('dialog[open]')||(!q('#playit-catalog')?.hidden?q('#playit-catalog'):null)||q('#access-gate');}
function candidates(){return [...(scope()?.querySelectorAll(interactive)||[])].filter(shown).filter(el=>!el.closest('[aria-hidden="true"]'));}
let lastRemoteMove=0,preferredColumnX=null;
function tvScroll(node){
 const shell=q('#playit-catalog .catalog-shell');
 if(!node)return;
 if(shell&&shell.contains(node)){
  const box=node.getBoundingClientRect(),view=shell.getBoundingClientRect();
  const margin=75;
  const delta=box.top<view.top+margin?box.top-view.top-margin:box.bottom>view.bottom-margin?box.bottom-view.bottom+margin:0;
  if(Math.abs(delta)>3) shell.scrollTop+=delta;
 }else if(node.closest('.tv-side-menu')){
  node.scrollIntoView({block:'nearest',inline:'nearest'});
 }else node.scrollIntoView({block:'nearest',inline:'nearest'});
}
function focusRemote(node,vertical){
 if(!node)return false;
 try{node.focus({preventScroll:true});}catch(_){node.focus();}
 tvScroll(node);
 if(!vertical){const r=node.getBoundingClientRect();preferredColumnX=r.left+r.width/2;}
 return true;
}
function moveFocus(direction){
 const nodes=candidates(),current=document.activeElement;
 if(!nodes.length)return;
 if(!nodes.includes(current)){focusRemote(nodes[0],false);return;}
 const vertical=direction==='down'||direction==='up';
 const box=current.getBoundingClientRect();
 const cx=box.left+box.width/2,cy=box.top+box.height/2;
 const referenceX=vertical&&preferredColumnX!==null?preferredColumnX:cx;
 const fromSidebar=!!current.closest('.tv-side-menu');
 if(direction==='left'&&!fromSidebar){
  const menu=nodes.filter(n=>n.closest('.tv-side-menu'));
  if(menu.length){focusRemote(menu.reduce((a,b)=>Math.abs(a.getBoundingClientRect().top-cy)<Math.abs(b.getBoundingClientRect().top-cy)?a:b),false);return;}
 }
 if(direction==='right'&&fromSidebar){
  const content=nodes.filter(n=>n.closest('.catalog-shell'));
  if(content.length){const visibleContent=content.filter(n=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});focusRemote((visibleContent.length?visibleContent:content)[0],false);return;}
 }
 const eligible=nodes.filter(n=>n!==current&&!!n.closest('.tv-side-menu')===fromSidebar).map(n=>{
  const r=n.getBoundingClientRect();
  const x=r.left+r.width/2,y=r.top+r.height/2;
  const longitudinal=direction==='down'?y-cy:direction==='up'?cy-y:direction==='right'?x-cx:cx-x;
  const lateral=vertical?Math.abs(x-referenceX):Math.abs(y-cy);
  const overlap=vertical?Math.max(0,Math.min(box.right,r.right)-Math.max(box.left,r.left)):Math.max(0,Math.min(box.bottom,r.bottom)-Math.max(box.top,r.top));
  return{node:n,longitudinal,lateral,overlap};
 }).filter(v=>v.longitudinal>5);
 eligible.sort((a,b)=>{
  const pa=a.longitudinal+(a.overlap>0?0:a.lateral*2.2);
  const pb=b.longitudinal+(b.overlap>0?0:b.lateral*2.2);
  return pa-pb;
 });
 if(eligible.length){focusRemote(eligible[0].node,vertical);return;}
 if(vertical&&!fromSidebar){
  const shell=q('#playit-catalog .catalog-shell');
  if(shell) shell.scrollTop+=(direction==='down'?1:-1)*Math.max(220,shell.clientHeight*.68);
 }
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
 const remoteCode=event.keyCode||event.which||0;
 const dir=({37:'left',39:'right',38:'up',40:'down'})[remoteCode]||({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'})[event.key];
 if(dir&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){
   event.preventDefault();
   if(event.repeat&&Date.now()-lastRemoteMove<95)return;
   lastRemoteMove=Date.now();moveFocus(dir);return;
 }
 if((remoteCode===8||remoteCode===461||event.key==='Backspace'||event.key==='BrowserBack'||event.key==='Escape')&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
   event.preventDefault();
   if(q('#cine-dialog:not([hidden])')){q('#cine-dialog [data-cine-close]')?.click();return;}
   if(q('#playit-catalog')&&!q('#playit-catalog').hidden){(q('.tv-side-menu [data-tv-section="discover"]')||q('.tv-side-menu button'))?.focus();return;}
 }
 if((remoteCode===13||event.key==='Enter')&&document.activeElement?.tagName==='SUMMARY')document.activeElement.click();
},true);
document.addEventListener('focusin',event=>{if(shown(event.target)&&event.target.closest('.catalog-shell'))tvScroll(event.target);});
function init(){
 if(!q('#tv-mode-banner')){const mark=document.createElement('div');mark.id='tv-mode-banner';mark.textContent='PLAYIT · TV EDITION';document.body.append(mark);}
 const gate=q('#access-gate');if(gate)new MutationObserver(()=>launchCatalog()).observe(gate,{attributes:true,attributeFilter:['hidden','class','style']});
 q('#playit-catalog-open')?.addEventListener('click',()=>setTimeout(focusEntry,90));
 launchCatalog();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* Independent TV menu: actions reuse the existing PLAYIT 2 handlers. */
(function(){
'use strict';
var items=[
 ['discover','✦','Felfedezés'],
 ['streaming','▣','Streaming'],
 ['genres','◇','Műfajok'],
 ['dubbed','♫','Magyar szinkron'],
 ['search','⌕','Keresés'],
 ['lists','♡','Listáim'],
 ['home','⌂','PLAYIT főoldal']
];
function el(selector){return document.querySelector(selector);}
function visible(node){return node&&!node.hidden&&node.getClientRects().length>0;}
function highlight(key){document.querySelectorAll('.tv-menu-item').forEach(function(button){if(button.dataset.tvSection===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}
function jump(node){if(!node)return; if(node.matches('details')&&!node.open)node.open=true;
 var target=node.matches('button,input,summary')?node:node.querySelector('button:not([disabled]),input:not([disabled]),summary')||node;
 if(target){target.scrollIntoView({block:'center',inline:'nearest'});setTimeout(function(){target.focus();},40);}
}
function action(key){
 var dialog=el('#playit-catalog');
 if(!dialog||dialog.hidden)return;
 highlight(key);
 var shell=el('#playit-catalog .catalog-shell');
 if(key==='streaming'){jump(el('#playit-catalog .catalog-platforms'));return;}
 if(key==='genres'){var disclosure=el('#playit-catalog .catalog-genre-disclosure');if(disclosure)disclosure.open=true;jump(el('#catalog-genre-tiles'));return;}
 if(key==='dubbed'){jump(el('#catalog-hu-filter'));return;}
 if(key==='search'){jump(el('#catalog-query'));return;}
 if(key==='discover'){jump(el('.cine-hero')||el('#catalog-grid')||el('.catalog-tabs'));return;}
 if(key==='lists'||key==='home'){
   var nativeButton=el('#playit-catalog .catalog-bottom-nav [data-nav="'+key+'"]');
   if(nativeButton)nativeButton.click();
   if(key==='lists')setTimeout(function(){jump(el('#playit-catalog .cine-lists')||el('#playit-catalog .catalog-grid'));},100);
   else if(shell)shell.scrollTop=0;
 }
}
function mount(){
 var catalog=el('#playit-catalog');if(!catalog||el('.tv-side-menu'))return;
 var sidebar=document.createElement('nav');sidebar.className='tv-side-menu';sidebar.setAttribute('aria-label','PLAYIT TV menü');
 var brand=document.createElement('div');brand.className='tv-menu-brand';brand.innerHTML='PLAYIT <small>TV EDITION</small>';sidebar.appendChild(brand);
 items.forEach(function(item,i){
  if(i===4){var line=document.createElement('div');line.className='tv-menu-divider';sidebar.appendChild(line);}
  var button=document.createElement('button');button.type='button';button.className='tv-menu-item';button.dataset.tvSection=item[0];
  button.innerHTML='<span class="tv-menu-icon" aria-hidden="true">'+item[1]+'</span><span class="tv-menu-label">'+item[2]+'</span>';
  button.addEventListener('click',function(){action(item[0]);});sidebar.appendChild(button);
 });
 var help=document.createElement('p');help.className='tv-menu-help';help.innerHTML='<strong>Távirányító</strong><br>▲ ▼ ◄ ► navigáció<br>OK kiválasztás<br>Vissza: TV menü';sidebar.appendChild(help);
 catalog.insertBefore(sidebar,catalog.firstChild);
 highlight('discover');
}
document.addEventListener('keydown',function(e){
 if(e.key==='Menu'||e.key==='ContextMenu'||e.key==='F1'||e.keyCode===403){
   var first=el('.tv-side-menu .tv-menu-item');if(first&&visible(el('#playit-catalog'))){e.preventDefault();e.stopImmediatePropagation();first.focus();}
 }
},true);
var originalLaunch=el('#playit-catalog-open');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(mount,150);});
else setTimeout(mount,150);
var observer=new MutationObserver(function(){if(el('#playit-catalog')&&!el('.tv-side-menu'))mount();});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();
