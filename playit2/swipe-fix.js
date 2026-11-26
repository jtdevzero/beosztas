/* PLAYIT 2 — delegated touch dragging for rails in iOS WebKit. */
(function(){
 'use strict';
 const selector='#playit-catalog .cine-rail-scroll,#playit-catalog #cine-ranking .cine-rail-scroll,#playit-catalog .catalog-platforms,#playit-catalog .catalog-tile-rail,#playit-catalog .catalog-quick-filters,#playit-catalog .cine-tools';
 let drag=null,suppress=false;
 document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1){drag=null;return;}
  const rail=e.target.closest&&e.target.closest(selector);
  if(!rail||rail.scrollWidth<=rail.clientWidth+2){drag=null;return;}
  const t=e.touches[0];drag={rail,x:t.clientX,y:t.clientY,left:rail.scrollLeft,axis:null,moved:false};
 },{passive:true});
 document.addEventListener('touchmove',e=>{
  if(!drag||e.touches.length!==1)return;
  const t=e.touches[0],dx=t.clientX-drag.x,dy=t.clientY-drag.y;
  if(!drag.axis&&Math.max(Math.abs(dx),Math.abs(dy))>7)drag.axis=Math.abs(dx)>Math.abs(dy)*1.12?'horizontal':'vertical';
  if(drag.axis!=='horizontal')return;
  drag.moved=drag.moved||Math.abs(dx)>12;
  if(e.cancelable)e.preventDefault();
  drag.rail.scrollLeft=drag.left-dx;
 },{passive:false});
 document.addEventListener('touchend',e=>{
  if(!drag)return;
  const state=drag;drag=null;
  if(state.axis==='horizontal'&&state.moved){
   suppress=true;
   setTimeout(()=>{suppress=false;},180);
   const t=e.changedTouches&&e.changedTouches[0],dx=t?t.clientX-state.x:0;
   const max=Math.max(0,state.rail.scrollWidth-state.rail.clientWidth);
   state.rail.scrollLeft=Math.max(0,Math.min(max,state.left-dx));
  }
 },{passive:true});
 document.addEventListener('touchcancel',()=>{drag=null;},{passive:true});
 document.addEventListener('click',e=>{if(suppress&&e.target.closest&&e.target.closest(selector)){e.preventDefault();e.stopImmediatePropagation();suppress=false;}},true);
 // Focusable carousel paging is created by the cinema module itself.
})();
