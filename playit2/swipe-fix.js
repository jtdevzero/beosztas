/* PLAYIT 2 — deterministic carousel pagination for iOS, independent of scrollLeft. */
(function(){
 'use strict';
 const selectors='.catalog-platforms,.catalog-tile-rail,.catalog-quick-filters,.cine-tools';
 const rails=window.PLAYIT_RAILS={
  step(rail,direction){
   if(!rail||rail.children.length<2)return;
   const section=rail.closest('.cine-rail');
   const title=section?.getAttribute('aria-label')||'';
   const length=rail.children.length;
   const offsetMap=window.PLAYIT_RAIL_OFFSETS;
   if(offsetMap&&title)offsetMap.set(title,((offsetMap.get(title)||0)+direction+length)%length);
   rail.scrollLeft=0;
   if(direction>0)rail.appendChild(rail.firstElementChild);
   else rail.insertBefore(rail.lastElementChild,rail.firstElementChild);
   rail.scrollLeft=0;
  }
 };
 let drag=null,suppress=false,lastTurn=0;
 document.addEventListener('touchstart',event=>{
  if(event.touches.length!==1){drag=null;return;}
  const target=event.target.closest&&event.target.closest('.cine-rail-scroll,'+selectors);
  if(!target)return;
  const t=event.touches[0];
  drag={target,x:t.clientX,y:t.clientY,left:target.scrollLeft,axis:'',moved:false,rail:!!target.closest('.cine-rail')};
 },{passive:true});
 document.addEventListener('touchmove',event=>{
  if(!drag||event.touches.length!==1)return;
  const t=event.touches[0],dx=t.clientX-drag.x,dy=t.clientY-drag.y;
  if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8)drag.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';
  if(drag.axis!=='x')return;
  drag.moved=Math.abs(dx)>25;
  if(event.cancelable)event.preventDefault();
  if(!drag.rail)drag.target.scrollLeft=drag.left-dx;
 },{passive:false});
 document.addEventListener('touchend',event=>{
  if(!drag)return;
  const state=drag;drag=null;
  const t=event.changedTouches&&event.changedTouches[0];
  const dx=t?t.clientX-state.x:0,dy=t?t.clientY-state.y:0;
  if(Math.abs(dx)<38||Math.abs(dx)<Math.abs(dy)*1.2)return;
  suppress=true;setTimeout(()=>suppress=false,220);
  if(state.rail){rails.step(state.target,dx<0?1:-1);lastTurn=Date.now();}
 },{passive:true});
 document.addEventListener('touchcancel',()=>drag=null,{passive:true});
 document.addEventListener('click',event=>{
  if(suppress&&event.target.closest&&event.target.closest('.cine-rail-scroll')){event.preventDefault();event.stopImmediatePropagation();suppress=false;}
 },true);
 // Pointer Events complement touch events on iOS webviews and desktop touch emulation.
 let pointer=null;
 document.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'||!event.isPrimary)return;
  const rail=event.target.closest&&event.target.closest('.cine-rail-scroll');
  if(rail)pointer={rail,x:event.clientX,y:event.clientY};
 },{passive:true});
 document.addEventListener('pointerup',event=>{
  if(!pointer)return;
  const state=pointer;pointer=null;
  const dx=event.clientX-state.x,dy=event.clientY-state.y;
  if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(dy)*1.2||Date.now()-lastTurn<300)return;
  rails.step(state.rail,dx<0?1:-1);lastTurn=Date.now();
 },{passive:true});
 document.addEventListener('pointercancel',()=>{pointer=null;},{passive:true});

})();
