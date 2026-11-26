/* PLAYIT 2 horizontal carousel controls and iOS touch fallback. */
(function(){
'use strict';
var rootSelector='#playit-catalog';
var railSelector='.cine-rail-scroll,.catalog-platforms,.catalog-tile-rail,.catalog-quick-filters,.cine-tools';
function railFrom(target){var rail=target&&target.closest&&target.closest(railSelector);return rail&&rail.closest(rootSelector)?rail:null;}
function scrollByPage(rail,dir){
 var amount=Math.max(rail.clientWidth*.82,180);
 var target=Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,rail.scrollLeft+dir*amount));
 try{rail.scrollTo({left:target,behavior:'smooth'});}catch(_){rail.scrollLeft=target;}
}
var finger=null;
document.addEventListener('touchstart',function(e){
 if(e.touches.length!==1){finger=null;return;}
 var rail=railFrom(e.target);
 if(!rail||rail.scrollWidth<=rail.clientWidth+4){finger=null;return;}
 var t=e.touches[0];finger={rail:rail,x:t.clientX,y:t.clientY,left:rail.scrollLeft,lastX:t.clientX,mode:''};
},{passive:true});
document.addEventListener('touchmove',function(e){
 if(!finger||e.touches.length!==1)return;
 var t=e.touches[0],dx=t.clientX-finger.x,dy=t.clientY-finger.y;
 if(!finger.mode&&Math.abs(dx)+Math.abs(dy)>12)finger.mode=Math.abs(dx)>Math.abs(dy)*1.2?'horizontal':'vertical';
 if(finger.mode!=='horizontal')return;
 if(e.cancelable)e.preventDefault();
 finger.rail.scrollLeft=finger.left-dx;
 finger.lastX=t.clientX;
},{passive:false});
document.addEventListener('touchend',function(e){
 if(!finger)return;
 if(finger.mode==='horizontal'){
  var rail=finger.rail,items=rail.querySelectorAll('.cine-mini-wrap,.catalog-tile-rail>button,.catalog-platforms>button');
  if(items.length){
   var first=items[0],second=items[1];
   var step=second?Math.abs(second.offsetLeft-first.offsetLeft):first.offsetWidth+12;
   if(step>30){var goal=Math.round(rail.scrollLeft/step)*step;try{rail.scrollTo({left:goal,behavior:'smooth'});}catch(_){rail.scrollLeft=goal;}}
  }
 }
 finger=null;
},{passive:true});
document.addEventListener('touchcancel',function(){finger=null;},{passive:true});
function addPager(rail){
 if(rail.dataset.playitPager==='1')return;
 var parent=rail.closest('.cine-rail');
 if(!parent||!rail.querySelector('.cine-mini-wrap'))return;
 rail.dataset.playitPager='1';
 var bar=document.createElement('div');bar.className='cine-rail-pager';bar.setAttribute('aria-label','Filmsor lapozása');
 [['prev','Előző filmek','‹',-1],['next','Következő filmek','›',1]].forEach(function(info){
  var b=document.createElement('button');b.type='button';b.className='cine-pager-'+info[0];b.setAttribute('aria-label',info[1]);b.textContent=info[2];
  b.addEventListener('click',function(){scrollByPage(rail,info[3]);});bar.appendChild(b);
 });
 var heading=parent.querySelector('h3');if(heading)heading.insertAdjacentElement('afterend',bar);
}
var scheduled=false;
function scan(){scheduled=false;document.querySelectorAll('#playit-catalog .cine-rail .cine-rail-scroll').forEach(addPager);}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(scan);}
document.addEventListener('playit:catalog-render',schedule);
var observer=new MutationObserver(function(records){
 if(records.some(function(r){return r.addedNodes.length>0&&r.target.closest&&r.target.closest('#playit-catalog');}))schedule();
});
observer.observe(document.documentElement,{childList:true,subtree:true});
schedule();
})();