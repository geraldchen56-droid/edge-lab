
(function(){
"use strict";
const $=id=>document.getElementById(id);
const fmt=(x,d=2)=>Number(x).toFixed(d);
const fmtN=x=>Math.round(x).toLocaleString("en-US");
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const randn=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
const die=()=>ri(1,6);
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function Phi(x){const t=1/(1+0.2316419*Math.abs(x));const d=0.3989423*Math.exp(-x*x/2);const p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p}
const CARDN=v=>({1:"A",11:"J",12:"Q",13:"K"}[v]||String(v));

/* ---------- progress ---------- */
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let done={};try{done=JSON.parse(store.get("pitbook-done")||"{}")}catch(e){done={}}
const btns=[...document.querySelectorAll("[data-done]")];
function renderProg(){
  let n=0;btns.forEach(b=>{const on=!!done[b.dataset.done];b.setAttribute("aria-pressed",on);b.textContent=on?"Done ✓":"Mark done";if(on)n++});
  document.querySelectorAll(".tick").forEach(t=>t.textContent=done[t.dataset.for]?"✓":"");
  $("progTxt").textContent=`${n} of ${btns.length} modules done`;const tp=$("tbProg");if(tp)tp.textContent=`${n}/${btns.length} done`;$("progBar").style.width=(100*n/btns.length)+"%";
}
btns.forEach(b=>b.addEventListener("click",()=>{done[b.dataset.done]=!done[b.dataset.done];store.set("pitbook-done",JSON.stringify(done));renderProg()}));
renderProg();

/* ---------- canvas helper ---------- */
function ctxOf(c){const x=c.getContext("2d");x.clearRect(0,0,c.width,c.height);return x}

/* ---------- F1 EV table ---------- */
let evRows=[];
function evPreset(rows){evRows=rows.map(r=>({x:r[0],p:r[1]}));evRender()}
function evRender(){
  const tb=$("evTable").querySelector("tbody");tb.innerHTML="";
  evRows.forEach((r,i)=>{const tr=document.createElement("tr");
    tr.innerHTML=`<td><input type="number" step="any" value="${r.x}" aria-label="payoff ${i+1}"></td><td><input type="text" value="${r.p}" aria-label="probability ${i+1}"></td><td class="n"></td><td><button aria-label="remove row">×</button></td>`;
    const [ix,ip]=tr.querySelectorAll("input");
    ix.addEventListener("input",()=>{r.x=ix.value;evCalc()});ip.addEventListener("input",()=>{r.p=ip.value;evCalc()});
    tr.querySelector("button").addEventListener("click",()=>{evRows.splice(i,1);evRender()});tb.appendChild(tr)});
  evCalc();
}
function parseP(s){s=String(s).trim();if(s.includes("/")){const[a,b]=s.split("/").map(Number);return a/b}return Number(s)}
function evCalc(){
  let sp=0,ev=0,ex2=0;const cells=$("evTable").querySelectorAll("tbody td.n");
  evRows.forEach((r,i)=>{const p=parseP(r.p),x=Number(r.x);if(isFinite(p)&&isFinite(x)){sp+=p;ev+=p*x;ex2+=p*x*x;cells[i].textContent=fmt(p*x,3)}else cells[i].textContent="?"});
  const v=ex2-ev*ev;
  $("evStats").innerHTML=`<div><span>EV</span><b>${fmt(ev,3)}</b></div><div><span>Variance</span><b>${fmt(v,3)}</b></div><div><span>σ</span><b>${fmt(Math.sqrt(Math.max(v,0)),3)}</b></div><div><span>Σ p</span><b class="${Math.abs(sp-1)<1e-6?"good":"bad"}">${fmt(sp,3)}</b></div>`;
  $("evOut").textContent=Math.abs(sp-1)>1e-6?"Probabilities sum to "+fmt(sp,3)+", not 1. Fix them before trusting the EV.":
    `EV ${ev>0?"> 0: take this bet":ev<0?"< 0: pass, or take the other side":"= 0: no edge"}. You can type probabilities as fractions, e.g. 1/6.`;
  const z=v=>Math.abs(v)<1e-9?0:v;let h="<thead><tr><th>x</th><th>p</th><th>x − μ</th><th>(x − μ)²</th><th>p·(x − μ)</th><th>p·(x − μ)²</th></tr></thead><tbody>",sd=0,sv=0;
  evRows.forEach(r=>{const p=parseP(r.p),x=Number(r.x);if(!isFinite(p)||!isFinite(x))return;const d=x-ev;sd+=p*d;sv+=p*d*d;
    h+=`<tr><td class="n">${fmt(x,2)}</td><td class="n">${fmt(p,3)}</td><td class="n">${fmt(z(d),3)}</td><td class="n">${fmt(d*d,3)}</td><td class="n">${fmt(z(p*d),3)}</td><td class="n">${fmt(p*d*d,3)}</td></tr>`});
  h+=`<tr><td colspan="4"><b>Σ (add the column)</b></td><td class="n"><b>${fmt(z(sd),3)}</b></td><td class="n"><b>${fmt(sv,3)}</b></td></tr></tbody>`;
  $("varTable").innerHTML=h;
  $("varOut").textContent=`μ = ${fmt(ev,3)}\nΣ p·(x − μ) = ${fmt(z(sd),3)} → plain deviations always cancel to 0, so they can't measure spread.\nΣ p·(x − μ)² = ${fmt(sv,3)} → this is the variance.\nσ = √${fmt(sv,3)} = ${fmt(Math.sqrt(Math.max(sv,0)),3)}, back in the payoff's own units.\nShortcut check: E[X²] − μ² = ${fmt(ex2,3)} − ${fmt(ev*ev,3)} = ${fmt(ex2-ev*ev,3)}`;
}
$("evDie").onclick=()=>evPreset([[1,"1/6"],[2,"1/6"],[3,"1/6"],[4,"1/6"],[5,"1/6"],[6,"1/6"]]);
$("evBet").onclick=()=>evPreset([[10,"1/6"],[-1,"5/6"]]);
$("evAdd").onclick=()=>{evRows.push({x:0,p:0});evRender()};
evPreset([[10,"1/6"],[-1,"5/6"]]);

/* ---------- F2 linearity ---------- */
function ldRoll(){
  const n=+$("ldN").value;$("ldNv").textContent=n;const N=4000,cnt=new Array(6*n+1).fill(0);let s=0,s2=0;
  for(let k=0;k<N;k++){let t=0;for(let j=0;j<n;j++)t+=die();cnt[t]++;s+=t;s2+=t*t}
  const m=s/N,sd=Math.sqrt(s2/N-m*m);const c=$("ldCanvas"),x=ctxOf(c);const W=c.width,H=c.height,pad=24;
  const lo=n,hi=6*n,bw=(W-2*pad)/(hi-lo+1),mx=Math.max(...cnt);
  x.fillStyle=css("--felt");
  for(let v=lo;v<=hi;v++){const h=(H-2*pad)*cnt[v]/mx;x.fillRect(pad+(v-lo)*bw+1,H-pad-h,Math.max(bw-2,1),h)}
  const ev=3.5*n;x.strokeStyle=css("--ask");x.lineWidth=2;const xe=pad+(ev-lo+0.5)*bw;x.beginPath();x.moveTo(xe,8);x.lineTo(xe,H-pad);x.stroke();
  x.fillStyle=css("--muted");x.font="12px "+css("--f-mono");x.textAlign="center";
  const step=Math.max(1,Math.ceil((hi-lo)/12));for(let v=lo;v<=hi;v+=step)x.fillText(v,pad+(v-lo+0.5)*bw,H-6);
  x.textAlign="left";x.fillStyle=css("--ask");x.fillText("EV "+ev,Math.min(xe+4,W-60),18);
  $("ldStats").innerHTML=`<div><span>Theory EV</span><b>${fmt(ev,1)}</b></div><div><span>Sample mean</span><b>${fmt(m,2)}</b></div><div><span>Theory σ</span><b>${fmt(Math.sqrt(n*35/12),2)}</b></div><div><span>Sample σ</span><b>${fmt(sd,2)}</b></div><div><span>EV ÷ σ</span><b>${fmt(ev/Math.sqrt(n*35/12),2)}</b></div>`;
}
$("ldN").oninput=ldRoll;$("ldRoll").onclick=ldRoll;ldRoll();

/* ---------- F3 stopping ---------- */
function stRender(){
  const s=+$("stS").value,k=+$("stK").value;$("stKv").textContent=k;
  let V=[(s+1)/2];for(let i=1;i<=k;i++){let e=0;for(let x=1;x<=s;x++)e+=Math.max(x,V[i-1]);V.push(e/s)}
  let h="<thead><tr><th>Re-rolls left</th><th class='n'>Game value</th><th>Keep the roll if it is</th></tr></thead><tbody>";
  for(let i=k;i>=0;i--){h+=`<tr><td>${i}</td><td class="n">${fmt(V[i],3)}</td><td>${i===0?"forced to keep":"above "+fmt(V[i-1],3)+" → keep ≥ "+(Math.floor(V[i-1])+1)}</td></tr>`}
  $("stTable").innerHTML=h+"</tbody>";
  $("stOut").textContent=k===0?`No choice: value = (${s}+1)/2 = ${fmt(V[0],2)}.`:
    `With ${k} re-roll${k>1?"s":""}, the game is worth ${fmt(V[k],3)}. Each extra re-roll adds less: that is diminishing value of options, the same reason extra time on an option is worth less and less.`;
}
$("stS").onchange=stRender;$("stK").oninput=stRender;stRender();

/* ---------- F4 Bayes ---------- */
function byRender(){
  const p=$("byP").value/100,L=Math.pow(10,$("byL").value/30*1.0);$("byPv").textContent=Math.round(p*100)+"%";$("byLv").textContent=fmt(L,L<1?2:1)+"×";
  const o=p/(1-p),o2=o*L,p2=o2/(1+o2);
  const c=$("byCanvas"),x=ctxOf(c),W=c.width;
  const bar=(y,val,col,lab)=>{x.fillStyle=css("--sunk");x.fillRect(110,y,W-170,22);x.fillStyle=col;x.fillRect(110,y,(W-170)*val,22);x.fillStyle=css("--ink");x.font="13px "+css("--f-mono");x.fillText(lab,8,y+16);x.fillText(fmt(val*100,1)+"%",W-54,y+16)};
  bar(14,p,css("--muted"),"prior");bar(52,p2,css("--felt"),"posterior");
  $("byOut").textContent=`prior odds = ${fmt(p,2)} / ${fmt(1-p,2)} = ${fmt(o,3)}\n× LR ${fmt(L,2)} = ${fmt(o2,3)}\nposterior p = ${fmt(o2,3)} / (1 + ${fmt(o2,3)}) = ${fmt(p2*100,1)}%`;
}
$("byP").oninput=byRender;$("byL").oninput=byRender;byRender();
function nfRender(){
  const pr=$("nfP").value/100,a=$("nfA").value/100,b=$("nfB").value/100;
  $("nfPv").textContent=$("nfP").value+"%";$("nfAv").textContent=$("nfA").value+"%";$("nfBv").textContent=$("nfB").value+"%";
  const N=1000,nH=Math.round(N*pr),hE=Math.round(nH*a),nE=Math.round((N-nH)*b);
  const c=$("nfCanvas"),x=ctxOf(c),cols=40,cw=c.width/cols,chh=c.height/25,r=Math.min(cw,chh)*0.36;
  const felt=css("--felt"),ask=css("--ask"),mut=css("--muted");
  for(let i=0;i<N;i++){const isH=i<nH,isE=isH?i<hE:(i-nH)<nE;
    x.globalAlpha=isE?1:0.22;x.fillStyle=isH?felt:(isE?ask:mut);
    x.beginPath();x.arc((i%cols+0.5)*cw,(Math.floor(i/cols)+0.5)*chh,r,0,2*Math.PI);x.fill()}
  x.globalAlpha=1;
  const tot=hE+nE,post=tot?hE/tot:0,o=pr/(1-pr),LR=a/b,o2=o*LR;
  $("nfOut").textContent=`Of 1,000 days, ${nH} have H (prior ${fmt(pr*100,0)}%).\nEvidence appears on ${hE} of those ${nH} (${fmt(a*100,0)}%) and on ${nE} of the other ${N-nH} (${fmt(b*100,0)}%).\nYou saw the evidence, so only the ${tot} solid dots are still possible. ${hE} of them are H.\nPosterior P(H | E) = ${hE} ÷ ${tot} = ${fmt(post*100,1)}%\nOdds route: prior odds ${fmt(o,3)} × LR (${fmt(a,2)} ÷ ${fmt(b,2)} = ${fmt(LR,2)}) = ${fmt(o2,3)} → ${fmt(o2/(1+o2)*100,1)}%  (tiny gaps are dot rounding)`;
}
["nfP","nfA","nfB"].forEach(i=>$(i).oninput=nfRender);nfRender();

/* ---------- F5 Kelly ---------- */
function kRun(){
  const p=$("kP").value/100,b=Math.max(0.05,+$("kB").value||1);$("kPv").textContent=Math.round(p*100)+"%";
  const fk=Math.max(0,(b*p-(1-p))/b);const rules=[{n:"Half Kelly",f:fk/2,c:css("--bid")},{n:"Kelly",f:fk,c:css("--felt")},{n:"2× Kelly",f:Math.min(fk*2,0.99),c:css("--ask")}];
  const T=300,wins=[];for(let i=0;i<T;i++)wins.push(Math.random()<p);
  const paths=rules.map(r=>{let w=1;const a=[0];for(const win of wins){w*=win?1+r.f*b:1-r.f;a.push(Math.log10(Math.max(w,1e-12)))}return a});
  const c=$("kCanvas"),x=ctxOf(c),W=c.width,H=c.height,pad=34;
  let lo=Math.min(-1,...paths.flat()),hi=Math.max(1,...paths.flat());
  const Y=v=>H-pad-(v-lo)/(hi-lo)*(H-2*pad),X=i=>pad+i/T*(W-pad-10);
  x.strokeStyle=css("--line");x.lineWidth=1;x.fillStyle=css("--muted");x.font="11px "+css("--f-mono");
  for(let g=Math.ceil(lo);g<=Math.floor(hi);g++){x.beginPath();x.moveTo(pad,Y(g));x.lineTo(W-10,Y(g));x.stroke();x.fillText(g===0?"1×":"10^"+g,2,Y(g)+4)}
  paths.forEach((a,k)=>{x.strokeStyle=rules[k].c;x.lineWidth=2;x.beginPath();a.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v)));x.stroke();x.fillStyle=rules[k].c;x.fillText(rules[k].n,X(T)-70,Y(a[T])-6)});
  const g=f=>p*Math.log(1+f*b)+(1-p)*Math.log(1-f);
  $("kOut").textContent=fk<=0?`EV per unit = ${fmt(b*p-(1-p),3)} ≤ 0. Kelly says bet nothing.`:
    `Kelly fraction f* = (${fmt(b,2)}×${fmt(p,2)} − ${fmt(1-p,2)}) / ${fmt(b,2)} = ${fmt(fk*100,1)}% of bankroll\nExpected log-growth per bet: half ${fmt(g(fk/2),4)}, Kelly ${fmt(g(fk),4)}, 2× ${fmt(g(Math.min(2*fk,.99)),4)}\nThe vertical axis is log scale. Run it a few times: 2× Kelly often ends below where it started.`;
}
$("kRun").onclick=kRun;$("kP").oninput=kRun;kRun();

