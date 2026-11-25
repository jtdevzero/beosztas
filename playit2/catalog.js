/* PLAYIT 2 catalog: uses the existing authenticated, server-side film API. */
(() => {
  'use strict';
  const API = document.querySelector('meta[name="maeste-api-origin"]')?.content || location.origin;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const image = path => typeof path === 'string' && /^\/[A-Za-z0-9._/-]+$/.test(path) ? 'https://image.tmdb.org/t/p/w342' + path : '';
  const keyOf = item => (item.media_type === 'tv' ? 'tv' : 'movie') + ':' + Number(item.id);
  const dubStorage = 'playit2.dub-review.v1';
  const readReviews = () => { try { const saved = JSON.parse(localStorage.getItem(dubStorage)); return saved && typeof saved === 'object' ? saved : {}; } catch { return {}; } };
  const reviews = readReviews();
  const state = { type:'movie', providers:[], genres:[], provider:'', genre:'', query:'', page:1, nextPage:2, hasMore:false, items:[], busy:false, serial:0, confirmedOnly:false, error:'' };
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
    dialog = document.createElement('div');
    dialog.id='playit-catalog'; dialog.hidden=true;
    dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','PLAYIT katalógus');
    dialog.innerHTML = `
      <div class="catalog-shell" tabindex="-1">
        <header class="catalog-heading"><div><small>PLAYIT 2 · CINEMA LIBRARY</small><h2>Katalógus<span>.</span></h2></div>
          <button type="button" class="catalog-close" aria-label="Katalógus bezárása">×</button></header>
        <div class="catalog-tabs" role="group" aria-label="Tartalomtípus">
          <button type="button" data-catalog-type="movie" aria-pressed="true">Filmek</button>
          <button type="button" data-catalog-type="tv" aria-pressed="false">Sorozatok</button>
        </div>
        <form class="catalog-search">
          <label class="sr-only" for="catalog-query">Film vagy sorozat keresése</label>
          <input id="catalog-query" type="search" placeholder="Keress címre…" maxlength="100" autocomplete="off">
          <button type="submit">Keresés</button>
        </form>
        <div class="catalog-filters">
          <label>Streaming<select id="catalog-provider"><option value="">Minden szolgáltató</option></select></label>
          <label>Műfaj<select id="catalog-genre"><option value="">Minden műfaj</option></select></label>
        </div>
        <label class="catalog-dub-filter"><input id="catalog-confirmed" type="checkbox"> Csak általam igazolt magyar szinkronos címek</label>
        <p class="catalog-note">A szolgáltató és a magyar hangsáv elérhetősége változhat. A szinkront csak saját ellenőrzés után jelöljük.</p>
        <div id="catalog-status" role="status" aria-live="polite"></div>
        <div id="catalog-grid" class="catalog-grid"></div>
        <button type="button" id="catalog-more" hidden>További találatok</button>
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
      if(value.length===1) {state.error='A kereséshez legalább két karakter szükséges.';render();return;}
      state.query=value;load(false);
    });
    $('#catalog-provider').addEventListener('change',event => {state.provider=event.target.value;state.query='';$('#catalog-query').value='';load(false);});
    $('#catalog-genre').addEventListener('change',event => {state.genre=event.target.value;state.query='';$('#catalog-query').value='';load(false);});
    $('#catalog-confirmed').addEventListener('change',event => {state.confirmedOnly=event.target.checked;render();});
    $('#catalog-more').addEventListener('click',() => load(true));
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
      $('#catalog-provider').innerHTML=options(state.providers,'Minden szolgáltató','provider_name','provider_id');
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
      const result=await api(url,currentController.signal);
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
    } finally {if(serial===state.serial){state.busy=false;render();}}
  }
  function render() {
    const grid=$('#catalog-grid'), status=$('#catalog-status'), more=$('#catalog-more');
    if(!grid)return;
    const items=state.confirmedOnly?state.items.filter(item=>reviews[keyOf(item)]?.status==='hu'):state.items;
    grid.innerHTML=items.map(item=>{
      const key=keyOf(item),review=reviews[key],poster=image(item.poster_path);
      const title=escape(item.title||item.name||item.original_title||item.original_name||'Cím nélkül');
      const year=String(item.release_date||item.first_air_date||'').slice(0,4);
      const score=Number(item.vote_average);
      const status=review?.status==='hu'?'✓ Magyar szinkron — saját ellenőrzés':review?.status==='no'?'Nem találtam magyar szinkront':'Magyar szinkron: nem ellenőrzött';
      return `<article class="catalog-card">
        <div class="catalog-art">${poster?'<img loading="lazy" decoding="async" src="'+poster+'" alt="">':'<div class="catalog-no-poster">PLAYIT</div>'}
          <span class="catalog-rating">${score>0?'★ '+score.toFixed(1):'FILM'}</span></div>
        <div class="catalog-card-copy"><h3>${title}</h3><p>${year?escape(year)+' · ':''}${state.type==='tv'?'Sorozat':'Film'}</p>
          <div class="catalog-dub-badge ${review?.status||'unknown'}">${status}</div>
          <div class="catalog-review" role="group" aria-label="Magyar szinkron saját ellenőrzése">
            <button type="button" data-dub="${key}" data-status="hu" aria-label="Magyar szinkron igazolása">✓ Van</button>
            <button type="button" data-dub="${key}" data-status="no" aria-label="Magyar szinkron hiányának jelölése">Nincs</button>
            <button type="button" data-dub="${key}" data-status="unknown" aria-label="Ellenőrzés visszavonása">?</button>
          </div>
          <button type="button" class="catalog-details" data-catalog-details="${key}">Adatlap és elérhetőség →</button>
        </div></article>`;
    }).join('');
    status.textContent=state.error|| (state.busy?'Filmek betöltése…':items.length?items.length+' találat a katalógusban'+(state.confirmedOnly?' (saját ellenőrzés)':''):state.confirmedOnly?'Még nincs általad igazolt magyar szinkronos cím.':'Nincs találat. Próbálj másik szűrőt.');
    more.hidden=!state.hasMore||state.busy;
    more.disabled=state.busy;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});
  else build();
})();
