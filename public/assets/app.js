
const API_SUMMARY = '/api/summary.php';
const state = { data: [], meta: { records: 0, domains: 0, source: '' }, canvasW: 960, canvasH: 420 };

async function loadData(){
  const url = API_SUMMARY + '?nocache=' + Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch (e) { const msg = `Error al parsear JSON (HTTP ${res.status}). Respuesta inicia con: ` + text.slice(0, 200).replace(/\s+/g, ' '); console.error(msg); alert(msg); return; }
  state.data = json.data || []; state.meta = json.meta || {};
  renderTable(); renderKPIs();
  const holder = document.getElementById('p5-holder'); holder.innerHTML=''; new p5(sketch, holder);
  document.getElementById('source').textContent = state.meta.source || 'N/A';
}

function renderKPIs(){
  const k=document.getElementById('kpis');
  const avg=state.data.length?(state.data.reduce((s,r)=>s+r.Madurez_Promedio,0)/state.data.length):0;
  k.innerHTML=`
    <div class="kpi"><div class="label">Registros</div><div class="value">${state.meta.records ?? 0}</div></div>
    <div class="kpi"><div class="label">Dominios</div><div class="value">${state.meta.domains ?? 0}</div></div>
    <div class="kpi"><div class="label">Madurez Promedio</div><div class="value">${avg.toFixed(2)}</div></div>`;
}

function renderTable(){
  const tbody=document.querySelector('#tbl tbody'); tbody.innerHTML='';
  state.data.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.Dominio_ISO27002}</td><td>${r.Madurez_Promedio.toFixed(2)}</td>`; tbody.appendChild(tr); });
}

function sketch(p){
  let pad=40;
  p.setup=()=>{ p.createCanvas(state.canvasW, state.canvasH); p.noLoop(); };
  p.draw=()=>{
    p.background('#0b1220');
    const maxVal = Math.max(5, ...state.data.map(d => d.Madurez_Promedio));
    const w = (state.canvasW - pad*2) / Math.max(1, state.data.length);
    const chartH = state.canvasH - pad*2 - 20;
    p.stroke('#1f2937');
    p.line(pad, state.canvasH-pad, state.canvasW-pad, state.canvasH-pad);
    p.line(pad, pad, pad, state.canvasH-pad);
    p.noStroke(); p.fill('#94a3b8');
    for(let y=0;y<=5;y++){ const yPos = state.canvasH - pad - (y/5)*chartH; p.stroke('#1f2937'); p.line(pad-5,yPos,state.canvasW-pad,yPos); p.noStroke(); p.text(y,12,yPos+4); }
    p.noStroke(); let i=0;
    state.data.forEach(d=>{
      const h = (d.Madurez_Promedio/maxVal)*chartH;
      const x = pad + i*w + 6; const y = state.canvasH - pad - h;
      p.fill('#22d3ee'); p.rect(x,y,w-12,h,6);
      p.fill('#e2e8f0'); p.textAlign(p.CENTER); p.text(d.Madurez_Promedio.toFixed(2), x+(w-12)/2, y-4);
      p.push(); p.translate(x+(w-12)/2, state.canvasH-pad+12); p.rotate(-Math.PI/4); p.text(d.Dominio_ISO27002,0,0); p.pop();
      i++;
    });
  };
}

function toCSV(rows){ const h=['Dominio_ISO27002','Madurez_Promedio']; const b=rows.map(r=>[r.Dominio_ISO27002,r.Madurez_Promedio]); return [h,...b].map(r=>r.join(',')).join('\n'); }
function downloadCSV(name, text){ const blob=new Blob([text],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }

document.getElementById('reload').addEventListener('click', e => { e.preventDefault(); loadData(); });
document.getElementById('btn-export').addEventListener('click', () => downloadCSV('resumen_por_dominio.csv', toCSV(state.data)));

loadData();