/* ---------- game kit: dice, cards, chips, sound, pops ---------- */
const reduceMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep=ms=>new Promise(r=>setTimeout(r,reduceMotion?0:ms));
const SUITS=["♠","♥","♦","♣"];
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const signed=(x,d=2)=>(x>=0?"+":"−")+fmt(Math.abs(x),d);
function dieHTML(v,cls=""){if(!v)return`<span class="die q ${cls}" role="img" aria-label="hidden die">?</span>`;let s=`<span class="die ${cls}" role="img" aria-label="die showing ${v}">`;for(let i=0;i<9;i++)s+=`<i class="${PIPS[v].includes(i)?"on":""}"></i>`;return s+"</span>"}
function pcHTML(v,s,cls=""){if(v==null)return`<span class="pc back ${cls}" role="img" aria-label="face-down card"></span>`;const r=CARDN(v),su=SUITS[s];return`<span class="pc ${s===1||s===2?"red":""} ${cls}" role="img" aria-label="${r}${su}"><span>${r}${su}</span><span class="s2">${r}${su}</span></span>`}
function pcStr(c,cls=""){const r="23456789TJQKA".indexOf(c[0])+2,s="shdc".indexOf(c[1]);return pcHTML(r===14?1:r,s,cls)}
const coinHTML=(v,cls="")=>`<span class="coin ${cls}" role="img" aria-label="${v?"coin "+v:"hidden coin"}">${v||"?"}</span>`;
function chipsHTML(n){n=Math.max(0,Math.round(n));let h="";for(const[d,c] of [[100,"c100"],[25,"c25"],[5,"c5"],[1,"c1"]]){let k=Math.floor(n/d);n-=k*d;if(!k)continue;h+=`<span class="chipstack">${`<span class="chip ${c}"></span>`.repeat(Math.min(k,10))}</span>`}return`<span class="chips">${h}</span>`}
function pop(host,text,good){if(!host)return;const p=document.createElement("span");p.className="pop "+(good?"g":"b");p.textContent=text;p.style.left=(25+Math.random()*45)+"%";p.style.top="38%";host.appendChild(p);setTimeout(()=>p.remove(),1200)}
function newDeck(){const d=[];for(let s=0;s<4;s++)for(let v=1;v<=13;v++)d.push({v,s});for(let i=d.length-1;i>0;i--){const j=ri(0,i);[d[i],d[j]]=[d[j],d[i]]}return d}
let soundOn=store.get("edgelab-sound")==="1",AC=null;
function sfx(t){if(!soundOn)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const now=AC.currentTime;
  const tone=(f,d,type="sine",v=.07,at=0)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,now+at);g.gain.exponentialRampToValueAtTime(.0001,now+at+d);o.connect(g).connect(AC.destination);o.start(now+at);o.stop(now+at+d+.02)};
  if(t==="good"){tone(660,.12);tone(990,.2,"sine",.07,.1)}else if(t==="bad"){tone(196,.28,"triangle",.09)}
  else if(t==="roll"){for(let k=0;k<6;k++)tone(140+Math.random()*220,.04,"square",.025,k*.06)}
  else if(t==="deal"){tone(1300,.03,"square",.025)}else if(t==="tick"){tone(900,.025,"square",.015)}else if(t==="fill"){tone(523,.09,"triangle",.07)}}catch(e){}}
function sndRender(){const b=$("sndBtn");b.textContent=soundOn?"Sound on":"Sound off";b.setAttribute("aria-pressed",soundOn)}
window.ELsfx=sfx;
$("sndBtn").onclick=()=>{soundOn=!soundOn;store.set("edgelab-sound",soundOn?"1":"0");sndRender();sfx("good")};sndRender();
function timerBar(el,secs,onEnd){el.hidden=false;const i=el.querySelector("i");i.style.transition="none";i.style.transform="scaleX(1)";void i.offsetWidth;i.style.transition=`transform ${secs}s linear`;i.style.transform="scaleX(0)";const t=setTimeout(onEnd,secs*1000);
  return()=>{clearTimeout(t);const m=getComputedStyle(i).transform;i.style.transition="none";i.style.transform=m}}

/* ---------- G1 Card game ---------- */
const DIE=()=>({t:"d",v:die()}),COIN=()=>({t:"o",v:Math.random()<.5?"H":"T"});
const dealN=n=>newDeck().slice(0,n).map(c=>({t:"c",v:c.v,s:c.s}));
const sumV=it=>it.reduce((a,x)=>a+x.v,0);
const CG=[
  {q:"One card from a 52-card deck. A=1 … K=13. Contract pays its value.",f:7,w:"Uniform 1–13: (1+13)/2 = 7.",hid:["c"],sim(){const it=dealN(1);return{val:it[0].v,it}}},
  {q:"Sum of two dice.",f:7,w:"Linearity: 3.5 + 3.5 = 7.",hid:["d","d"],sim(){const it=[DIE(),DIE()];return{val:sumV(it),it}}},
  {q:"Maximum of two dice.",f:161/36,w:"P(max ≤ k) = k²/36, so P(max = k) = (2k−1)/36. EV = Σ k(2k−1)/36 = 161/36 ≈ 4.47.",hid:["d","d"],sim(){const it=[DIE(),DIE()];return{val:Math.max(it[0].v,it[1].v),it}}},
  {q:"Minimum of two dice.",f:91/36,w:"min + max = sum of both dice, so min = 7 − 4.47 = 91/36 ≈ 2.53.",hid:["d","d"],sim(){const it=[DIE(),DIE()];return{val:Math.min(it[0].v,it[1].v),it}}},
  {q:"Number of heads in 10 fair coin flips.",f:5,w:"Linearity: 10 × 0.5 = 5.",hid:Array(10).fill("o"),sim(){const it=Array.from({length:10},COIN);return{val:it.filter(x=>x.v==="H").length,it}}},
  {q:"Sum of three cards dealt without replacement (A=1 … K=13).",f:21,w:"Linearity works without independence: 3 × 7 = 21.",hid:["c","c","c"],sim(){const it=dealN(3);return{val:sumV(it),it}}},
  {q:"Product of two dice.",f:12.25,w:"Independent, so E[XY] = E[X]E[Y] = 3.5 × 3.5 = 12.25.",hid:["d","d"],sim(){const it=[DIE(),DIE()];return{val:it[0].v*it[1].v,it}}},
  {q:"The square of one die roll.",f:91/6,w:"(1+4+9+16+25+36)/6 = 91/6 ≈ 15.17. Note E[X²] ≠ E[X]² = 12.25.",hid:["d"],sim(){const it=[DIE()];return{val:it[0].v**2,it}}},
  {q:"Number of die rolls until the first 6 (including the 6).",f:6,w:"Geometric with p = 1/6: EV = 1/p = 6.",hid:["d","…"],sim(){const it=[];do{it.push(DIE())}while(it[it.length-1].v!==6&&it.length<60);return{val:it.length,it}}},
  {q:"Number of coin flips until the first head.",f:2,w:"Geometric, p = 1/2: EV = 2.",hid:["o","…"],sim(){const it=[];do{it.push(COIN())}while(it[it.length-1].v!=="H"&&it.length<40);return{val:it.length,it}}},
  {q:"Number of aces in a 5-card hand.",f:5/13,w:"Each card is an ace with prob 4/52 = 1/13. Linearity: 5/13 ≈ 0.385.",hid:["c","c","c","c","c"],sim(){const it=dealN(5);return{val:it.filter(x=>x.v===1).length,it}}},
  {q:"Sum of a die and a card (A=1 … K=13).",f:10.5,w:"3.5 + 7 = 10.5.",hid:["d","c"],sim(){const it=[DIE(),dealN(1)[0]];return{val:sumV(it),it}}},
  {q:"Number of distinct faces seen in 3 die rolls.",f:91/36,w:"Each face appears with prob 1 − (5/6)³ = 91/216. Six faces: 6 × 91/216 = 91/36 ≈ 2.53.",hid:["d","d","d"],sim(){const it=[DIE(),DIE(),DIE()];return{val:new Set(it.map(x=>x.v)).size,it}}},
  {q:"Number of sixes in 12 die rolls.",f:2,w:"12 × 1/6 = 2.",hid:Array(12).fill("d"),sim(){const it=Array.from({length:12},DIE);return{val:it.filter(x=>x.v===6).length,it}}}
];
function itemHTML(x,cls=""){if(x==="…")return`<span class="mono" style="font-size:24px;padding:0 6px">…</span>`;if(x.t==="d")return dieHTML(x.v,cls);if(x.t==="c")return pcHTML(x.v,x.s,cls);return coinHTML(x.v,cls)}
let cg={i:0,bid:0,ask:0,done:true,edge:0,real:0,n:0,streak:0,best:0,cancel:null};
function cgStats(){$("cgStreak").textContent=`Streak ${cg.streak} · best ${cg.best}`;
  $("cgStats").innerHTML=`<div><span>Contracts</span><b>${cg.n}</b></div><div><span>Expected edge (skill)</span><b>${signed(cg.edge)}</b></div><div><span>Realised P&amp;L (luck)</span><b>${signed(cg.real)}</b></div>`}
