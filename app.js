(() => {
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app"), tabs = $("#tabs"), search = $("#search");
const state = {lang: localStorage.getItem("sc_lang") || "en", dark: localStorage.getItem("sc_theme")==="dark", history: []};

try { state.history = JSON.parse(localStorage.getItem("sc_history") || "[]"); if(!Array.isArray(state.history)) state.history=[]; } catch { state.history=[]; }
if(state.dark) document.body.classList.add("dark");

const T = {
 en:{hero:"All-in-One Calculator",heroText:"Calculate faster with clean, accurate and mobile-friendly tools.",search:"Search calculators...",history:"History",calculate:"Calculate",reset:"Reset",copy:"Copy",result:"Result",clear:"Clear all",invalid:"Please enter valid numbers."},
 ur:{hero:"All-in-One Calculator",heroText:"Tez aur asaan calculations, mobile par bhi.",search:"Calculator search karein...",history:"History",calculate:"Calculate",reset:"Reset",copy:"Copy",result:"Result",clear:"Sab clear karein",invalid:"Valid numbers enter karein."},
 es:{hero:"Calculadora Todo-en-Uno",heroText:"Cálculos rápidos, claros y adaptados a móviles.",search:"Buscar calculadoras...",history:"Historial",calculate:"Calcular",reset:"Restablecer",copy:"Copiar",result:"Resultado",clear:"Borrar todo",invalid:"Introduce números válidos."}
};
const C = [
 {id:"profit",name:"Profit / Loss",icon:"💰",fields:[["cost","Cost Price"],["sell","Selling Price"]],run:v=>{const d=v.sell-v.cost;if(v.cost===0)return "Cost price must not be zero.";return d>=0?`Profit: ${fmt(d)} | ${fmt(d/v.cost*100)}%`:`Loss: ${fmt(Math.abs(d))} | ${fmt(Math.abs(d)/v.cost*100)}%`}},
 {id:"percentage",name:"Percentage",icon:"％",fields:[["percent","Percentage"],["number","Number"]],run:v=>`${fmt(v.percent/100*v.number)} (${fmt(v.percent)}% of ${fmt(v.number)})`}},
 {id:"discount",name:"Discount + Tax",icon:"🏷️",fields:[["price","Original Price"],["discount","Discount %"],["tax","Tax %"]],run:v=>{const discounted=v.price*(1-v.discount/100),total=discounted*(1+v.tax/100);return `Final: ${fmt(total)} | Saved: ${fmt(v.price-discounted)}`}},
 {id:"break",name:"Break-even",icon:"📈",fields:[["fixed","Fixed Cost"],["price","Price / Unit"],["variable","Variable Cost / Unit"]],run:v=>{const margin=v.price-v.variable;if(margin<=0)return "Price must be greater than variable cost.";return `Break-even: ${Math.ceil(v.fixed/margin)} units`}},
 {id:"simple",name:"Simple Interest",icon:"💵",fields:[["principal","Principal"],["rate","Annual Rate %"],["years","Years"]],run:v=>{const i=v.principal*v.rate*v.years/100;return `Interest: ${fmt(i)} | Total: ${fmt(v.principal+i)}`}},
 {id:"compound",name:"Compound Interest",icon:"📊",fields:[["principal","Principal"],["rate","Annual Rate %"],["years","Years"]],run:v=>{const total=v.principal*Math.pow(1+v.rate/100,v.years);return `Total: ${fmt(total)} | Interest: ${fmt(total-v.principal)}`}},
 {id:"emi",name:"EMI / Loan",icon:"🏦",fields:[["principal","Loan Amount"],["rate","Annual Rate %"],["months","Months"]],run:v=>{if(v.months<=0)return "Months must be greater than zero.";const r=v.rate/1200,emi=r===0?v.principal/v.months:v.principal*r*Math.pow(1+r,v.months)/(Math.pow(1+r,v.months)-1);return `Monthly EMI: ${fmt(emi)} | Total: ${fmt(emi*v.months)}`}},
 {id:"area",name:"Rectangle Area",icon:"📐",fields:[["length","Length"],["width","Width"]],run:v=>`Area: ${fmt(v.length*v.width)} sq units | Perimeter: ${fmt(2*(v.length+v.width))}`}},
 {id:"volume",name:"Box Volume",icon:"📦",fields:[["length","Length"],["width","Width"],["height","Height"]],run:v=>`Volume: ${fmt(v.length*v.width*v.height)} cubic units`}},
 {id:"construction",name:"Construction Cost",icon:"🏗️",fields:[["area","Area"],["rate","Rate / Unit"],["waste","Waste %"]],run:v=>{const bill=v.area*(1+v.waste/100);return `Estimated Cost: ${fmt(bill*v.rate)} | Billable Area: ${fmt(bill)}`}},
 {id:"temp",name:"Temperature",icon:"🌡️",fields:[["celsius","Celsius"]],run:v=>`Fahrenheit: ${fmt(v.celsius*9/5+32)}°F | Kelvin: ${fmt(v.celsius+273.15)}K`}}
];

