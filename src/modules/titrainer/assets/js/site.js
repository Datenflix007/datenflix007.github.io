
function setActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === path) a.classList.add('active');
  });
}
function initSearch(){
  const q = document.querySelector('[data-search]');
  if(!q) return;
  const items = Array.from(document.querySelectorAll('[data-item]'));
  q.addEventListener('input', ()=>{
    const s = q.value.trim().toLowerCase();
    let shown=0;
    for(const el of items){
      const hay = (el.getAttribute('data-hay')||'').toLowerCase();
      const ok = !s || hay.includes(s);
      el.style.display = ok ? '' : 'none';
      if(ok) shown++;
    }
    const counter = document.querySelector('[data-counter]');
    if(counter) counter.textContent = shown.toString();
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  setActiveNav();
  initSearch();
});