function cgNew(){
  if(cg.cancel){cg.cancel();cg.cancel=null}
  cg.i=ri(0,CG.length-1);const c=CG[cg.i];const sc=Math.max(0.3,c.f*0.12);const w=Math.max(0.2,Math.round(sc*rnd(0.6,1.4)*4)/4);
  let mid=c.f+(Math.random()<0.25?0:(Math.random()<.5?-1:1)*sc*rnd(0.6,2));mid=Math.round(mid*4)/4;
  cg.bid=+(mid-w/2).toFixed(2);cg.ask=+(mid+w/2).toFixed(2);cg.done=false;
  const sm=c.hid.length>8?" sm":"";
  $("cgQ").textContent=c.q;$("cgItems").innerHTML=c.hid.map(t=>t==="…"?itemHTML("…"):itemHTML({t,v:null},"deal"+sm)).join("");
  $("cgSettle").textContent="";$("cgBidTxt").textContent=fmt(cg.bid);$("cgAskTxt").textContent=fmt(cg.ask);
  $("cgOut").textContent="Work out the fair value before you click.";
  if($("cgClock").checked)cg.cancel=timerBar($("cgTimer"),8,()=>{if(!cg.done)cgAct("timeout")});else $("cgTimer").hidden=true;
  sfx("deal");cgStats();
}
async function cgAct(a){
  if(cg.done)return;cg.done=true;if(cg.cancel){cg.cancel();cg.cancel=null}
  const c=CG[cg.i],f=c.f;const eb=f-cg.ask,es=cg.bid-f,best=Math.max(0,eb,es);
  const act=a==="timeout"?"pass":a;const got=act==="buy"?eb:act==="sell"?es:0;
  const right=a!=="timeout"&&Math.abs(got-best)<1e-9;
  cg.streak=right?cg.streak+1:0;cg.best=Math.max(cg.best,cg.streak);cg.edge+=got;cg.n++;
  const ideal=best===0?"pass":eb>es?"buy":"sell";sfx(right?"good":"bad");
  $("cgOut").innerHTML=`<span class="${right?"good":"bad"}">${a==="timeout"?"Too slow: the clock ran out, so you passed.":right?"Correct.":"Not the best choice."}</span> Fair value = ${fmt(f,3)}\n${c.w}\nBuy edge = fair − ask = ${fmt(eb,2)} · Sell edge = bid − fair = ${fmt(es,2)} → best: ${ideal}. Expected edge earned: ${signed(got)}.`;
  const r=c.sim(),sm=r.it.length>8?" sm":"",box=$("cgItems");box.innerHTML="";
  sfx(r.it[0].t==="d"?"roll":"deal");
  for(const x of r.it){box.insertAdjacentHTML("beforeend",itemHTML(x,(x.t==="d"?"rolling":"deal")+sm));await sleep(r.it.length>12?35:110)}
  const real=act==="buy"?r.val-cg.ask:act==="sell"?cg.bid-r.val:0;cg.real+=real;
  $("cgSettle").innerHTML=`Settles at <b>${fmt(r.val,Number.isInteger(r.val)?0:2)}</b> · ${act==="pass"?"you passed":`your ${act} realised ${signed(real)}`}`;
  if(act!=="pass")pop($("cgScene"),signed(real),real>=0);
  cgStats();
}
$("cgBuy").onclick=()=>cgAct("buy");$("cgSell").onclick=()=>cgAct("sell");$("cgPass").onclick=()=>cgAct("pass");$("cgNext").onclick=cgNew;cgNew();

/* ---------- G2 Dice market making ---------- */
let md={d:[],t:0,pos:0,cash:0,log:[],total:0,rounds:0,rev:false,over:false,q:[],last:null,busy:false};
function mdFair(){return md.rev?md.d[0]+7:10.5}
function mdDiceRender(anim){$("mdDice").innerHTML=md.d.map((v,i)=>(md.over||(md.rev&&i===0))?dieHTML(v,anim==="all"||(anim==="one"&&i===0)?"rolling":""):dieHTML(0)).join("")}
function mdQueueRender(){$("mdQueue").innerHTML=[0,1,2,3,4].map(i=>{const q=md.q[i];const now=i===md.t&&!md.over;return`<span class="tr ${q?q.k:""} ${now?"now":""}" title="${q?q.title:"waiting"}">${q?q.sym:"?"}</span>`}).join("")}
function mdLadder(){const bid=+$("mdBid").value,ask=+$("mdAsk").value,f=mdFair(),c=Math.round(f*2)/2;let h="";
  for(let p=c+4;p>=c-4-1e-9;p-=.5){const isF=Math.abs(p-f)<.26,hb=Math.abs(p-bid)<1e-9,ha=Math.abs(p-ask)<1e-9,hit=md.last&&Math.abs(md.last.px-p)<1e-9;
    h+=`<div class="b ${hb?"on":""} ${hit&&md.last.side==="b"?"hit":""}" data-px="${p}" data-side="b">${hb?"BID":""}</div><div class="px ${isF?"fair":""}">${fmt(p,1)}${isF?" ◂ fair":""}</div><div class="a ${ha?"on":""} ${hit&&md.last.side==="a"?"hit":""}" data-px="${p}" data-side="a">${ha?"ASK":""}</div>`}
  $("mdLadder").innerHTML=h}
function mdShow(){$("mdStats").innerHTML=`<div><span>Position</span><b>${md.pos>0?"+":""}${md.pos}</b></div><div><span>Cash</span><b>${fmt(md.cash)}</b></div><div><span>Mark-to-fair</span><b>${fmt(md.cash+md.pos*mdFair())}</b></div>`}
function mdNew(){md.d=[die(),die(),die()];md.t=0;md.pos=0;md.cash=0;md.log=[];md.rev=false;md.over=false;md.q=[];md.last=null;
  $("mdBid").value=9.5;$("mdAsk").value=11.5;mdDiceRender();mdQueueRender();mdLadder();mdShow();
  $("mdMsg").textContent="Fair is 10.5. Set your quote, then call the first trader.";$("mdOut").textContent="Round started. Fair = 10.5.";}
async function mdNext(){
  if(md.busy)return;if(md.over){mdNew();return}
  const bid=+$("mdBid").value,ask=+$("mdAsk").value;if(!(ask>bid)){$("mdOut").textContent="Your ask must be above your bid.";return}
  md.busy=true;const idx=md.t;md.t++;const inf=Math.random()<$("mdInf").value/100;const fNow=mdFair();
  const v=inf?md.d[0]+md.d[1]+3.5:fNow+randn()*2.2;
  let msg=`Trader ${md.t} (${inf?"informed: knows dice 1 and 2":"noise"}) values it at ${fmt(v,1)}. `,arrow="·",edge=null;
  if(v>ask){md.pos--;md.cash+=ask;msg+=`Lifts your ask: you SELL 1 at ${ask}.`;arrow="↑";edge=ask-fNow;md.last={px:ask,side:"a"}}
  else if(v<bid){md.pos++;md.cash-=bid;msg+=`Hits your bid: you BUY 1 at ${bid}.`;arrow="↓";edge=fNow-bid;md.last={px:bid,side:"b"}}
  else{msg+="No trade.";md.last=null}
  md.q[idx]={k:inf?"i":"n",sym:(inf?"I":"N")+arrow,title:msg};md.log.push(msg);
  if(edge!==null){sfx("fill");pop($("mdScene"),"edge "+signed(edge,1),edge>=0)}else sfx("tick");
  $("mdMsg").textContent=msg;mdQueueRender();mdLadder();mdShow();
  if(md.t===3&&!md.rev){await sleep(500);sfx("roll");for(let k=0;k<6;k++){$("mdDice").firstElementChild.outerHTML=dieHTML(die());await sleep(60)}
    md.rev=true;mdDiceRender("one");const e=`EVENT: die 1 shows ${md.d[0]}. New fair = ${md.d[0]} + 7 = ${md.d[0]+7}. Re-centre now.`;md.log.push(e);$("mdMsg").textContent=e;mdLadder();mdShow()}
  if(md.t>=5){await sleep(400);sfx("roll");for(let k=0;k<6;k++){$("mdDice").innerHTML=md.d.map(()=>dieHTML(die())).join("");await sleep(60)}
    md.over=true;mdDiceRender("all");const S=md.d[0]+md.d[1]+md.d[2],pnl=md.cash+md.pos*S;md.total+=pnl;md.rounds++;
    md.log.push(`SETTLE at ${md.d.join("+")} = ${S}. Position ${md.pos} × ${S} + cash ${fmt(md.cash)} = P&L ${fmt(pnl)}. Press Next trader for a new round.`);
    $("mdMsg").innerHTML=`Settles at ${S} <span class="stamp ${pnl>=0?"g":"b"}">${signed(pnl)}</span>`;sfx(pnl>=0?"good":"bad");
    $("mdTot").textContent=`Total P&L ${fmt(md.total)} · rounds ${md.rounds}`;mdQueueRender();mdShow()}
  $("mdOut").textContent=md.log.slice(-6).join("\n")+(md.over?"":`\nHint: fair ${fmt(mdFair(),1)}${md.pos?`, you are ${md.pos>0?"long":"short"} ${Math.abs(md.pos)}: skew ${md.pos>0?"down":"up"}.`:""}`);
  md.busy=false;
}
$("mdLadder").addEventListener("click",e=>{const d=e.target.closest("[data-side]");if(!d||md.over)return;const p=+d.dataset.px;
  if(d.dataset.side==="b"){if(p>=+$("mdAsk").value){$("mdOut").textContent="Your bid must stay below your ask.";return}$("mdBid").value=p}
  else{if(p<=+$("mdBid").value){$("mdOut").textContent="Your ask must stay above your bid.";return}$("mdAsk").value=p}
  sfx("tick");md.last=null;mdLadder()});
