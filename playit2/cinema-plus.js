/* PLAYIT 2 discovery extension. No changes to /maeste/. */
(() => {
  'use strict';
  const C = () => window.PLAYIT_CATALOG;
  const $ = (selector, base=document) => base.querySelector(selector);
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storageKey='playit2.cinema.personal.v1';
  const AUDIO_API='https://playit-hu-audio-proxy.turcsi.chatgpt.site';
  const serviceLabel={netflix:'Netflix',disney:'Disney+',hbo:'HBO Max',prime:'Prime Video',skyshowtime:'SkyShowtime',apple:'Apple TV+'};
  let comparison=null,comparisonPromise=null;
  let personal={watchlist:[],seen:[],progress:{},profiles:{mine:[],partner:[]},lastNotice:[]};
  try {const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object')personal={...personal,...saved};}catch{}
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(personal));}catch{}};
  const keyOf=item=>(item.media_type==='tv'?'tv':'movie')+':'+Number(item.id);
  const poster=item=>{const p=item?.poster_path||'';return /^https:\/\/[a-z0-9.-]+\//i.test(p)?p:/^\/[a-zA-Z0-9._/-]+$/.test(p)?'https://image.tmdb.org/t/p/w500'+p:''};
  const titleOf=item=>item?.title||item?.name||item?.original_title||item?.original_name||'Cím nélkül';
  const visibleItems=()=>C()?.getItems()||[];
  const checkedYes=item=>{
    const result=C()?.getAudio(keyOf(item));
    const chosen=C()?.getService();
    const providers=C()?.getState()?.selectedPlatforms||[];
    return result?.providers?.some(p=>p.audio==='yes'&&(!providers.length||providers.includes(p.service))&&(!chosen||p.service===chosen))||false;
  };
  const score=item=>Number(item.vote_average)||0;
  async function getComparison(){
    if(comparison&&Date.now()-comparison.at<21600000)return comparison.data;
    try{const saved=JSON.parse(sessionStorage.getItem('playit2.catalog.comparison.v1')||'null');if(saved&&Date.now()-saved.at<21600000){comparison=saved;return saved.data;}}catch{}
    if(comparisonPromise)return comparisonPromise;
    comparisonPromise=fetch(AUDIO_API+'/api/collection/status',{credentials:'omit'}).then(async r=>{if(!r.ok)throw Error('A mentett katalógus statisztikája nem elérhető.');const data=await r.json();comparison={at:Date.now(),data};try{sessionStorage.setItem('playit2.catalog.comparison.v1',JSON.stringify(comparison));}catch{}return data;}).finally(()=>{comparisonPromise=null});return comparisonPromise;
  }
  function rankedCandidates(){const state=C()?.getState();return visibleItems().filter(item=>checkedYes(item)&&score(item)>0&&(!state?.audioOnly||checkedYes(item))).sort((a,b)=>score(b)-score(a)||titleOf(a).localeCompare(titleOf(b),'hu')).slice(0,100);}
  function renderRanking(){const host=$('#cine-ranking');if(!host)return;const ranked=rankedCandidates();host.innerHTML='<div class="cine-panel-head"><h3>Magyar szinkronos TOP 100</h3><span>'+ranked.length+' / 100 cím</span></div><p class="cine-subtle">Értékelés szerint rendezett, igazolt magyar hangsávos címek a jelenleg betöltött találatokból. Nem teljes piaci toplista.</p><div class="cine-rail-scroll">'+(ranked.length?ranked.slice(0,100).map((item,i)=>card(item,i+1)).join(''):'<p class="cine-empty">Görgess a további címekért, vagy válassz másik szolgáltatót. Csak igazolt magyar hangsáv kerül ide.</p>')+'</div>';
  }
  function showWizard(){const modal=$('#cine-dialog');modal.innerHTML='<div class="cine-sheet cine-wizard"><button class="cine-x" data-cine-close aria-label="Bezárás">×</button><span class="cine-eyebrow">PLAYIT · MOZIASSZISZTENS</span><h2>Mit nézzek ma?</h2><p>Három gyors választás, utána személyes ajánlók az aktuális katalógusból.</p><form id="cine-wizard-form"><label>Hangulat<select name="mood"><option value="any">Bármi jöhet</option><option value="thrill">Izgalmas / pörgős</option><option value="light">Könnyed / vicces</option><option value="heart">Érzelmes</option><option value="mystery">Rejtélyes</option></select></label><label>Mennyi időd van?<select name="duration"><option value="any">Nincs időkorlát</option><option value="short">90 perc alatt</option><option value="normal">Legfeljebb 2 óra</option></select></label><label>Kivel nézed?<select name="company"><option value="solo">Egyedül</option><option value="pair">Párban</option></select></label><button type="submit">Mutasd az ajánlásokat</button></form><div id="cine-wizard-results"></div></div>';modal.hidden=false;}
  function wizardRecommendations(form){const data=new FormData(form);const mood=data.get('mood'),duration=data.get('duration'),pair=data.get('company')==='pair';const words={thrill:/akci|thrill|harc|menek|veszély|fight|war|crime/i,light:/víg|comedy|humor|nevet|szerelem|family|barát/i,heart:/dráma|drama|szerel|család|érzel|romance/i,mystery:/rejt|mystery|nyomoz|titok|detective|krimi/i};const favorites=visibleItems().filter(item=>personal.profiles.mine.includes(keyOf(item)));let candidates=visibleItems().filter(item=>!personal.seen.includes(keyOf(item)));const state=C()?.getState();if(state?.audioOnly)candidates=candidates.filter(checkedYes);const durationMinutes=item=>Number(item.runtime||item.duration||item.movie_runtime||0);if(duration!=='any')candidates=candidates.filter(item=>{const m=durationMinutes(item);return !m||m<=(duration==='short'?90:120)});const ranked=candidates.map(item=>{const txt=titleOf(item)+' '+(item.overview||'');let points=score(item)+matchScore(item,favorites)*12+(checkedYes(item)?2:0);if(words[mood]?.test(txt))points+=4;if(pair&&personal.profiles.partner.includes(keyOf(item)))points+=5;if(pair&&personal.profiles.mine.includes(keyOf(item)))points+=3;return {item,points};}).sort((a,b)=>b.points-a.points).slice(0,5);const target=$('#cine-wizard-results');target.innerHTML='<p class="cine-subtle">'+(duration==='any'?'':'Az időkorlát csak ismert játékidő esetén érvényesíthető. ')+(pair?'Közös kedvencek előnyben. ':'')+'A jelenleg betöltött katalógus alapján.</p>'+(ranked.length?ranked.map(({item})=>'<button type="button" data-cine-detail="'+esc(keyOf(item))+'">'+esc(titleOf(item))+' <span>'+ (checkedYes(item)?'✓ Magyar hang':'Hangsáv: nincs biztos adat')+'</span></button>').join(''):'<p>Nincs megfelelő cím a betöltött találatok között.</p>');}
  async function showComparison(){const modal=$('#cine-dialog');modal.innerHTML='<div class="cine-sheet cine-comparison"><button class="cine-x" data-cine-close aria-label="Bezárás">×</button><span class="cine-eyebrow">PLAYIT · ADATBÁZIS</span><h2>Streaming-összehasonlítás</h2><p id="cine-comparison-data">Mentett adatok betöltése…</p></div>';modal.hidden=false;try{const payload=await getComparison();if(modal.hidden||!modal.querySelector('#cine-comparison-data'))return;const totals=payload.totals||[];const services=Object.keys(serviceLabel);const rows=services.map(service=>{const entries=totals.filter(row=>row.service===service);const films=entries.find(row=>row.media_type==='movie');const series=entries.find(row=>row.media_type==='tv');return {service,films:Number(films?.titles)||0,series:Number(series?.titles)||0,dubbed:entries.reduce((n,row)=>n+(Number(row.dubbed)||0),0),complete:(payload.states||[]).filter(row=>row.service===service).every(row=>row.complete===1)};});const chosen=C()?.getState()?.selectedPlatforms||[];const filtered=chosen.length?rows.filter(row=>chosen.includes(row.service)):rows;$('#cine-comparison-data').outerHTML='<div class="cine-compare-rows">'+filtered.map(row=>'<div><strong>'+esc(serviceLabel[row.service])+'</strong><span>'+row.films.toLocaleString('hu-HU')+' film · '+row.series.toLocaleString('hu-HU')+' sorozat</span><small>'+row.dubbed.toLocaleString('hu-HU')+' igazolt magyar hangsávos címelőfordulás'+(row.complete?'':' · bővülő gyűjtés')+'</small></div>').join('')+'</div><p class="cine-subtle">Ezek a PLAYIT mentett szolgáltatói címelőfordulásai, nem a szolgáltatók teljes kínálatai. A nulla igazolt hangsáv nem jelenti a szinkron hiányát.</p>';}catch(e){const el=$('#cine-comparison-data');if(el)el.textContent=e.message||'Nem sikerült betölteni az összehasonlítást.';}}

  const terms=item=>new Set(String([titleOf(item),item.overview||''].join(' ')).toLocaleLowerCase('hu-HU').match(/[\p{L}]{4,}/gu)||[]);
  const matchScore=(item,favorites)=>{
    const words=terms(item);
    if(!words.size||!favorites.length)return 0;
    return Math.max(...favorites.map(f=>{const known=terms(f);let common=0;for(const w of words)if(known.has(w))common++;return common/Math.max(1,Math.sqrt(words.size*known.size));}));
  };
  let selectedItem=null;
  let currentView='home';
  function card(item,rank) {
    const k=keyOf(item),p=poster(item),year=(item.release_date||item.first_air_date||'').slice(0,4);
    return `<button type="button" class="cine-mini" data-cine-detail="${esc(k)}" aria-label="${esc(titleOf(item))} adatlapja"><span class="cine-mini-art">${p?`<img loading="lazy" decoding="async" src="${esc(p)}" alt="">`:'<span>PLAYIT</span>'}${rank?`<b>${rank}</b>`:''}</span><strong>${esc(titleOf(item))}</strong><small>${checkedYes(item)?'✓ HU hangsáv':year||'Film / sorozat'}</small></button>`;
  }
  function rail(title,items,ranked=false){return `<section class="cine-rail" aria-label="${esc(title)}"><h3>${esc(title)}</h3><div class="cine-rail-scroll">${items.length?items.slice(0,20).map((item,i)=>card(item,ranked?i+1:null)).join(''):'<p class="cine-empty">Ehhez a sorhoz még nincs elegendő ellenőrzött adat.</p>'}</div></section>`;}
  function renderHome() {
    const host=$('#cine-explore');if(!host)return;
    const all=visibleItems(),filters=C()?.getState();const items=filters?.audioOnly?all.filter(checkedYes):all;const picked=items.find(item=>poster(item))||items[0];
    const sorted=[...items].filter(item=>score(item)>0).sort((a,b)=>score(b)-score(a));
    const dubbed=sorted.filter(checkedYes);
    const favorites=items.filter(item=>personal.profiles.mine.includes(keyOf(item)));
    const recommendations=[...items].filter(item=>!personal.seen.includes(keyOf(item))&&!personal.profiles.mine.includes(keyOf(item))).sort((a,b)=>
      (matchScore(b,favorites)*10+score(b))-(matchScore(a,favorites)*10+score(a)));
    if(picked){const p=poster(picked);const hero=$('#cine-hero');hero.style.setProperty('--cine-hero-image',p?`url("${p.replace(/"/g,'%22')}")`:'none');
      hero.innerHTML=`<div class="cine-hero-shade"><span class="cine-eyebrow">✦ PLAYIT SPOTLIGHT</span><h2>${esc(titleOf(picked))}</h2><p>${esc(String(picked.overview||'Fedezd fel a filmet, a szolgáltatókat és az ellenőrzött hangsávot.').slice(0,165))}</p><div class="cine-hero-actions"><button type="button" data-cine-detail="${esc(keyOf(picked))}">Részletek</button><button type="button" data-cine-watch="${esc(keyOf(picked))}">♡ Listámra</button></div></div>`;
    } else $('#cine-hero').innerHTML='<div class="cine-hero-shade"><span class="cine-eyebrow">PLAYIT SPOTLIGHT</span><h2>Fedezd fel a következő filmed.</h2><p>Válassz szolgáltatót vagy műfajt, és megjelennek a filmek.</p></div>';
    const topLabel=dubbed.length?'Magyar szinkronos kedvencek':'Magyar szinkronos ajánlók';
    $('#cine-rails').innerHTML=rail(topLabel,dubbed,true)+rail(favorites.length?'Neked ajánljuk · kedvenceid leírása alapján':'Érdekelhet · az elérhető címek közül',recommendations)+rail('Felfedezés',items);
    $('#cine-stat').textContent='Az ajánlók a jelenleg betöltött címekből állnak össze.';
    renderRanking();
    const tracker=$('#cine-tracker');if(tracker&&!tracker.hidden)renderTracker();
  }
  function detail(item){
    selectedItem=item;const k=keyOf(item),data=C()?.getAudio(k),p=poster(item),providers=data?.providers||item.providers||[];
    const modal=$('#cine-dialog');
    modal.innerHTML=`<div class="cine-sheet" role="dialog" aria-modal="true" aria-label="${esc(titleOf(item))} adatlap"><button type="button" class="cine-x" data-cine-close aria-label="Bezárás">×</button><div class="cine-sheet-top">${p?`<img src="${esc(p)}" alt="${esc(titleOf(item))} plakát">`:''}<div><span class="cine-eyebrow">PLAYIT · FILMADATLAP</span><h2>${esc(titleOf(item))}</h2><p>${esc(String(item.overview||'Ehhez a címhez a mentett katalógus nem tartalmaz leírást.'))}</p><p>${score(item)?'★ '+score(item).toFixed(1)+' · ':''}${esc((item.release_date||item.first_air_date||'').slice(0,4))}</p></div></div><div class="cine-sheet-providers"><strong>Magyarországi hangsávadat</strong>${providers.length?providers.map(p=>`<p>${esc(p.service||'Szolgáltató')} · ${p.audio==='yes'?'✓ Magyar hang igazolva':p.audio==='no'?'Magyar hang nem jelzett':'Hangadat nem elérhető'}</p>`).join(''):'<p>Ehhez a címhez még nincs ellenőrzött szolgáltatói adat.</p>'}</div><div class="cine-sheet-actions"><button data-cine-watch="${esc(k)}">${personal.watchlist.includes(k)?'✓ Listámon':'♡ Listámra'}</button><button data-cine-seen="${esc(k)}">${personal.seen.includes(k)?'✓ Láttam':'Már láttam'}</button><button data-cine-like="${esc(k)}">${personal.profiles.mine.includes(k)?'♥ Kedvencem':'♡ Nekem tetszik'}</button><button data-cine-partner-like="${esc(k)}">${personal.profiles.partner.includes(k)?'♥ Párom kedvence':'♡ Páromnak tetszik'}</button>${item.media_type==='tv'?'<button data-cine-track="'+esc(k)+'">Évadkövetés</button>':''}</div></div>`;
    modal.hidden=false;
  }
  function findItem(k){return visibleItems().find(item=>keyOf(item)===k)||selectedItem&&keyOf(selectedItem)===k&&selectedItem;}
  function setMembership(name,k){const list=personal[name]||[];personal[name]=list.includes(k)?list.filter(v=>v!==k):[...list,k].slice(-500);save();}
  function renderTracker(){const el=$('#cine-tracker');if(!el)return;const records=Object.entries(personal.progress);el.innerHTML=`<div class="cine-panel"><div class="cine-panel-head"><h3>Évad- és epizódkövető</h3><button type="button" data-cine-tracker-close>×</button></div><p>Az évad- és epizódszámot te adod meg; automatikus epizódlista még nincs hozzárendelve.</p>${records.length?records.map(([k,v])=>`<div class="cine-progress"><strong>${esc(v.title||k)}</strong><span>${Number(v.season)||1}. évad · ${Number(v.episode)||1}. rész</span><button type="button" data-cine-progress="${esc(k)}" data-step="episode">+ 1 rész</button><button type="button" data-cine-progress="${esc(k)}" data-step="season">Új évad</button></div>`).join(''):'<p>Még nincs követett sorozat. Nyiss meg egy sorozat adatlapot!</p>'}</div>`;}
  function renderLists(){const el=$('#cine-tracker');if(!el)return;el.hidden=false;const ids=personal.watchlist;el.innerHTML=`<div class="cine-panel"><div class="cine-panel-head"><h3>PLAYIT figyelőlistám</h3><button type="button" data-cine-tracker-close>×</button></div><p>${ids.length} mentett cím · Az adatok ebben a böngészőben maradnak.</p>${ids.length?ids.map(k=>`<div class="cine-progress"><strong>${esc(findItem(k)?titleOf(findItem(k)):k)}</strong><button type="button" data-cine-remove="${esc(k)}">Eltávolítás</button></div>`).join(''):'<p>Az adatlapokon a Listámra gombbal menthetsz címeket.</p>'}</div>`;}
  function init(){
    const shell=$('#playit-catalog .catalog-shell');if(!shell||$('#cine-explore'))return;
    const host=document.createElement('section');host.id='cine-explore';host.className='cine-explore';
    host.innerHTML='<div id="cine-hero" class="cine-hero"></div><div class="cine-tools"><button data-cine-wizard>✦ Mit nézzek ma?</button><button data-cine-match>♥ PLAYIT MATCH</button><button data-cine-compare>▥ Szolgáltatók</button><button data-cine-lists>♡ Figyelőlistám</button><button data-cine-track-open>◈ Sorozatkövető</button></div><div id="cine-rails"></div><section id="cine-ranking" class="cine-ranking"></section><p id="cine-stat" class="cine-stat"></p><div id="cine-tracker" hidden></div>';
    const anchor=$('#playit-catalog .catalog-audio-control');
    if(anchor)anchor.after(host);else $('#playit-catalog .catalog-results-title')?.before(host);
    const modal=document.createElement('div');modal.id='cine-dialog';modal.className='cine-dialog';modal.hidden=true;document.body.append(modal);
    document.addEventListener('playit:catalog-render',()=>{if(!$('#playit-catalog')?.hidden)requestAnimationFrame(renderHome)});
    shell.addEventListener('click',event=>{
      const button=event.target.closest('[data-cine-detail],[data-cine-watch],[data-cine-pick],[data-cine-wizard],[data-cine-compare],[data-cine-match],[data-cine-lists],[data-cine-track-open],[data-cine-tracker-close],[data-cine-remove],[data-cine-progress]');if(!button)return;
      const k=button.dataset.cineDetail||button.dataset.cineWatch||button.dataset.cineRemove||button.dataset.cineProgress;
      if(button.dataset.cineDetail){const item=findItem(k);if(item)detail(item);}
      else if(button.dataset.cineWatch){setMembership('watchlist',k);renderHome();}
      else if(button.hasAttribute('data-cine-pick')){const items=visibleItems().filter(item=>!personal.seen.includes(keyOf(item)));const pool=items.filter(checkedYes);const list=pool.length?pool:items;const item=list[Math.floor(Math.random()*list.length)];if(item)detail(item);}
      else if(button.hasAttribute('data-cine-wizard'))showWizard();
      else if(button.hasAttribute('data-cine-compare'))showComparison();
      else if(button.hasAttribute('data-cine-match'))showMatch();
      else if(button.hasAttribute('data-cine-lists'))renderLists();
      else if(button.hasAttribute('data-cine-track-open')){const p=$('#cine-tracker');p.hidden=false;renderTracker();}
      else if(button.hasAttribute('data-cine-tracker-close'))$('#cine-tracker').hidden=true;
      else if(button.dataset.cineRemove){setMembership('watchlist',k);renderLists();}
      else if(button.dataset.cineProgress){const entry=personal.progress[k];if(!entry)return;if(button.dataset.step==='season'){entry.season++;entry.episode=1;}else entry.episode++;save();renderTracker();}
    });
    modal.addEventListener('submit',event=>{if(event.target.id==='cine-wizard-form'){event.preventDefault();wizardRecommendations(event.target);}});
    modal.addEventListener('click',event=>{
      if(event.target===modal||event.target.closest('[data-cine-close]')){modal.hidden=true;return;}
      const quick=event.target.closest('[data-cine-detail]');if(quick){const item=findItem(quick.dataset.cineDetail);if(item)detail(item);return;}
      const button=event.target.closest('[data-cine-watch],[data-cine-seen],[data-cine-like],[data-cine-track],[data-cine-partner],[data-cine-partner-like]');if(!button)return;
      const k=button.dataset.cineWatch||button.dataset.cineSeen||button.dataset.cineLike||button.dataset.cineTrack||button.dataset.cinePartner||button.dataset.cinePartnerLike;
      if(button.dataset.cineWatch)setMembership('watchlist',k);
      if(button.dataset.cineSeen)setMembership('seen',k);
      if(button.dataset.cineLike){const list=personal.profiles.mine;personal.profiles.mine=list.includes(k)?list.filter(v=>v!==k):[...list,k];save();}
      if(button.dataset.cinePartnerLike){const list=personal.profiles.partner;personal.profiles.partner=list.includes(k)?list.filter(v=>v!==k):[...list,k];save();}
      if(button.dataset.cinePartner){const list=personal.profiles.partner;personal.profiles.partner=list.includes(k)?list.filter(v=>v!==k):[...list,k];save();showMatch();return;}
      if(button.dataset.cineTrack){const item=findItem(k);personal.progress[k]||={title:titleOf(item),season:1,episode:1};save();modal.hidden=true;const t=$('#cine-tracker');t.hidden=false;renderTracker();t.scrollIntoView({block:'center'});return;}
      if(selectedItem)detail(selectedItem);renderHome();
    });
    const nav=$('#playit-catalog [data-nav="lists"]');nav?.addEventListener('click',event=>{event.stopImmediatePropagation();renderLists();$('#cine-tracker')?.scrollIntoView({block:'center',behavior:'smooth'});},true);
    if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
    renderHome();
  }
  function showMatch(){
    const items=visibleItems();const mine=new Set(personal.profiles.mine),partner=new Set(personal.profiles.partner);
    const shared=items.filter(item=>mine.has(keyOf(item))&&partner.has(keyOf(item)));
    const picks=shared.length?shared:items.filter(item=>mine.has(keyOf(item))||partner.has(keyOf(item)));
    const modal=$('#cine-dialog');modal.innerHTML=`<div class="cine-sheet cine-match"><button class="cine-x" data-cine-close aria-label="Bezárás">×</button><span class="cine-eyebrow">PLAYIT MATCH</span><h2>Közös moziest</h2><p>Jelöld ki mindkettőtök kedvenceit! A rendszer először a közös jelölésekből ajánl.</p><div class="cine-match-results">${picks.length?picks.slice(0,12).map(item=>`<button data-cine-partner="${esc(keyOf(item))}">${esc(titleOf(item))} ${partner.has(keyOf(item))?'♥':'♡'}</button>`).join(''):'<p>Először jelölj kedvenceket a filmadatlapokon; ezután itt párod is kiválaszthatja őket.</p>'}</div><p class="cine-stat">${shared.length} közös kedvenc a jelenleg betöltött címek között.</p></div>`;modal.hidden=false;
  }
  function mountWhenReady(){
    init();
    if($('#cine-explore'))return;
    const observer=new MutationObserver(()=>{
      init();
      if($('#cine-explore'))observer.disconnect();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('pageshow',()=>{if(!$('#cine-explore'))init();},{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountWhenReady,{once:true});else mountWhenReady();
})();
