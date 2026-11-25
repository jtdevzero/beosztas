/* PLAYIT 2 catalog: uses the existing authenticated, server-side film API. */
(() => {
  'use strict';
  const API = document.querySelector('meta[name="maeste-api-origin"]')?.content || location.origin;
  const AUDIO_API = 'https://playit-hu-audio-proxy.turcsi.chatgpt.site';
  const audioData = new Map();
  const audioStorage='playit2.audio-results.v1';
  try { const saved=JSON.parse(localStorage.getItem(audioStorage)||'{}');for(const [k,v] of Object.entries(saved)) if(v?.checkedAt&&Date.now()-Date.parse(v.checkedAt)<86400000)audioData.set(k,v); } catch {}
  const audioPending = new Set();
  const serviceNames = {netflix:'Netflix',disney:'Disney+',hbo:'HBO Max',prime:'Prime Video',apple:'Apple TV+',skyshowtime:'SkyShowtime',mubi:'MUBI',crunchyroll:'Crunchyroll',curiosity:'Curiosity Stream',zee5:'ZEE5'};
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const image = path => typeof path === 'string' && /^\/[A-Za-z0-9._/-]+$/.test(path) ? 'https://image.tmdb.org/t/p/w342' + path : '';
  const keyOf = item => (item.media_type === 'tv' ? 'tv' : 'movie') + ':' + Number(item.id);
  const dubStorage = 'playit2.dub-review.v1';
  const readReviews = () => { try { const saved = JSON.parse(localStorage.getItem(dubStorage)); return saved && typeof saved === 'object' ? saved : {}; } catch { return {}; } };
  const reviews = readReviews();
  const state = { type:'movie', providers:[], genres:[], provider:'', genre:'', query:'', page:1, nextPage:2, hasMore:false, items:[], busy:false, serial:0, confirmedOnly:false, audioOnly:false, error:'' };
  let dialog, previousFocus, currentController;
  async function api(path, signal) {
    let token = ''; let profile = '';
    try { token = sessionStorage.getItem('maeste.access') || ''; profile = JSON.parse(localStorage.getItem('maeste.profile') || 'null') || ''; } catch {}
    if (!token) throw new Error('A böngésző használatához először jelentkezz be.');
    const response = await fetch(new URL(path, API), {
      signal, credentials:'omit', headers:{'X-Maeste-Access':token,'X-Maeste-Profile':profile}
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'Nem sikerült lekérni a filmeket.');
    return data;
  }
  const options = (items, label, name, id) => '<option value="">'+label+'</option>' + items.map(item => '<option value="'+Number(item[id])+'">'+escape(item[name])+'</option>').join('');
  function build() {
    const launcher = document.createElement('button');
    launcher.id = 'playit-catalog-open'; launcher.type = 'button';
    launcher.setAttribute('aria-label','Filmes és sorozatos katalógus megnyitása');
    launcher.setAttribute('title','Filmkatalógus');
    launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
    $('#search-open')?.after(launcher);
    const filterHeader = document.querySelector('#filters-panel .mobile-panel-head');
    if (filterHeader && !document.getElementById('playit-catalog-menu')) {
      const menuButton = document.createElement('button');
      menuButton.id = 'playit-catalog-menu';
      menuButton.type = 'button';
      menuButton.textContent = '🎬 Film- és sorozatkatalógus megnyitása';
      filterHeader.after(menuButton);
      menuButton.addEventListener('click', open);
    }
    dialog = document.createElement('div');
    dialog.id='playit-catalog'; dialog.hidden=true;
    dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','PLAYIT katalógus');
    dialog.innerHTML = `
      <div class="catalog-shell" tabindex="-1">
        <header class="catalog-heading"><div class="catalog-heading-copy"><small><span class="catalog-spark">✦</span> PLAYIT 2 / THE CINEMA EDITION</small><h2>Fedezd fel<span>.</span></h2><p>Filmek és sorozatok, amelyekért érdemes ma este leülni.</p></div>
          <button type="button" class="catalog-close" aria-label="Katalógus bezárása">×</button></header>
        <div class="catalog-highlight"><span class="catalog-highlight-orb">✦</span><span><strong>A TE MOZIVILÁGOD</strong><small>Válogass, fedezd fel a szolgáltatókat és ellenőrizd a magyar hangsávot.</small></span><span class="catalog-highlight-mark">PLAYIT<span>®</span></span></div>
        <div class="catalog-section-title"><span>01 / KOLLEKCIÓ</span><i></i><small>Mit néznél ma?</small></div>
        <div class="catalog-tabs" role="group" aria-label="Tartalomtípus">
          <button type="button" data-catalog-type="movie" aria-pressed="true">Filmek</button>
          <button type="button" data-catalog-type="tv" aria-pressed="false">Sorozatok</button>
        </div>
        <form class="catalog-search">
          <label class="sr-only" for="catalog-query">Film vagy sorozat keresése</label>
          <input id="catalog-query" type="search" placeholder="Keress címre…" maxlength="100" autocomplete="off">
          <button type="submit">Keresés</button>
        </form>
        <div class="catalog-filter-label">FINOMHANGOLÁS <span>✦</span></div>
        <div class="catalog-filters">
          <label>Streaming<select id="catalog-provider"><option value="">Minden szolgáltató</option></select></label>
          <label>Műfaj<select id="catalog-genre"><option value="">Minden műfaj</option></select></label>
        </div>
        <div class="catalog-audio-control" id="catalog-audio-control"><div class="catalog-audio-control-copy"><span class="catalog-audio-control-icon">♫</span><div><strong>Csak magyar szinkron</strong><small>Szolgáltatónként ellenőrzött hangsáv</small></div></div><label class="catalog-switch"><input id="catalog-hu-filter" type="checkbox" aria-label="Csak magyar szinkronos címek"><span class="catalog-switch-track"></span></label></div>
        <div id="catalog-audio-progress" class="catalog-audio-progress" aria-live="polite">Kapcsold be a magyar szinkron szűrőt az ellenőrzéshez.</div>
        <button type="button" id="catalog-check-more" hidden>+ További 8 cím ellenőrzése</button>
        <details class="catalog-manual-filter"><summary>Saját szinkronjelölések</summary><label class="catalog-dub-filter"><input id="catalog-confirmed" type="checkbox"> Csak általam igazolt címek</label></details>
        <p class="catalog-note">A „Hangsávok ellenőrzése” gomb élő magyarországi streamingadatot kér le. A szolgáltatók nem minden címnél adnak teljes nyelvi adatot; az ilyen eredmény „Nincs adat”. Saját jelöléseid külön megmaradnak.</p>
        <div class="catalog-section-title catalog-results-title"><span>02 / TALÁLATOK</span><i></i><small>Fedezd fel a következő kedvenced</small></div>
        <div id="catalog-status" role="status" aria-live="polite"></div>
        <div id="catalog-grid" class="catalog-grid"></div>
        <button type="button" id="catalog-more" hidden>További találatok</button>
        <div id="catalog-scroll-sentinel" class="catalog-scroll-sentinel" aria-hidden="true"></div>
        <footer class="catalog-footer">
          <button type="button" id="catalog-original-search">Részletes címkereső megnyitása</button>
          <a href="https://www.netflix.com/browse/audio" target="_blank" rel="noopener noreferrer">Netflix hangsáv szerinti böngészés ↗</a>
        </footer>
      </div>`;
    document.body.append(dialog);
    launcher.addEventListener('click',open);
    dialog.querySelector('.catalog-close').addEventListener('click',close);
    dialog.addEventListener('click',event => { if (event.target === dialog) close(); });
    document.addEventListener('keydown',event => { if (!dialog.hidden && event.key === 'Escape') {event.preventDefault();close();} });
    dialog.querySelectorAll('[data-catalog-type]').forEach(button => button.addEventListener('click',() => setType(button.dataset.catalogType)));
    dialog.querySelector('.catalog-search').addEventListener('submit',event => {
      event.preventDefault();
      const value=$('#catalog-query').value.trim();
      if(state.provider.startsWith('collection:')&&value){state.error='Mentett gyűjteményben egyelőre a szolgáltató szerinti böngészés érhető el. Címkereséshez válaszd a Minden szolgáltatót.';render();return;}
      if(value.length===1) {state.error='A kereséshez legalább két karakter szükséges.';render();return;}
      state.query=value;load(false);
    });
    $('#catalog-provider').addEventListener('change',event => {state.provider=event.target.value;state.query='';$('#catalog-query').value='';load(false);});
    $('#catalog-genre').addEventListener('change',event => {state.genre=event.target.value;state.query='';$('#catalog-query').value='';load(false);});
    $('#catalog-confirmed').addEventListener('change',event => {state.confirmedOnly=event.target.checked;render();});
    $('#catalog-hu-filter').addEventListener('change',event => {state.audioOnly=event.target.checked;if(state.provider.startsWith('collection:'))load(false);else{render();if(state.audioOnly)checkNextAudioBatch();}});
    $('#catalog-check-more').addEventListener('click',checkNextAudioBatch);
    $('#catalog-more').addEventListener('click',() => load(true));
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting) && !dialog.hidden && !state.busy && state.hasMore) load(true);
      }, { root: null, rootMargin:'800px 0px', threshold:0 });
      observer.observe($('#catalog-scroll-sentinel'));
    }
    $('#catalog-original-search').addEventListener('click',() => {close();$('#search-open')?.click();});
    $('#catalog-grid').addEventListener('click',event => {
      const review = event.target.closest('[data-dub]');
      if (review) {
        const key = review.dataset.dub, status = review.dataset.status;
        if (!/^(hu|no|unknown)$/.test(status)) return;
        if (status === 'unknown') delete reviews[key];
        else reviews[key]={status,checkedAt:new Date().toISOString()};
        try {localStorage.setItem(dubStorage,JSON.stringify(reviews));} catch {}
        render(); return;
      }
      const audioButton = event.target.closest('[data-audio-check]');
      if (audioButton) { checkAudio(audioButton.dataset.audioCheck); return; }
      const details = event.target.closest('[data-catalog-details]');
      if (details) {
        const key = details.dataset.catalogDetails;
        close();
        // The original app's delegated click handler opens its existing detail modal.
        const button = document.createElement('button');
        button.dataset.details=key;
        button.hidden=true;document.body.append(button);
        button.click();button.remove();
      }
    });
  }
  function open() {
    if (!dialog) return;
    previousFocus=document.activeElement;dialog.hidden=false;
    document.body.classList.add('catalog-open');
    dialog.querySelector('.catalog-shell').focus({preventScroll:true});
    if (!state.items.length) setType(state.type);
  }
  function close() {
    if (!dialog) return;
    dialog.hidden=true;document.body.classList.remove('catalog-open');
    previousFocus?.focus?.({preventScroll:true});
  }
  async function setType(type) {
    state.type=type==='tv'?'tv':'movie';
    state.genre='';state.provider='';state.query='';$('#catalog-query').value='';
    dialog.querySelectorAll('[data-catalog-type]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.catalogType===state.type)));
    $('#catalog-provider').innerHTML='<option value="">Minden szolgáltató</option>';
    $('#catalog-genre').innerHTML='<option value="">Minden műfaj</option>';
    try {
      const config=await api('/api/config?mediaType='+state.type);
      if (state.type!==type) return;
      state.providers=config.providers||[];state.genres=config.genres||[];
      $('#catalog-provider').innerHTML=options(state.providers,'Minden szolgáltató','provider_name','provider_id')+'<optgroup label="Mentett magyar hangsáv-adatbázis"><option value="collection:disney">Disney+ · mentett gyűjtemény</option><option value="collection:skyshowtime">SkyShowtime · mentett gyűjtemény</option><option value="collection:prime">Prime Video · mentett gyűjtemény</option><option value="collection:netflix">Netflix · népszerű címek</option></optgroup>';
      $('#catalog-genre').innerHTML=options(state.genres,'Minden műfaj','name','id');
    } catch(error){state.error=error.message;}
    if(state.type!==type)return;
    await load(false);
  }
  async function load(more) {
    if (!dialog || dialog.hidden) return;
    currentController?.abort();
    currentController=new AbortController();
    const serial=++state.serial;
    const page=more?state.nextPage:1;
    if (!more) {state.page=1;state.items=[];}
    state.error='';state.busy=true;render();
    try {
      let url;
      if (state.query.length>=2) {
        url='/api/search?'+new URLSearchParams({query:state.query,mediaType:state.type,page:String(page)});
      } else {
        const params=new URLSearchParams({mediaType:state.type,page:String(page),rating:'0'});
        if(state.provider)params.set('providers',state.provider);
        if(state.genre)params.set('genres',state.genre);
        url='/api/discover?'+params;
      }
      let result;
      if (state.provider.startsWith('collection:') && !state.query) {
        const service=state.provider.split(':')[1];
        const response=await fetch(AUDIO_API+'/api/collection/titles?'+new URLSearchParams({service,type:state.type,page:String(page),dubbed:String(state.audioOnly)}),{signal:currentController.signal});
        const payload=await response.json();
        if(!response.ok)throw new Error(payload.error||'A mentett gyűjtemény nem elérhető.');
        result={results:(payload.items||[]).map(item=>({id:item.tmdb_id,media_type:state.type,title:item.title,release_date:item.release_year?item.release_year+'-01-01':'',poster_path:item.poster_url,providers:item.providers})),hasMore:payload.hasMore,nextPage:page+1};
      } else result=await api(url,currentController.signal);
      if(serial!==state.serial)return;
      const ids=new Set(state.items.map(keyOf));
      for (const item of result.results||[]) {
        const record={...item,media_type:state.type};
        if(!ids.has(keyOf(record))) {state.items.push(record);ids.add(keyOf(record));}
      }
      state.page=page;state.nextPage=Number(result.nextPage)||page+1;
      state.hasMore=typeof result.hasMore==='boolean'?result.hasMore:page<(result.total_pages||1);
    } catch(error) {
      if(serial!==state.serial||error.name==='AbortError')return;
      state.error=error.message;
    } finally {if(serial===state.serial){state.busy=false;render();hydrateCachedResults(state.items,state.type,serial).finally(()=>{if(serial===state.serial&&state.audioOnly)checkNextAudioBatch();});}}
  }
  async function checkAudio(key) {
    if (!/^(movie|tv):\d{1,9}$/.test(key) || audioPending.has(key)) return;
    const existing = audioData.get(key);
    if (existing?.checkedAt && Date.now() - new Date(existing.checkedAt).getTime() < 86400000) return;
    audioPending.add(key);render();
    try {
      const [type, id] = key.split(':');
      const response = await fetch(`${AUDIO_API}/api/audio?` + new URLSearchParams({ type, id }), { credentials:'omit' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'A hangsávadat nem elérhető.');
      audioData.set(key, result);
      try {localStorage.setItem(audioStorage,JSON.stringify(Object.fromEntries([...audioData].filter(([,v])=>v?.checkedAt).slice(-120))));} catch {}
    } catch (error) { audioData.set(key, { error: error.message || 'Sikertelen ellenőrzés.' }); }
    finally { audioPending.delete(key);render(); }
  }
  function selectedService() {
    if (state.provider.startsWith('collection:')) return state.provider.slice(11);
    if (!state.provider) return '';
    const name=String(state.providers.find(p=>String(p.provider_id)===state.provider)?.provider_name||'').toLowerCase();
    if(name.includes('netflix'))return 'netflix';
    if(name.includes('disney'))return 'disney';
    if(name.includes('hbo')||name.includes('max'))return 'hbo';
    if(name.includes('prime')||name.includes('amazon'))return 'prime';
    if(name.includes('apple'))return 'apple';
    if(name.includes('skyshowtime'))return 'skyshowtime';
    if(name.includes('mubi'))return 'mubi';
    return '';
  }
  function hasHungarianAudio(item) {
    const result=audioData.get(keyOf(item));
    const service=selectedService();
    return Array.isArray(result?.providers)&&result.providers.some(p=>p.audio==='yes'&&(!service||p.service===service));
  }
  let batchRunning=false;
  async function checkNextAudioBatch() {
    if(batchRunning||!state.audioOnly||!state.items.length)return;
    const pending=state.items.filter(item=>!audioData.get(keyOf(item))?.checkedAt).slice(0,8);
    if(!pending.length){render();return;}
    batchRunning=true;render();
    try {
      for(let i=0;i<pending.length;i+=2)
        await Promise.all(pending.slice(i,i+2).map(item=>checkAudio(keyOf(item))));
    } finally {batchRunning=false;render();}
  }
  async function hydrateCachedResults(items,type,serial) {
    const ids=items.filter(item=>item.media_type===type).map(item=>Number(item.id)).filter(Number.isInteger).slice(-20);
    if(!ids.length)return;
    try {
      const response=await fetch(AUDIO_API+'/api/audio/cache?'+new URLSearchParams({type,ids:ids.join(',')}),{credentials:'omit'});
      if(!response.ok)return;
      const data=await response.json();
      if(serial!==state.serial)return;
      for(const item of data.items||[]) {
        if(item?.checkedAt&&item.mediaType===type&&Number.isInteger(item.id))
          audioData.set(type+':'+item.id,item);
      }
      try {localStorage.setItem(audioStorage,JSON.stringify(Object.fromEntries([...audioData].filter(([,v])=>v?.checkedAt).slice(-120))));} catch {}
      render();
    } catch { /* Cached badges should never block discovery. */ }
  }
  function audioMarkup(key) {
    const result = audioData.get(key);
    if (!result) return '<div class="catalog-audio-hint">Szolgáltatónkénti magyar hangsávadat</div>';
    if (result.error) return '<div class="catalog-audio-hint catalog-audio-error">'+escape(result.error)+'</div>';
    if (!result.providers?.length) return '<div class="catalog-audio-hint">Ehhez a címhez nincs ellenőrzött előfizetéses magyarországi adat.</div>';
    return '<div class="catalog-audio-list">' + result.providers.map(p => {
      const sound = p.audio==='yes'?'✓ HU hang':p.audio==='no'?'Nincs HU hangadat':'Hang: nincs adat';
      const subs = p.subtitles==='yes'?'✓ HU felirat':p.subtitles==='no'?'Nincs HU feliratadat':'Felirat: nincs adat';
      const name = escape(serviceNames[p.service] || p.service);
      const link = /^https:\/\/[a-z0-9.-]+\//i.test(p.link || '') ? '<a href="'+escape(p.link)+'" target="_blank" rel="noopener noreferrer">Megnyitás</a>' : '';
      return '<div class="catalog-audio-provider"><strong>'+name+'</strong><span class="'+(p.audio==='yes'?'audio-yes':'')+'">'+sound+'</span><span>'+subs+'</span>'+link+'</div>';
    }).join('') + '</div><div class="catalog-audio-source">Streaming Availability API · '+escape(new Date(result.checkedAt).toLocaleDateString('hu-HU'))+'</div>';
  }
  function render() {
    const grid=$('#catalog-grid'), status=$('#catalog-status'), more=$('#catalog-more');
    if(!grid)return;
    const manualItems=state.confirmedOnly?state.items.filter(item=>reviews[keyOf(item)]?.status==='hu'):state.items;
    const items=state.audioOnly?manualItems.filter(hasHungarianAudio):manualItems;
    const checked=state.items.filter(item=>audioData.get(keyOf(item))?.checkedAt).length;
    const loading=state.items.filter(item=>audioPending.has(keyOf(item))).length;
    const progress=$('#catalog-audio-progress'),checkMore=$('#catalog-check-more'),audioControl=$('#catalog-audio-control');
    if(audioControl)audioControl.classList.toggle('is-active',state.audioOnly);
    if(progress)progress.textContent=state.audioOnly?'Ellenőrzött: '+checked+'/'+state.items.length+' cím · '+(loading||batchRunning?'Lekérdezés folyamatban…':items.length+' magyar szinkronos találat'):'Kapcsold be a magyar szinkron szűrőt az ellenőrzéshez.';
    if(checkMore){checkMore.hidden=!state.audioOnly||batchRunning||checked+loading>=state.items.length;checkMore.disabled=batchRunning;}
    grid.innerHTML=items.map(item=>{
      const key=keyOf(item),review=reviews[key],poster=image(item.poster_path)||(/^(https:\/\/)[a-z0-9.-]+\/[^"'<> ]+$/i.test(item.poster_path||'')?item.poster_path:'');
      const title=escape(item.title||item.name||item.original_title||item.original_name||'Cím nélkül');
      const year=String(item.release_date||item.first_air_date||'').slice(0,4);
      const score=Number(item.vote_average);
      const status=review?.status==='hu'?'✓ Magyar szinkron — saját ellenőrzés':review?.status==='no'?'Nem találtam magyar szinkront':'Magyar szinkron: nem ellenőrzött';
      return `<article class="catalog-card">
        <div class="catalog-art">${poster?'<img loading="lazy" decoding="async" src="'+poster+'" alt="">':'<div class="catalog-no-poster">PLAYIT</div>'}
          <span class="catalog-rating">${score>0?'★ '+score.toFixed(1):'FILM'}</span></div>
        <div class="catalog-card-copy"><div class="catalog-card-kind">${state.type==='tv'?'SOROZAT':'FILM'} <span>✦</span> ${year?escape(year):'PLAYIT'}</div><h3>${title}</h3>
          <div class="catalog-dub-badge ${review?.status||'unknown'}">${status}</div>
          <details class="catalog-review-drawer"><summary>Saját szinkronjelölés <span>+</span></summary><div class="catalog-review" role="group" aria-label="Magyar szinkron saját ellenőrzése">
            <button type="button" data-dub="${key}" data-status="hu" aria-label="Magyar szinkron igazolása">✓ Van</button>
            <button type="button" data-dub="${key}" data-status="no" aria-label="Magyar szinkron hiányának jelölése">Nincs</button>
            <button type="button" data-dub="${key}" data-status="unknown" aria-label="Ellenőrzés visszavonása">?</button>
          </div></details>
          <button type="button" class="catalog-audio-button" data-audio-check="${key}" ${audioPending.has(key)?'disabled':''}>${audioPending.has(key)?'Hangsávok lekérdezése…':audioData.get(key)?.providers?'↻ Hangsávadatok':'♪ Hangsávok ellenőrzése'}</button>
          ${audioMarkup(key)}
          <button type="button" class="catalog-details" data-catalog-details="${key}">Adatlap és elérhetőség →</button>
        </div></article>`;
    }).join('');
    if(state.audioOnly) {
      status.textContent=state.error||(state.busy?'Filmek betöltése…':items.length?items.length+' igazolt magyar szinkronos találat':checked<state.items.length?'További filmek ellenőrzésére van szükség.':'A most ellenőrzött filmek között nincs igazolt magyar szinkronos találat.');
    } else {
      status.textContent=state.error||(state.busy?'Filmek betöltése…':items.length?items.length+' találat a katalógusban':state.confirmedOnly?'Még nincs általad igazolt cím.':'Nincs találat. Próbálj másik szűrőt.');
    }
    more.hidden=('IntersectionObserver' in window)||!state.hasMore||state.busy;
    more.disabled=state.busy;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
})();