$("mdBid").oninput=$("mdAsk").oninput=()=>{md.last=null;mdLadder()};
$("mdInf").oninput=()=>$("mdInfv").textContent=$("mdInf").value+"%";
$("mdNext").onclick=mdNext;$("mdNew").onclick=()=>{if(!md.busy)mdNew()};mdNew();

/* ---------- G3 Trading game ---------- */
let tg={cards:[],shown:0,pos:0,cash:0,bid:0,ask:0,traded:0,total:0,over:false,hist:[],trades:[]};
function tgFair(){const sr=tg.cards.slice(0,tg.shown).reduce((a,c)=>a+c.v,0);return sr+(5-tg.shown)*(364-sr)/(52-tg.shown)}
function tgQuote(){const f=tgFair();const unk=5-tg.shown;const noise=unk===0?0:randn()*1.6*Math.sqrt(unk);const mid=Math.round((f+noise)*2)/2;const w=unk===0?0.5:Math.max(1,Math.round(unk*0.8));
  tg.bid=mid-w/2;tg.ask=mid+w/2;tg.traded=0;tg.hist.push({step:tg.shown,mid,fair:f})}
function tgCardsRender(newIdx){$("tgCards").innerHTML=tg.cards.map((c,i)=>i<tg.shown||tg.over?pcHTML(c.v,c.s,i===newIdx?"deal":""):pcHTML(null,0)).join("")}
function tgChart(){const c=$("tgChart"),x=ctxOf(c),W=c.width,H=c.height,pl=40,pr=16,pt=14,pb=24;const showF=$("tgShow").checked||tg.over;
  const ys=[...tg.hist.map(h=>h.mid),...(showF?tg.hist.map(h=>h.fair):[]),...tg.trades.map(t=>t.px)];if(tg.over)ys.push(tg.settle);
  let lo=Math.min(...ys)-2,hi=Math.max(...ys)+2;const X=s=>pl+s/5*(W-pl-pr),Y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb);
  x.font="11px "+css("--f-mono");x.fillStyle=css("--muted");x.strokeStyle=css("--line");x.lineWidth=1;
  for(let s=0;s<=5;s++){x.beginPath();x.moveTo(X(s),pt);x.lineTo(X(s),H-pb);x.stroke();x.fillText(s===0?"start":"card "+s,X(s)-14,H-6)}
  const step=Math.max(1,Math.round((hi-lo)/5));for(let v=Math.ceil(lo);v<=hi;v+=step){x.fillText(v,4,Y(v)+4)}
  const line=(pts,col,w,dash)=>{x.strokeStyle=col;x.lineWidth=w;x.setLineDash(dash||[]);x.beginPath();pts.forEach((p,i)=>i?x.lineTo(X(p[0]),Y(p[1])):x.moveTo(X(p[0]),Y(p[1])));x.stroke();x.setLineDash([])};
  line(tg.hist.map(h=>[h.step,h.mid]),css("--muted"),2,[5,4]);
  if(showF)line(tg.hist.map(h=>[h.step,h.fair]).concat(tg.over?[[5,tg.settle]]:[]),css("--felt"),2.5);
  tg.trades.forEach(t=>{x.fillStyle=t.dir>0?css("--bid"):css("--ask");x.beginPath();const cx=X(t.step)+((t.k||0)*7),cy=Y(t.px);if(t.dir>0){x.moveTo(cx,cy-7);x.lineTo(cx-6,cy+4);x.lineTo(cx+6,cy+4)}else{x.moveTo(cx,cy+7);x.lineTo(cx-6,cy-4);x.lineTo(cx+6,cy-4)}x.fill()});
  if(tg.over){x.strokeStyle=css("--gold");x.lineWidth=2;x.beginPath();x.moveTo(pl,Y(tg.settle));x.lineTo(W-pr,Y(tg.settle));x.stroke();x.fillStyle=css("--gold");x.fillText("settled "+tg.settle,W-pr-80,Y(tg.settle)-5)}
  x.fillStyle=css("--muted");x.fillText("dashed = bot mid"+(showF?" · green = fair value":"")+" · ▲ buy ▼ sell",pl+4,pt+8)}
function tgShow(){
  $("tgQuote").innerHTML=tg.over?`<span class="dim">SETTLED ${tg.settle}</span>`:`<span class="bidc">${fmt(tg.bid,1)}</span><span class="dim">/</span><span class="askc">${fmt(tg.ask,1)}</span>`;
  const m=$("tgMeter").querySelector("i"),p=Math.max(-10,Math.min(10,tg.pos));m.style.left=(50+Math.min(0,p)*5)+"%";m.style.width=Math.abs(p)*5+"%";m.style.background=p>0?"var(--scr-bid)":"var(--scr-ask)";
  const f=tgFair();
  $("tgStats").innerHTML=`<div><span>Position</span><b>${tg.pos>0?"+":""}${tg.pos}</b></div><div><span>Cash</span><b>${fmt(tg.cash,1)}</b></div>`+($("tgShow").checked||tg.over?`<div><span>Fair value</span><b>${fmt(f,2)}</b></div><div><span>Mark-to-fair</span><b>${fmt(tg.cash+tg.pos*f,2)}</b></div>`:"");
  tgChart()}
function tgNew(){tg.cards=newDeck().slice(0,5);tg.shown=0;tg.pos=0;tg.cash=0;tg.over=false;tg.hist=[];tg.trades=[];tg.settle=null;tgQuote();tgCardsRender();tgShow();
  $("tgMsg").textContent="Five face-down cards. Fair starts at 5 × 7 = 35.";$("tgOut").textContent="Trade against the bot's quote, then reveal a card."}
function tgTrade(dir){if(tg.over)return;const q=+$("tgQty").value;if(tg.traded+q>2){$("tgOut").textContent="Max 2 lots per step. Reveal the next card.";return}
  const k=tg.trades.filter(t=>t.step===tg.shown).length;tg.traded+=q;const px=dir>0?tg.ask:tg.bid;tg.pos+=dir*q;tg.cash-=dir*q*px;tg.trades.push({step:tg.shown,px,dir,k});const f=tgFair();
  sfx("fill");pop($("tgScreen"),(dir>0?"BUY ":"SELL ")+q,dir>0);
  $("tgOut").textContent=`${dir>0?"Bought":"Sold"} ${q} at ${fmt(px,1)}.`+($("tgShow").checked?` Fair is ${fmt(f,2)}, so edge = ${fmt(dir*(f-px)*q,2)}.`:"");tgShow()}
function tgReveal(){
  if(tg.over){tgNew();return}
  const before=tgFair();tg.shown++;const c=tg.cards[tg.shown-1];const after=tgFair();sfx("deal");
  let msg=`Card ${tg.shown}: ${CARDN(c.v)} (${c.v}). Fair ${fmt(before,2)} → ${fmt(after,2)}.`;
  if(tg.shown>=5){tg.over=true;const S=tg.cards.reduce((a,c)=>a+c.v,0);tg.settle=S;const pnl=tg.cash+tg.pos*S;tg.total+=pnl;tg.hist.push({step:5,mid:S,fair:S});
    msg+=`\nSETTLE at ${S}. P&L = cash ${fmt(tg.cash,1)} + position ${tg.pos} × ${S} = ${fmt(pnl,2)}. Press Reveal for a new game.`;$("tgTot").textContent=`Total P&L ${fmt(tg.total)}`;
    $("tgMsg").innerHTML=`Sum = ${S} <span class="stamp ${pnl>=0?"g":"b"}">${signed(pnl)}</span>`;sfx(pnl>=0?"good":"bad")}
  else{const rev=tg.cards.slice(0,tg.shown).reduce((a,c)=>a+c.v,0);msg+=`\nWorking: revealed ${rev} + ${5-tg.shown} hidden × (${364-rev} ÷ ${52-tg.shown}) = ${fmt(after,2)}.`;tgQuote();
    $("tgMsg").textContent=`Revealed total ${rev} · ${5-tg.shown} card${5-tg.shown>1?"s":""} still hidden`}
  tgCardsRender(tg.shown-1);$("tgOut").textContent=msg;tgShow();
}
$("tgBuy").onclick=()=>tgTrade(1);$("tgSell").onclick=()=>tgTrade(-1);$("tgReveal").onclick=tgReveal;$("tgNew").onclick=tgNew;$("tgShow").onchange=tgShow;tgNew();

