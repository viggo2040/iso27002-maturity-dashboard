// Radar + API path auto-discovery to avoid 404s on different Hostinger layouts
console.log("%cDashboard UI","color:#22d3ee","? Modo RADAR + Auto-API");

const CANDIDATES = (() => {
  const loc = window.location;
  const path = loc.pathname; // e.g. /public/index.html or /sitio/public/index.html
  const parts = path.split("/").filter(Boolean);

  // Order of attempts (from most common to fallback)
  const guesses = [
    "/api/summary.php",      // api en public_html/api
    "api/summary.php",       // api en el mismo nivel del dashboard
    "../api/summary.php",    // dashboard en /public, api en /api
    "/public/api/summary.php"
  ];

  // adicional: probar acumulando bases desde la ruta actual
  for (let i = parts.length; i >= 0; i--) {
    const base = "/" + parts.slice(0, i).join("/");
    if (base.trim() === "") continue;
    guesses.push(base + "/api/summary.php");
  }

  return [...new Set(guesses)];
})();

const PROBE_KEY = "iso27002_api_summary_path";

async function findApiSummary() {
  const cached = localStorage.getItem(PROBE_KEY);
  if (cached && await probe(cached)) return cached;

  for (const candidate of CANDIDATES) {
    if (await probe(candidate)) {
      localStorage.setItem(PROBE_KEY, candidate);
      return candidate;
    }
  }
  throw new Error("No se pudo localizar api/summary.php. Revisa estructura en el hosting.");
}

async function probe(url) {
  try {
    const u = url + (url.includes("?") ? "&" : "?") + "probe=" + Date.now();
    const res = await fetch(u, { cache: "no-store" });
    if (!res.ok) return false;
    const text = await res.text();
    try { JSON.parse(text); return true; } catch { return false; }
  } catch { return false; }
}

let API_SUMMARY = "/api/summary.php"; // default; será reemplazado por findApiSummary()

const state = { data: [], meta: { records: 0, domains: 0, source: "" }, canvasW: 720, canvasH: 520 };

async function loadData(){
  if (!API_SUMMARY) {
    API_SUMMARY = await findApiSummary();
    console.log("%cAPI detectada","color:#22d3ee", API_SUMMARY);
  } else {
    // si el default falla, dispara autodiscovery
    const ok = await probe(API_SUMMARY);
    if (!ok) {
      API_SUMMARY = await findApiSummary();
      console.log("%cAPI detectada","color:#22d3ee", API_SUMMARY);
    }
  }

  const url = API_SUMMARY + (API_SUMMARY.includes("?") ? "&" : "?") + "nocache=" + Date.now();
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch (e) {
    const msg = `Error al parsear JSON (HTTP ${res.status}). Respuesta inicia con: ` + text.slice(0, 200).replace(/\s+/g, " ");
    console.error(msg); alert(msg); return;
  }
  if (json.error) {
    console.warn("API devolvió error:", json);
  }

  state.data = json.data || [];
  state.meta = json.meta || {};
  renderTable(); renderKPIs();

  const holder = document.getElementById("p5-holder");
  holder.innerHTML = "";
  new p5(sketchRadar, holder);

  document.getElementById("source").textContent = state.meta.source || "N/A";
}

function renderKPIs(){
  const k=document.getElementById("kpis");
  const avg=state.data.length?(state.data.reduce((s,r)=>s+r.Madurez_Promedio,0)/state.data.length):0;
  k.innerHTML=`
    <div class="kpi"><div class="label">Registros</div><div class="value">${state.meta.records ?? 0}</div></div>
    <div class="kpi"><div class="label">Dominios</div><div class="value">${state.meta.domains ?? 0}</div></div>
    <div class="kpi"><div class="label">Madurez Promedio</div><div class="value">${avg.toFixed(2)}</div></div>`;
}

