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
 var t=e.touches[0];finger={rail:rail,x:t.clientX,y:t.clientY,left:rail.scrollLeft};
},{passive:true});
document.addEventListener('touchend',function(e){
 if(!finger)return;
 var touch=e.changedTouches&&e.changedTouches[0],start=finger;finger=null;
 if(!touch)return;
 var dx=touch.clientX-start.x,dy=touch.clientY-start.y;
 if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.25)return;
 var moved=Math.abs(start.rail.scrollLeft-start.left);
 if(moved<20)scrollByPage(start.rail,dx<0?1:-1);
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