/* ---------- G4 ETF arbitrage ---------- */
let et={s:[],nav:0,bid:0,ask:0,cost:0.05,done:true,pnl:0,n:0,t0:0,timer:null,cancel:null,streak:0,prev:{}};
const ETN=["NOVA","KITE","ORCA","BRIX","LUMA","PYRE"];
function etNew(){
  if(et.cancel)et.cancel();
  const names=[...ETN].sort(()=>Math.random()-.5).slice(0,3);
  et.s=names.map(n=>({n,q:ri(1,4),p:+(rnd(10,120)).toFixed(2)}));et.nav=et.s.reduce((a,s)=>a+s.q*s.p,0);
  const r=Math.random();const off=r<0.33?0:(r<.66?1:-1)*rnd(0.15,1.2);const mid=et.nav+off;const w=+rnd(0.04,0.2).toFixed(2);
  et.bid=+(mid-w/2).toFixed(2);et.ask=+(mid+w/2).toFixed(2);et.done=false;
  $("etTable").innerHTML="<thead><tr><th>Ticker</th><th class='n'>Shares / unit</th><th class='n'>Last</th><th class='n'>Chg</th></tr></thead><tbody>"+et.s.map(s=>{const ch=+(rnd(-1.5,1.5)).toFixed(2);return`<tr><td>${s.n}</td><td class="n">${s.q}</td><td class="n">${fmt(s.p)}</td><td class="n ${ch>=0?"up":"dn"}">${ch>=0?"▲":"▼"} ${fmt(Math.abs(ch))}</td></tr>`}).join("")+"</tbody>";
  $("etQuote").innerHTML=`<span class="dim small">ETF</span> <span class="bidc">${fmt(et.bid)}</span><span class="dim">/</span><span class="askc">${fmt(et.ask)}</span> <span class="dim small">cost ${fmt(et.cost)}/unit</span>`;
  $("etOut").textContent="Compute NAV, then compare with the price you can trade.";
  et.t0=performance.now();clearInterval(et.timer);et.timer=setInterval(()=>{$("etTimer").textContent=fmt((performance.now()-et.t0)/1000,1)+"s"},100);
  et.cancel=timerBar($("etBar"),15,()=>{if(!et.done)etAct("timeout")});sfx("tick");
}
function etAct(a){
  if(et.done)return;et.done=true;clearInterval(et.timer);if(et.cancel){et.cancel();et.cancel=null}const t=(performance.now()-et.t0)/1000;
  const pb=et.nav-et.ask-et.cost,ps=et.bid-et.nav-et.cost;const best=pb>0?"buy":ps>0?"sell":"none";
  const act=a==="timeout"?"none":a;const got=act==="buy"?pb:act==="sell"?ps:0;et.pnl+=got;et.n++;
  const ok=a!=="timeout"&&act===best;et.streak=ok?et.streak+1:0;sfx(ok?"good":"bad");
  if(act!=="none")pop($("etScreen"),signed(got),got>=0);
  $("etOut").innerHTML=`<span class="${ok?"good":"bad"}">${a==="timeout"?"Too slow":ok?"Correct":"Missed"}</span> in ${fmt(t,1)}s.\nNAV = ${et.s.map(s=>s.q+"×"+fmt(s.p)).join(" + ")} = ${fmt(et.nav,2)}\nBuy ETF: NAV − ask − cost = ${fmt(pb,2)} · Sell ETF: bid − NAV − cost = ${fmt(ps,2)} → best: ${best==="none"?"no trade":best+" the ETF"}. You made ${fmt(got,2)}.`;
  $("etTot").textContent=`P&L ${fmt(et.pnl)} · ${et.n} decisions`;$("etStreak").textContent=`Streak ${et.streak}`;
}
$("etBuy").onclick=()=>etAct("buy");$("etSell").onclick=()=>etAct("sell");$("etNone").onclick=()=>etAct("none");$("etNext").onclick=etNew;etNew();

/* ---------- G5 Fermi ---------- */
const FQ=[
  ["Distance from the Earth to the Moon, in km.",384400,"Light takes about 1.3 s; 1.3 × 300,000 km/s ≈ 390,000."],
  ["Height of Mount Everest, in metres.",8849,"Cruising jets fly ~10 km; Everest is a bit lower."],
  ["Population of Australia (2025), in people.",27000000,"Roughly 5 cities of 1–5 million plus regional areas."],
  ["Population of Shanghai (2020 census), in people.",24870000,"One of the world's largest cities at roughly 25 million."],
  ["World population (2025).",8200000000,"Two giants of ~1.4 billion each make up a third."],
  ["Seconds in a year.",31536000,"365 × 24 × 3,600 ≈ π × 10⁷."],
  ["Bones in an adult human body.",206,""],
  ["Member states of the United Nations.",193,""],
  ["Speed of sound in air at 20°C, in m/s.",343,"Thunder: about 3 seconds per kilometre."],
  ["Keys on a standard piano.",88,"Seven octaves plus a few: 7 × 12 + 4."],
  ["Height of the Eiffel Tower including antennas, in metres.",330,"About 100 storeys at ~3 m each."],
  ["Heartbeats of an adult in one day.",100000,"70 per minute × 1,440 minutes ≈ 100,000."],
  ["Great-circle distance Sydney to Shanghai, in km.",7850,"About a 10-hour flight at 800 km/h."],
  ["Total length of the Great Wall including all branches (2012 survey), in km.",21196,""],
  ["Grains of rice on a chessboard if square 1 has 1 grain and each square doubles: total grains.",1.8e19,"2⁶⁴ − 1 ≈ 1.8 × 10¹⁹. Use 2¹⁰ ≈ 10³."],
  ["Words in a typical 300-page novel.",90000,"~300 words per page × 300 pages."]
];
let fm={i:0,hit:0,n:0,score:0,done:false,hist:[]};
const SUP={"-":"⁻",0:"⁰",1:"¹",2:"²",3:"³",4:"⁴",5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹"};
function num(s){s=String(s).replace(/,/g,"").trim().toLowerCase();const m=s.match(/^([\d.]+)\s*(k|m|bn|b)?$/);if(m){const mul={k:1e3,m:1e6,b:1e9,bn:1e9}[m[2]]||1;return parseFloat(m[1])*mul}return Number(s)}
function fmDraw(T,hitState){const c=$("fmCanvas"),x=ctxOf(c),W=c.width,H=c.height;let lo=num($("fmLo").value),hi=num($("fmHi").value);
  const ok=v=>v>0&&isFinite(v);if(ok(lo)&&ok(hi)&&lo>hi)[lo,hi]=[hi,lo];
  const vals=[lo,hi,T].filter(ok);const ink=css("--table-ink");x.fillStyle=ink;x.strokeStyle=ink;x.font="12px "+css("--f-mono");
  if(!vals.length){x.globalAlpha=.7;x.fillText("Type a low and a high estimate to see your interval on a log scale.",14,H/2);x.globalAlpha=1;return}
  let a=Math.floor(Math.log10(Math.min(...vals)))-1,b=Math.ceil(Math.log10(Math.max(...vals)))+1;if(b-a<4)b=a+4;
  const X=v=>24+(Math.log10(v)-a)/(b-a)*(W-48),y=72;x.globalAlpha=.6;x.lineWidth=1;x.beginPath();x.moveTo(24,y);x.lineTo(W-24,y);x.stroke();
  const stepK=Math.ceil((b-a)/12);for(let k=a;k<=b;k+=stepK){x.beginPath();x.moveTo(X(10**k),y-4);x.lineTo(X(10**k),y+4);x.stroke();const lab="10"+String(k).split("").map(ch=>SUP[ch]).join("");x.fillText(lab,X(10**k)-10,y+20)}
  x.globalAlpha=1;
  if(ok(lo)&&ok(hi)){x.fillStyle=hitState===false?css("--down"):css("--up");x.globalAlpha=.85;x.fillRect(X(lo),y-16,Math.max(3,X(hi)-X(lo)),12);x.globalAlpha=1;x.fillStyle=ink;x.fillText(`your 90% range · ${fmt(Math.log10(hi/lo),2)} orders wide`,Math.min(X(lo),W-260),y-24)}
  if(ok(T)){x.fillStyle=css("--gold");const cx=X(T);x.beginPath();x.moveTo(cx,y-2);x.lineTo(cx-7,y+12);x.lineTo(cx+7,y+12);x.fill();x.fillText("true: "+T.toLocaleString("en-US"),Math.min(Math.max(4,cx-50),W-200),y+38)}}
function fmNew(){fm.i=ri(0,FQ.length-1);fm.done=false;$("fmQ").textContent=FQ[fm.i][0];$("fmLo").value="";$("fmHi").value="";$("fmOut").textContent="Scientific notation works: 3e5 = 300,000. Shorthands like 25m or 8bn work too.";fmDraw()}
async function fmSub(){if(fm.done)return;let lo=num($("fmLo").value),hi=num($("fmHi").value);if(!(lo>0&&hi>0)){$("fmOut").textContent="Enter two positive numbers.";return}
  if(lo>hi)[lo,hi]=[hi,lo];fm.done=true;const T=FQ[fm.i][1];const hit=T>=lo&&T<=hi;const w=Math.log10(hi/lo);const pts=hit?Math.max(5,Math.round(100-30*w)):0;
  fm.n++;if(hit)fm.hit++;fm.score+=pts;fm.hist.push(hit);await sleep(250);fmDraw(T,hit);sfx(hit?"good":"bad");
  $("fmDots").innerHTML=fm.hist.slice(-20).map(h=>`<span class="dotr ${h?"h":"m"}" title="${h?"hit":"miss"}"></span>`).join("");
  $("fmOut").innerHTML=`<span class="${hit?"good":"bad"}">${hit?"Inside":"Outside"}</span>. True answer: ${T.toLocaleString("en-US")}. Your width: ${fmt(w,2)} orders of magnitude → ${pts} pts.\n${FQ[fm.i][2]}\nCalibration so far: ${fm.hit}/${fm.n} = ${fmt(100*fm.hit/fm.n,0)}% (target 90%). ${fm.n>=5&&fm.hit/fm.n<0.8?"You are overconfident: widen your ranges.":fm.n>=5&&fm.hit/fm.n===1?"All hits: you may be too wide. Try narrowing.":""}`;
  $("fmTot").textContent=`Hit ${fm.hit}/${fm.n} · score ${fm.score}`}
$("fmLo").oninput=$("fmHi").oninput=()=>{if(!fm.done)fmDraw()};
$("fmSub").onclick=fmSub;$("fmNext").onclick=fmNew;fmNew();

/* ---------- G6 Event contracts ---------- */
const EVC=[
  ["A startup in this sector gets acquired within 3 years about 10% of the time. News: it just hired a well-known corporate-development lead. Such hires are 3× more common at firms that later get acquired.",0.10,3],
  ["A team wins 40% of its away games. News: their top scorer is out. Teams missing their top scorer win away games only 0.6× as often, in odds terms.",0.40,0.6],
  ["A central bank cuts rates at about 25% of meetings. News: the governor's speech used dovish language seen 4× more often before cuts.",0.25,4],
  ["30% of product launches like this ship on time. News: the beta slipped a week. Slips are 0.5× as likely for launches that end up on time.",0.30,0.5],
  ["A candidate with this polling lead wins 70% of the time. News: a fresh poll widens the lead; such polls are 2× more likely if they will win.",0.70,2],
  ["It rains on 20% of days this month. News: the morning is overcast, which happens 3.5× as often on days it rains.",0.20,3.5]
];
let evc={i:0,p:0,pnl:0,cal:0,n:0,checked:false,busy:false,outcome:null};
function evcGauge(){const c=$("evcGauge"),x=ctxOf(c),W=c.width,H=c.height,ink=css("--table-ink");const X=v=>20+v/100*(W-40),y=64;
  const b=+$("evcBid").value,a=+$("evcAsk").value,u=+$("evcP").value;x.font="11px "+css("--f-mono");
  x.strokeStyle=ink;x.globalAlpha=.6;x.lineWidth=1;x.beginPath();x.moveTo(X(0),y);x.lineTo(X(100),y);x.stroke();
  x.fillStyle=ink;for(let v=0;v<=100;v+=25){x.fillRect(X(v)-.5,y-4,1,8);x.fillText(v+"¢",X(v)-8,y+20)}x.globalAlpha=1;
  if(a>b){x.fillStyle=css("--up");x.globalAlpha=.35;x.fillRect(X(b),y-18,X(a)-X(b),14);x.globalAlpha=1;x.fillStyle=css("--scr-bid");x.fillRect(X(b)-1,y-22,3,22);x.fillStyle=css("--scr-ask");x.fillRect(X(a)-1,y-22,3,22);x.fillStyle=ink;x.fillText("your quote",X(b),y-28)}
  x.fillStyle=ink;x.beginPath();x.arc(X(u),y,4,0,7);x.fill();
  if(evc.checked){x.fillStyle=css("--gold");const t=evc.p*100;x.beginPath();x.moveTo(X(t),y+4);x.lineTo(X(t)-6,y+15);x.lineTo(X(t)+6,y+15);x.fill();x.fillText("Bayes p "+fmt(t,1),Math.min(X(t)-30,W-110),y+44)}
  if(evc.outcome!==null){x.fillStyle=evc.outcome?css("--up"):css("--down");x.fillRect(X(evc.outcome?100:0)-3,y-30,6,30)}}
function evcNew(){if(evc.busy)return;evc.i=ri(0,EVC.length-1);const [q,p0,L]=EVC[evc.i];const o=p0/(1-p0)*L;evc.p=o/(1+o);evc.checked=false;evc.outcome=null;
  $("evcQ").textContent=q;$("evcTape").textContent="Tape is empty. Quote, then open the market.";$("evcStamp").textContent="";
  $("evcOut").textContent="Enter your probability, then check it. Then quote and open the market.";evcGauge()}
function evcCheck(){const u=+$("evcP").value/100;const [,p0,L]=EVC[evc.i];const o0=p0/(1-p0),o=o0*L;evc.n++;const ok=Math.abs(u-evc.p)<=0.03;if(ok)evc.cal++;evc.checked=true;sfx(ok?"good":"bad");
  $("evcOut").innerHTML=`<span class="${ok?"good":"warn"}">${ok?"Within 3 points.":"Off by "+fmt(Math.abs(u-evc.p)*100,1)+" points."}</span>\nprior ${fmt(p0*100,0)}% → odds ${fmt(o0,3)} × LR ${L} = ${fmt(o,3)} → p = ${fmt(evc.p*100,1)}%\nNow quote around ${fmt(evc.p*100,0)}¢.`;
  $("evcTot").textContent=`P&L ${fmt(evc.pnl,0)} · calibration ${evc.cal}/${evc.n}`;evcGauge()}
async function evcRun(){if(evc.busy)return;const b=+$("evcBid").value,a=+$("evcAsk").value;if(!(a>b)){$("evcOut").textContent="Ask must be above bid.";return}
  evc.busy=true;evc.outcome=null;$("evcStamp").textContent="";
  const phi=$("evcInf").value/100;const yes=Math.random()<evc.p;const S=yes?100:0;let pos=0,cash=0,ni=0,nn=0;const tape=$("evcTape");tape.innerHTML="";
  for(let k=0;k<40;k++){let line=null,inf=false;
    if(Math.random()<phi){inf=true;if(yes&&a<100){pos--;cash+=a;ni++;line=["BUY",a]}else if(!yes&&b>0){pos++;cash-=b;ni++;line=["SELL",b]}}
    else{const v=evc.p*100+randn()*15;if(v>a){pos--;cash+=a;nn++;line=["BUY",a]}else if(v<b){pos++;cash-=b;nn++;line=["SELL",b]}}
    const n=String(k+1).padStart(2," ");
    tape.insertAdjacentHTML("beforeend",line?`<div><span class="dim">#${n}</span> ${inf?'<span class="dn">INFORMED</span>':"noise   "} ${line[0]==="BUY"?'<span class="askc">BUYS </span>':'<span class="bidc">SELLS</span>'} 1 @ ${line[1]}¢  <span class="dim">your pos ${pos>0?"+":""}${pos}</span></div>`:`<div class="dim">#${n} no trade</div>`);
    tape.scrollTop=tape.scrollHeight;if(line)sfx("tick");await sleep(45)}
  const pnl=cash+pos*S;evc.pnl+=pnl;evc.outcome=yes;evcGauge();sfx(pnl>=0?"good":"bad");
  $("evcStamp").innerHTML=`<span class="stamp ${yes?"g":"b"}">${yes?"YES · 100¢":"NO · 0¢"}</span> <span style="margin-left:10px">P&amp;L ${signed(pnl,0)}¢</span>`;
  $("evcOut").innerHTML=`Outcome: <b>${yes?"YES (100)":"NO (0)"}</b>. Fills: ${nn} noise, ${ni} informed. Net position ${pos}.\nP&L = cash ${fmt(cash,0)} + ${pos} × ${S} = <span class="${pnl>=0?"good":"bad"}">${fmt(pnl,0)}</span>¢\nEach noise fill earns about half your width (${fmt((a-b)/2,1)}¢) on average; each informed fill loses about ${fmt(yes?100-a:b,0)}¢. Raise the informed share and watch how wide you must go.`;
  $("evcTot").textContent=`P&L ${fmt(evc.pnl,0)} · calibration ${evc.cal}/${evc.n}`;evc.busy=false}
["evcBid","evcAsk","evcP"].forEach(i=>$(i).addEventListener("input",evcGauge));
$("evcInf").oninput=()=>$("evcInfv").textContent=$("evcInf").value+"%";
$("evcCheck").onclick=evcCheck;$("evcRun").onclick=evcRun;$("evcNext").onclick=evcNew;evcNew();

/* ---------- G7 Higher or lower ---------- */
let hl={deck:[],cur:null,bank:1000,path:[1000],streak:0};
function hlProbs(){const h=hl.deck.filter(c=>c.v>hl.cur.v).length,l=hl.deck.filter(c=>c.v<hl.cur.v).length,n=hl.deck.length;return{ph:h/n,pl:l/n,h,l,n}}
function hlHist(){const c=$("hlHist"),x=ctxOf(c),W=c.width,H=c.height,ink=css("--table-ink");const cnt=Array(14).fill(0);hl.deck.forEach(d=>cnt[d.v]++);
  const bw=(W-20)/13;x.font="11px "+css("--f-mono");
  for(let r=1;r<=13;r++){const h=cnt[r]/4*(H-40);x.fillStyle=r>hl.cur.v?css("--scr-bid"):r<hl.cur.v?css("--scr-ask"):ink;x.globalAlpha=r===hl.cur.v?.4:.9;
    x.fillRect(10+(r-1)*bw+3,H-22-h,bw-6,h);x.globalAlpha=.8;x.fillStyle=ink;x.fillText(CARDN(r),10+(r-1)*bw+bw/2-4,H-6)}
  x.globalAlpha=1;const p=hlProbs();x.fillStyle=css("--scr-bid");x.fillText(`higher ${p.h}/${p.n} = ${fmt(p.ph*100,0)}%`,10,14);x.fillStyle=css("--scr-ask");x.fillText(`lower ${p.l}/${p.n} = ${fmt(p.pl*100,0)}%`,W-150,14)}
function hlSpark(){const c=$("hlSpark"),x=ctxOf(c),W=c.width,H=c.height,P=hl.path;const lo=Math.min(...P,1000)*0.95,hi=Math.max(...P,1000)*1.05;
  const X=i=>30+i/Math.max(1,P.length-1)*(W-40),Y=v=>8+(hi-v)/(hi-lo||1)*(H-24);
  x.strokeStyle=css("--line");x.setLineDash([4,4]);x.beginPath();x.moveTo(30,Y(1000));x.lineTo(W-10,Y(1000));x.stroke();x.setLineDash([]);
  x.strokeStyle=css("--felt");x.lineWidth=2;x.beginPath();P.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v)));x.stroke();
  x.fillStyle=css("--felt");x.beginPath();x.arc(X(P.length-1),Y(P[P.length-1]),4,0,7);x.fill();
  x.fillStyle=css("--muted");x.font="11px "+css("--f-mono");x.fillText("bankroll · start 1,000",34,H-4)}