function renderTable(){
  const tbody=document.querySelector("#tbl tbody"); tbody.innerHTML="";
  state.data.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${r.Dominio_ISO27002}</td><td>${r.Madurez_Promedio.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

// --------- p5.js RADAR CHART ---------
function sketchRadar(p){
  const padding = 40;
  const maxLevel = 5; // 0..5
  let cx, cy, radius;

  p.setup = () => {
    p.createCanvas(state.canvasW, state.canvasH);
    p.textFont("ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto");
    p.noLoop();
  };

  p.draw = () => {
    p.background("#0b1220");
    const n = Math.max(1, state.data.length);
    cx = p.width/2;
    cy = p.height/2 + 10;
    radius = Math.min(p.width, p.height) / 2 - padding;

    // Anillos concéntricos
    p.stroke("#1f2937"); p.noFill();
    for(let lvl=1; lvl<=maxLevel; lvl++){
      const r = radius * (lvl / maxLevel);
      p.circle(cx, cy, r*2);
      p.noStroke(); p.fill("#94a3b8"); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
      p.text(lvl, cx + r + 4, cy);
      p.stroke("#1f2937"); p.noFill();
    }

    // Ejes + etiquetas
    const angleStep = p.TWO_PI / n;
    for(let i=0;i<n;i++){
      const ang = -p.HALF_PI + i*angleStep;
      const x = cx + radius * Math.cos(ang);
      const y = cy + radius * Math.sin(ang);
      p.stroke("#1f2937"); p.line(cx, cy, x, y);

      const label = state.data[i]?.Dominio_ISO27002 || `Dom ${i+1}`;
      p.noStroke(); p.fill("#e2e8f0"); p.textSize(12); p.textAlign(p.CENTER, p.CENTER);
      const lx = cx + (radius + 18) * Math.cos(ang);
      const ly = cy + (radius + 18) * Math.sin(ang);
      p.text(label, lx, ly);
    }

    // Polígono de datos
    if(n>0){
      p.noStroke();
      const fillCol = p.color("#22d3ee"); fillCol.setAlpha(80);
      p.fill(fillCol);
      p.beginShape();
      for(let i=0;i<n;i++){
        const val = clamp(state.data[i]?.Madurez_Promedio ?? 0, 0, maxLevel);
        const r = radius * (val / maxLevel);
        const ang = -p.HALF_PI + i*angleStep;
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        p.vertex(x, y);
      }
      p.endShape(p.CLOSE);

      // puntos + valores
      p.stroke("#22d3ee"); p.strokeWeight(2); p.noFill();
      for(let i=0;i<n;i++){
        const val = clamp(state.data[i]?.Madurez_Promedio ?? 0, 0, maxLevel);
        const r = radius * (val / maxLevel);
        const ang = -p.HALF_PI + i*angleStep;
        const x = cx + r * Math.cos(ang);
        const y = cy + r * Math.sin(ang);
        p.line(cx, cy, x, y);
        p.noStroke(); p.fill("#22d3ee"); p.circle(x, y, 6);
        p.fill("#e2e8f0"); p.textSize(11); p.textAlign(p.CENTER, p.BOTTOM);
        p.text((val).toFixed(2), x, y - 8);
      }
      p.strokeWeight(1);
    }
  };
}

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

function toCSV(rows){ const h=["Dominio_ISO27002","Madurez_Promedio"]; const b=rows.map(r=>[r.Dominio_ISO27002,r.Madurez_Promedio]); return [h,...b].map(r=>r.join(",")).join("\n"); }
function downloadCSV(name, text){ const blob=new Blob([text],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }

// Botón Recargar ahora también fuerza re-descubrimiento de API
document.getElementById("reload").addEventListener("click", async e => {
  e.preventDefault();
  localStorage.removeItem(PROBE_KEY);
  API_SUMMARY = "";
  await loadData();
});

document.getElementById("btn-export").addEventListener("click", () => downloadCSV("resumen_por_dominio.csv", toCSV(state.data)));

loadData();