function fmt(n){return Number.isFinite(n)?new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(n):"—"}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function save(){try{localStorage.setItem("sc_history",JSON.stringify(state.history));localStorage.setItem("sc_theme",state.dark?"dark":"light");localStorage.setItem("sc_lang",state.lang)}catch{}}
function t(k){return (T[state.lang]||T.en)[k]||T.en[k]}
function renderTabs(q=""){const list=C.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));tabs.innerHTML=list.map((c,i)=>`<button type="button" class="tab ${i===0?"active":""}" data-id="${c.id}">${c.icon} ${c.name}</button>`).join("")||`<span class="hint">No calculator found.</span>`;tabs.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>openCalc(b.dataset.id)))}
function openCalc(id){const c=C.find(x=>x.id===id);if(!c)return;tabs.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.id===id));app.innerHTML=`<article class="card"><h2>${c.icon} ${c.name}</h2><p class="hint">Enter values and calculate instantly.</p><form id="calcForm"><div class="fields">${c.fields.map(([k,l])=>`<div class="field"><label for="${id}-${k}">${l}</label><input id="${id}-${k}" name="${k}" type="number" inputmode="decimal" step="any" placeholder="0" required></div>`).join("")}</div><div class="actions"><button class="btn primary" type="submit">${t("calculate")}</button><button class="btn" id="reset" type="button">${t("reset")}</button></div><div id="result\" class=\"result\" hidden></div></form></article>`;
const form=$("#calcForm"), result=$("#result");
form.addEventListener("submit",e=>{e.preventDefault();const v={};for(const [k] of c.fields){const n=Number(form.elements[k].value);if(!Number.isFinite(n)){result.hidden=false;result.innerHTML=`<div class="error">${t("invalid")}</div>`;return}v[k]=n}let out;try{out=c.run(v)}catch{out="Calculation error. Please check your inputs."}result.hidden=false;result.innerHTML=`<span class="label">${t("result")}</span><strong>${esc(out)}</strong><div class="actions"><button class="btn" id="copy" type="button">${t("copy")}</button></div>`;$("#copy").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(String(out));$("#copy").textContent="Copied ✓"}catch{}});state.history.unshift({name:c.name,result:String(out),time:new Date().toLocaleString()});state.history=state.history.slice(0,100);save()});
$("#reset").addEventListener("click",()=>{form.reset();result.hidden=true});}
function openHistory(){app.innerHTML=`<article class="card"><h2>🕘 ${t("history")}</h2><div class="actions"><button id="clearHistory" class="btn danger" type="button">${t("clear")}</button></div><div class="history-list">${state.history.length?state.history.map(x=>`<div class="history-row"><div><b>${esc(x.name)}</b><div>${esc(x.result)}</div><small>${esc(x.time)}</small></div></div>`).join(""):`<div class="empty">No calculations yet.</div>`}</div></article>`;$("#clearHistory").addEventListener("click",()=>{state.history=[];save();openHistory()})}
function updateUI(){ $("#heroTitle").textContent=t("hero");$("#heroText").textContent=t("heroText");search.placeholder=t("search");$("#historyBtn").textContent="🕘 "+t("history");renderTabs(search.value)}
search.addEventListener("input",()=>renderTabs(search.value));
$("#historyBtn").addEventListener("click",openHistory);
$("#themeBtn").addEventListener("click",()=>{state.dark=!state.dark;document.body.classList.toggle("dark",state.dark);$("#themeBtn").textContent=state.dark?"☀️":"🌙";save()});
$("#language").value=state.lang;$("#language").addEventListener("change",e=>{state.lang=e.target.value;updateUI();openCalc("profit");save()});
$("#closeDialog").addEventListener("click",()=>$("#infoDialog").close());
document.querySelectorAll(".footer a").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const id=a.getAttribute("href").slice(1);const text={privacy:["Privacy Policy","SmartCalculator is designed to perform calculations in your browser. We do not intentionally collect calculator inputs. If third-party analytics or advertising is added later, this policy should be updated before launch."],terms:["Terms of Use","SmartCalculator provides calculations for general informational purposes. Verify important financial, tax, construction or business calculations with an appropriate professional."],disclaimer:["Disclaimer","Calculator results may contain rounding or input errors. SmartCalculator does not provide financial, legal, tax, engineering or medical advice."]}[id];$("#dialogContent").innerHTML=`<h2>${text[0]}</h2><p>${text[1]}</p>`;$("#infoDialog").showModal() }));
updateUI();openCalc("profit");
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
})();