function hlStake(){const f=$("hlF").value/100;$("hlFv").textContent=$("hlF").value+"%";$("hlStakeTxt").textContent=fmtN(hl.bank*f);$("hlChips").innerHTML=chipsHTML(Math.min(hl.bank*f/10,400))}
function hlShow(msg,anim){$("hlCard").innerHTML=pcHTML(hl.cur.v,hl.cur.s,"big"+(anim?" deal":""))+`<span class="pc back" style="margin-left:14px"></span>`;
  $("hlLeft").textContent=hl.deck.length+" cards left";$("hlBank").textContent=fmtN(hl.bank);$("hlStreak").textContent="Streak "+hl.streak;hlStake();hlHist();hlSpark();if(msg)$("hlOut").textContent=msg}
function hlReset(){hl.deck=newDeck();hl.cur=hl.deck.pop();hl.bank=1000;hl.path=[1000];hl.streak=0;hlShow("New deck. Bankroll 1,000.",true)}
function hlBet(dir){if(hl.deck.length===0||hl.bank<1){hlReset();return}
  const pr=hlProbs();const f=$("hlF").value/100;const st=hl.bank*f;const nx=hl.deck.pop();
  const win=dir>0?nx.v>hl.cur.v:nx.v<hl.cur.v;hl.bank+=win?st:-st;hl.path.push(hl.bank);hl.streak=win?hl.streak+1:0;
  const p=dir>0?pr.ph:pr.pl;const kb=Math.max(0,2*Math.max(pr.ph,pr.pl)-1);sfx(win?"good":"bad");
  const msg=`${CARDN(hl.cur.v)} → ${CARDN(nx.v)}: ${win?"WIN":"LOSE"} ${fmtN(st)}.\nBefore the draw: p(higher) = ${pr.h}/${pr.n} = ${fmt(pr.ph*100,1)}%, p(lower) = ${pr.l}/${pr.n} = ${fmt(pr.pl*100,1)}%.\nYou picked ${dir>0?"higher":"lower"} (${fmt(p*100,1)}%) and staked ${fmt(f*100,0)}%. Kelly on the best side: ${pr.ph>=pr.pl?"higher":"lower"}, 2p − 1 = ${fmt(kb*100,1)}%.${hl.bank<1?"\nBust. Oversizing does this even with an edge.":""}`;
  hl.cur=nx;hlShow(msg,true);if(st>=1)pop($("hlScene"),(win?"+":"−")+fmtN(st),win)}
$("hlF").oninput=hlStake;$("hlHi").onclick=()=>hlBet(1);$("hlLo").onclick=()=>hlBet(-1);$("hlReset").onclick=hlReset;hlReset();

/* ---------- G8 Betting board ---------- */
const BB_OUT=[["Sum is 2, 3 or 4",6,(a,b)=>a+b<=4],["Sum is 5 or 6",9,(a,b)=>a+b===5||a+b===6],["Sum is exactly 7",6,(a,b)=>a+b===7],["Sum is 8 or 9",9,(a,b)=>a+b===8||a+b===9],["Sum is 10, 11 or 12",6,(a,b)=>a+b>=10],["Doubles",6,(a,b)=>a===b],["Sum is odd",18,(a,b)=>(a+b)%2===1],["Both dice ≥ 4",9,(a,b)=>a>=4&&b>=4]];
let bb={lines:[],score:0,real:0,done:false,busy:false};
function bbNew(){if(bb.busy)return;bb.done=false;const pick=[...BB_OUT].sort(()=>Math.random()-.5).slice(0,6);
  bb.lines=pick.map(([n,w,t])=>{const p=w/36;const m=Math.random()<0.35?rnd(0.85,0.97):rnd(1.03,1.15);return{n,p,w,t,d:+(1/(p*m)).toFixed(2)}});
  $("bbTable").innerHTML="<thead><tr><th>Outcome</th><th class='n'>Odds</th><th>Back</th><th>Result</th></tr></thead><tbody>"+bb.lines.map((l,i)=>`<tr><td>${l.n}</td><td class="n">${fmt(l.d)}</td><td><input type="checkbox" id="bb${i}" aria-label="back ${l.n}"></td><td id="bbR${i}" class="dim">—</td></tr>`).join("")+"</tbody>";
  $("bbDice").innerHTML=dieHTML(0)+dieHTML(0);$("bbMsg").textContent="Back the lines whose odds beat 1 ÷ true probability, then roll.";
  $("bbOut").textContent="Tick each line whose odds beat 1 ÷ true probability."}
