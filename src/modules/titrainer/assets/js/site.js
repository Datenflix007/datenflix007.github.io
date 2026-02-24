
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
function extractTopicFromDetail(detail, summaryLabel){
  const rawHay = detail.getAttribute('data-hay') || '';
  let text = rawHay.replace(/\s+/g, ' ').trim();
  if(!text){
    const block = detail.querySelector('.box > div:last-child');
    text = (block?.textContent || '').replace(/\s+/g, ' ').trim();
  }
  if(!text) return '';

  if(summaryLabel){
    const esc = summaryLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp('^' + esc + '\\s*', 'i'), '');
  }
  text = text.replace(/^(Definition|Satz|Lemma|Beispiel|Bemerkung)\s*[0-9.]*\s*/i, '');
  text = text.replace(/^(Definition|Satz|Lemma|Beispiel|Bemerkung)\s*[0-9.]*\s*/i, '');
  text = text.replace(/^[-–:,.;|]+/, '').trim();

  if(text.length > 120){
    text = text.slice(0, 117).trimEnd() + '...';
  }
  return text;
}
function initSummaryTopics(){
  const detailsList = document.querySelectorAll('details[data-item]');
  if(!detailsList.length) return;

  for(const detail of detailsList){
    const summary = detail.querySelector('summary');
    if(!summary || summary.querySelector('.summary-topic')) continue;

    const summaryClone = summary.cloneNode(true);
    summaryClone.querySelectorAll('.badge,.summary-topic').forEach(el => el.remove());
    const summaryLabel = summaryClone.textContent.replace(/\s+/g, ' ').trim();

    const topic = extractTopicFromDetail(detail, summaryLabel);
    if(!topic) continue;

    const topicEl = document.createElement('span');
    topicEl.className = 'summary-topic';
    topicEl.textContent = 'Thema: ' + topic;
    summary.appendChild(topicEl);
  }
}
document.addEventListener('DOMContentLoaded', ()=>{
  setActiveNav();
  initSummaryTopics();
  initSearch();
});