async function bbSubmit(){if(bb.done||bb.busy)return;bb.done=true;bb.busy=true;let s=0,best=0,rows=[];const backed=bb.lines.map((l,i)=>$("bb"+i).checked);
  bb.lines.forEach((l,i)=>{const b=backed[i];const e=l.p*l.d-1;if(b)s+=e;if(e>0)best+=e;rows.push(`${l.n.padEnd(22)} p=${l.w}/36=${fmt(l.p,3)}  implied=${fmt(1/l.d,3)}  EV=${e>=0?"+":""}${fmt(e,3)} ${e>0?"BACK":"skip"}${b?(e>0?"  ✓":"  ✗ you backed"):(e>0?"  ✗ missed":"")}`)});
  bb.score+=s;$("bbOut").textContent=rows.join("\n")+`\nYour EV per 1 staked on each: ${fmt(s,3)} (best possible ${fmt(best,3)}).`;
  sfx("roll");for(let k=0;k<7;k++){$("bbDice").innerHTML=dieHTML(die())+dieHTML(die());await sleep(60)}
  const d1=die(),d2=die();$("bbDice").innerHTML=dieHTML(d1,"rolling")+dieHTML(d2,"rolling");let real=0;
  bb.lines.forEach((l,i)=>{const hit=l.t(d1,d2),cell=$("bbR"+i);if(backed[i]){const r=hit?l.d-1:-1;real+=r;cell.className=hit?"up":"dn";cell.textContent=(hit?"WIN ":"LOSE ")+signed(r)}else{cell.className="dim";cell.textContent=hit?"would win":"·"}});
  bb.real+=real;$("bbMsg").innerHTML=`Rolled ${d1} + ${d2} = ${d1+d2} · this board ${backed.some(Boolean)?`<span class="stamp ${real>=0?"g":"b"}">${signed(real)}</span>`:"no bets"}`;
  if(backed.some(Boolean))sfx(real>=0?"good":"bad");
  $("bbTot").textContent=`Expected ${fmt(bb.score,3)} · realised ${signed(bb.real)}`;bb.busy=false}
$("bbSubmit").onclick=bbSubmit;$("bbNew").onclick=bbNew;bbNew();
function arCalc(){const a=+$("arA").value,b=+$("arB").value,S=+$("arS").value;const sum=1/a+1/b;
  if(!(a>1&&b>1)){$("arOut").textContent="Odds must be above 1.";return}
  const sa=S*(1/a)/sum,sb=S*(1/b)/sum;const ret=sa*a;
  $("arOut").innerHTML=`1/${a} + 1/${b} = ${fmt(sum,4)} ${sum<1?'<span class="good">&lt; 1 → arbitrage</span>':'<span class="bad">≥ 1 → no arbitrage</span>'}\nStake ${fmt(sa)} on A and ${fmt(sb)} on B. Either way you get back ${fmt(ret)} → locked profit ${fmt(ret-S)} (${fmt((ret/S-1)*100,2)}%).`}
["arA","arB","arS"].forEach(i=>$(i).oninput=arCalc);arCalc();

/* ---------- Poker: pot odds at the table ---------- */
const H_=r=>r.split(" ").map(x=>x+"h");
const SPOTS=[
  {name:"a gutshot straight draw",hole:["9s","8d"],board:["Jc","7h","2s"],turn:"3d",outs:["Ts","Th","Td","Tc"]},
  {name:"two overcards",hole:["Ad","Kc"],board:["9s","6h","2c"],turn:"4d",outs:["As","Ah","Ac","Ks","Kh","Kd"]},
  {name:"an open-ended straight draw",hole:["9c","8d"],board:["7s","6h","2c"],turn:"Kd",outs:["Ts","Th","Td","Tc","5s","5h","5d","5c"]},
  {name:"a flush draw",hole:["Ah","7h"],board:["Kh","9h","2c"],turn:"4s",outs:H_("2 3 4 5 6 8 T J Q")},
  {name:"a flush draw plus open-ended straight draw",hole:["9h","8h"],board:["7h","6h","Kc"],turn:"2d",outs:[...H_("A K Q J T 5 4 3 2"),"Ts","Td","Tc","5s","5d","5c"]},
  {name:"a flush draw plus one overcard",hole:["Ah","6h"],board:["Qh","9h","2c"],turn:"3s",outs:[...H_("K J T 8 7 5 4 3 2"),"As","Ad","Ac"]},
  {name:"a pair, drawing to two pair or trips",hole:["Js","9d"],board:["9c","5h","2d"],turn:"Kc",outs:["Jh","Jd","Jc","9s","9h"]}
];
const ALL52=[];for(const r of "23456789TJQKA")for(const s of "shdc")ALL52.push(r+s);
let po={ok:0,n:0,done:true,ans:"",chips:0,info:null,busy:false};
function poRender(extra){const i=po.info;$("poVill").innerHTML=pcHTML(null,0,"sm")+pcHTML(null,0,"sm");
  $("poHero").innerHTML=i.hole.map(c=>pcStr(c)).join("");
  const slots=5-i.shown.length;$("poBoard").innerHTML=i.shown.map(c=>pcStr(c)).join("")+(extra||[]).map(c=>pcStr(c,"deal")).join("")+'<span class="pc slot"></span>'.repeat(Math.max(0,slots-(extra||[]).length));
  $("poPot").innerHTML=chipsHTML(Math.min(i.P,400)/4)+`<span>Pot ${i.P}</span>`;$("poBet").innerHTML=chipsHTML(Math.min(i.B,400)/4)+`<span>Bet ${i.B}</span>`}
function poNew(){if(po.busy)return;po.done=false;const sp=SPOTS[ri(0,SPOTS.length-1)];const o=sp.outs.length;const street=Math.random()<0.5?"flop":"turn";const allin=street==="flop"&&Math.random()<0.4;
  const P=ri(4,30)*10;const frac=[0.33,0.5,0.66,0.75,1,1.5][ri(0,5)];const B=Math.round(P*frac);
  const shown=street==="flop"?sp.board.slice():[...sp.board,sp.turn];const unseen=52-2-shown.length;
  const eq=allin?1-((unseen-o)/unseen)*((unseen-1-o)/(unseen-1)):o/unseen;const req=B/(P+2*B);po.ans=eq>req?"call":"fold";
  po.info={d:sp.name,o,street,allin,P,B,eq,req,unseen,hole:sp.hole,shown,outs:sp.outs};poRender();$("poStamp").innerHTML="";
  $("poQ").textContent=`On the ${street}, you hold ${sp.name} (${o} outs). Pot is ${P}. Opponent bets ${B}${allin?" and is all-in (you see both turn and river)":""}. Assume you win only if you hit and get nothing extra later.`;
  $("poOut").textContent="Compare equity with B ÷ (P + 2B).";sfx("deal")}
async function poAct(a){if(po.done||po.busy)return;po.done=true;po.busy=true;po.n++;const ok=a===po.ans;if(ok)po.ok++;const i=po.info;sfx(ok?"good":"bad");
  const rough=i.allin?i.o*4:i.o*2,evCall=i.eq*(i.P+i.B)-(1-i.eq)*i.B;
  $("poOut").innerHTML=`<span class="${ok?"good":"bad"}">${ok?"Correct":"Wrong"}: ${po.ans}.</span>\nRequired = ${i.B} ÷ (${i.P} + 2×${i.B}) = ${fmt(i.req*100,1)}%\nEquity ≈ ${i.o} × ${i.allin?4:2} = ${rough}% (exact ${fmt(i.eq*100,1)}%: ${i.allin?`1 − (${i.unseen-i.o}/${i.unseen})(${i.unseen-1-i.o}/${i.unseen-1})`:`${i.o}/${i.unseen}`})\nEV of calling = ${fmt(i.eq,3)} × ${i.P+i.B} − ${fmt(1-i.eq,3)} × ${i.B} = ${fmt(evCall,1)}`;
  $("poScore").textContent=`${po.ok}/${po.n} correct`;
  const used=new Set([...i.hole,...i.shown]);const deck=ALL52.filter(c=>!used.has(c)).sort(()=>Math.random()-.5);const run=deck.slice(0,i.allin?2:1);
  const extra=[];for(const c of run){extra.push(c);poRender(extra);sfx("deal");await sleep(450)}
  const hit=run.some(c=>i.outs.includes(c));let res=0;if(a==="call"){res=hit?i.P+i.B:-i.B;po.chips+=res}
  $("poStamp").innerHTML=`<span class="stamp ${hit?"g":"b"}">${hit?"HIT":"MISS"}</span>`;
  if(a==="call")pop($("poTable"),(res>=0?"+":"−")+Math.abs(res),res>=0);
  $("poOut").innerHTML+=`\n${a==="call"?`You called and ${hit?"hit":"missed"}: ${res>=0?"+":"−"}${Math.abs(res)} chips.`:`You folded. The runout would have ${hit?"hit":"missed"}.`} One result is luck; the EV is the decision.`;
  $("poChips").textContent=`Chips ${po.chips>=0?"+":"−"}${Math.abs(po.chips)}`;po.busy=false}
$("poCall").onclick=()=>poAct("call");$("poFold").onclick=()=>poAct("fold");$("poNext").onclick=poNew;poNew();
function eqScene(){const toS=v=>v.replace(/\s+/g,"").match(/../g)||[];const H=toS($("eqH").value),vs=$("eqV").value.trim(),B=toS($("eqB").value);
  const valid=c=>/^[2-9TJQKA][shdc]$/i.test(c)&&true,norm=c=>c[0].toUpperCase()+c[1].toLowerCase();
  const cards=a=>a.filter(valid).map(c=>pcStr(norm(c),"deal")).join("");
  const V=/^random$/i.test(vs)||!vs?pcHTML(null,0)+pcHTML(null,0):cards(toS(vs));
  $("eqScene").innerHTML=`<div class="lbl">Opponent</div><div class="items">${V}</div><div class="lbl" style="margin-top:6px">Board</div><div class="items">${cards(B)}${'<span class="pc slot"></span>'.repeat(Math.max(0,5-B.filter(valid).length))}</div><div class="lbl" style="margin-top:6px">You</div><div class="items">${cards(H)}</div>`}

/* ---------- Poker: evaluator + equity ---------- */
const RS="23456789TJQKA",SS="shdc";
function parseCards(s){s=s.replace(/\s+/g,"");if(!s)return[];if(s.length%2)return null;const out=[];for(let i=0;i<s.length;i+=2){const r=RS.indexOf(s[i].toUpperCase()),u=SS.indexOf(s[i+1].toLowerCase());if(r<0||u<0)return null;out.push(u*13+r)}return out}
function eval5(c){
  const r=c.map(x=>x%13+2).sort((a,b)=>b-a),s=c.map(x=>Math.floor(x/13));
  const fl=s.every(v=>v===s[0]);const cnt={};r.forEach(v=>cnt[v]=(cnt[v]||0)+1);
  const g=Object.entries(cnt).map(([v,n])=>[+v,n]).sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  const uniq=g.length===5;let st=0;if(uniq){if(r[0]-r[4]===4)st=r[0];else if(r[0]===14&&r[1]===5)st=5}
  let cat,tb;
  if(st&&fl){cat=8;tb=[st]}else if(g[0][1]===4){cat=7;tb=[g[0][0],g[1][0]]}else if(g[0][1]===3&&g[1][1]===2){cat=6;tb=[g[0][0],g[1][0]]}
  else if(fl){cat=5;tb=r}else if(st){cat=4;tb=[st]}else if(g[0][1]===3){cat=3;tb=g.map(x=>x[0])}else if(g[0][1]===2&&g[1][1]===2){cat=2;tb=g.map(x=>x[0])}
  else if(g[0][1]===2){cat=1;tb=g.map(x=>x[0])}else{cat=0;tb=r}
  let sc=cat;for(let i=0;i<5;i++)sc=sc*15+(tb[i]||0);return sc}
const C7=[];(function(){for(let a=0;a<7;a++)for(let b=a+1;b<7;b++){const k=[];for(let i=0;i<7;i++)if(i!==a&&i!==b)k.push(i);C7.push(k)}})();
function eval7(c){let best=0;for(const k of C7){const v=eval5([c[k[0]],c[k[1]],c[k[2]],c[k[3]],c[k[4]]]);if(v>best)best=v}return best}
const CATN=["High card","One pair","Two pair","Three of a kind","Straight","Flush","Full house","Four of a kind","Straight flush"];
function eqRun(){
  const H=parseCards($("eqH").value),vs=$("eqV").value.trim().toLowerCase(),V=vs==="random"||vs===""?"R":parseCards(vs),B=parseCards($("eqB").value);
  if(!H||H.length!==2||(V!=="R"&&(!V||V.length!==2))||!B||![0,3,4,5].includes(B.length)){$("eqOut").textContent="Check the card format: two cards each, like AsKs, and 0/3/4/5 board cards.";return}
  const used=new Set([...H,...(V==="R"?[]:V),...B]);if(used.size!==2+(V==="R"?0:2)+B.length){$("eqOut").textContent="A card appears twice.";return}
  const N=20000;let w=0,t=0,l=0;const cats=new Array(9).fill(0);const base=[];for(let i=0;i<52;i++)if(!used.has(i))base.push(i);
  for(let it=0;it<N;it++){const d=base.slice();let k=d.length;const draw=()=>{const j=Math.floor(Math.random()*k);const c=d[j];d[j]=d[--k];return c};
    const vv=V==="R"?[draw(),draw()]:V;const bd=B.slice();while(bd.length<5)bd.push(draw());
    const a=eval7([...H,...bd]),b=eval7([...vv,...bd]);cats[Math.floor(a/759375)]++;if(a>b)w++;else if(a<b)l++;else t++}
  const eq=(w+t/2)/N;const se=Math.sqrt(eq*(1-eq)/N);
  $("eqOut").textContent=`Win ${fmt(100*w/N,1)}%  Tie ${fmt(100*t/N,1)}%  Lose ${fmt(100*l/N,1)}%\nEquity = win + tie/2 = ${fmt(eq*100,1)}%  (± ${fmt(1.96*se*100,1)}% at 95%, from √(p(1−p)/n))\nYour final hand: `+cats.map((c,i)=>c?`${CATN[i]} ${fmt(100*c/N,1)}%`:"").filter(Boolean).join(", ");
}
$("eqRun").onclick=()=>{eqRun();eqScene()};eqScene();

/* ---------- Poker: bluff calc ---------- */
function blRender(){const P=+$("blP").value||1,B=+$("blB").value;$("blBv").textContent=B;
  const be=B/(P+B),mdf=P/(P+B),req=B/(P+2*B),bluffShare=B/(P+2*B);
  $("blStats").innerHTML=`<div><span>Bet / pot</span><b>${fmt(B/P*100,0)}%</b></div><div><span>Bluff needs folds</span><b>${fmt(be*100,1)}%</b></div><div><span>Defender must continue</span><b>${fmt(mdf*100,1)}%</b></div><div><span>Caller needs equity</span><b>${fmt(req*100,1)}%</b></div><div><span>Bluffs in betting range</span><b>${fmt(bluffShare*100,1)}%</b></div><div><span>Value : bluff</span><b>${fmt((1-bluffShare)/bluffShare,2)} : 1</b></div>`}
$("blP").oninput=blRender;$("blB").oninput=blRender;blRender();

/* ---------- Bridge ---------- */
function brRender(){const m=+$("brM").value,s=Math.max(1e-9,+$("brS").value),n=Math.round(Math.pow(10,+$("brN").value));$("brNv").textContent=fmtN(n);
  const t=m*Math.sqrt(n)/s,pp=Phi(t),n95=Math.ceil(Math.pow(1.96*s/Math.max(Math.abs(m),1e-9),2));
  $("brStats").innerHTML=`<div><span>Expected total</span><b>${fmt(m*n,1)}</b></div><div><span>σ of total</span><b>${fmt(s*Math.sqrt(n),1)}</b></div><div><span>t-statistic</span><b>${fmt(t,2)}</b></div><div><span>P(ahead after n)</span><b>${fmt(pp*100,1)}%</b></div><div><span>n for t = 1.96</span><b>${fmtN(n95)}</b></div>`;
  $("brOut").textContent=`Expected profit grows with n, but noise grows with √n, so t grows with √n.\nAt t ≥ 1.96 you can reject "no edge" at the 5% level, which is a hypothesis test from econometrics.\nPoker example: a strong win rate of 5 bb/100 with σ ≈ 100 bb/100 needs about ${fmtN(Math.pow(1.96*100/5,2)*100)} hands to be statistically convincing.`}
["brM","brS","brN"].forEach(i=>$(i).oninput=brRender);brRender();

/* ---------- right-hand progress rail ---------- */
(function(){
  const rail=$("scrub"),track=$("scrubTrack"),fill=$("scrubFill"),thumb=$("scrubThumb"),label=$("scrubLabel"),tip=$("scrubTip");
  const els=[...document.querySelectorAll(".part, section.mod")];
  const marks=els.map(el=>{const isPart=el.classList.contains("part");
    const name=isPart?(el.querySelector(".part-head span").textContent+" · "+el.querySelector("h2").textContent):el.querySelector("h3").textContent;
    const d=document.createElement("span");d.className="scrub-mk"+(isPart?" part":"");track.insertBefore(d,thumb);
    return{el,id:el.id,name,isPart,dot:d,f:0}});
  let maxY=1,cur=-1,hideT=0,drag=false;
  const clamp=v=>Math.max(0,Math.min(1,v));
  function layout(){maxY=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    marks.forEach(m=>{m.f=clamp((m.el.getBoundingClientRect().top+scrollY-24)/maxY);m.dot.style.top=(m.f*100)+"%"});update()}
  function idxAt(f){let k=0;marks.forEach((m,i)=>{if(m.f<=f+0.002)k=i});return k}
  function update(){const f=clamp(scrollY/maxY);fill.style.height=(f*100)+"%";thumb.style.top=(f*100)+"%";
    const k=idxAt(f);rail.setAttribute("aria-valuenow",Math.round(f*100));
    marks.forEach((m,i)=>{m.dot.classList.toggle("passed",m.f<=f+0.002);m.dot.classList.toggle("cur",i===k);m.dot.classList.toggle("done",!!done[m.id])});
    if(k!==cur){cur=k;rail.setAttribute("aria-valuetext",marks[k].name)}
    label.innerHTML=`<b>${Math.round(f*100)}%</b>`;label.appendChild(document.createTextNode(marks[k].name))}
  function flash(){rail.classList.add("show");clearTimeout(hideT);hideT=setTimeout(()=>{if(!drag)rail.classList.remove("show")},1200)}
  function fracFromEvent(e){const r=track.getBoundingClientRect();return clamp((e.clientY-r.top)/r.height)}
  function jumpTo(f){if(window.ELlenis)window.ELlenis.scrollTo(f*maxY,{immediate:true});else scrollTo({top:f*maxY,behavior:"auto"})}
  rail.addEventListener("pointerdown",e=>{drag=true;rail.classList.add("drag","show");try{rail.setPointerCapture(e.pointerId)}catch(_){};jumpTo(fracFromEvent(e));e.preventDefault()});
  rail.addEventListener("pointermove",e=>{const f=fracFromEvent(e);
    if(drag){jumpTo(f);return}
    rail.classList.add("hover");tip.style.top=(f*100)+"%";tip.textContent=marks[idxAt(f)].name});
  const end=()=>{drag=false;rail.classList.remove("drag");flash()};
  rail.addEventListener("pointerup",end);rail.addEventListener("pointercancel",end);
  rail.addEventListener("pointerleave",()=>rail.classList.remove("hover"));
  rail.addEventListener("keydown",e=>{let k=cur;
    if(e.key==="ArrowDown"||e.key==="PageDown")k=Math.min(marks.length-1,cur+1);
    else if(e.key==="ArrowUp"||e.key==="PageUp")k=(scrollY/maxY>marks[cur].f+0.003)?cur:Math.max(0,cur-1);
    else if(e.key==="Home"){jumpTo(0);e.preventDefault();return}
    else if(e.key==="End"){jumpTo(1);e.preventDefault();return}
    else return;
    e.preventDefault();jumpTo(marks[k].f)});
  addEventListener("scroll",()=>{update();flash()},{passive:true});
  addEventListener("resize",layout);
  document.querySelectorAll("details").forEach(d=>d.addEventListener("toggle",layout));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(layout);
  if(window.ResizeObserver)new ResizeObserver(layout).observe(document.querySelector("main"));
  btns.forEach(b=>b.addEventListener("click",update));
  layout();
})();


/* ---------- smooth scroll + index drawer ---------- */
if(window.Lenis&&!reduceMotion){try{const lenis=new Lenis({lerp:.09,smoothWheel:true});window.ELlenis=lenis;const raf=t=>{lenis.raf(t);requestAnimationFrame(raf)};requestAnimationFrame(raf)}catch(e){}}
const menuBtn=$("menuBtn");
function setMenu(on){document.body.classList.toggle("menu",on);menuBtn.setAttribute("aria-expanded",on);menuBtn.textContent=on?"Close":"Index";if(window.ELlenis)on?window.ELlenis.stop():window.ELlenis.start()}
menuBtn.onclick=()=>setMenu(!document.body.classList.contains("menu"));
addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const id=a.getAttribute("href");const t=id.length>1&&document.querySelector(id);setMenu(false);
  if(t&&window.ELlenis){e.preventDefault();window.ELlenis.scrollTo(t,{offset:id==="#top"?0:-90,duration:1.4})}}));
})();
