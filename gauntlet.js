/* Edge Lab · Daily Gauntlet: the same 10 questions for everyone each UTC day. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
if(!$("gxIntro"))return;
const T=window.T||(s=>s),EL=window.EL||{},KIT=window.ELkit||{};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const sfx=t=>{try{KIT.sfx&&KIT.sfx(t)}catch(e){}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SITE="https://edgelab-games.vercel.app";
const LANG=window.EL_LANG||"en",LP=LANG==="en"?"":LANG+"/";

/* ---------- day + seeded randomness ---------- */
const now=new Date(),DAY=now.toISOString().slice(0,10);
const LAUNCH=Date.UTC(2026,9,21),NO=Math.floor((Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())-LAUNCH)/864e5)+1;
function seedFrom(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0}
function rng(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(seedFrom("edgelab-gauntlet-"+DAY));
const ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[Math.floor(R()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const f2=x=>Number(x).toFixed(2),pc=x=>(x*100).toFixed(1)+"%",pc0=x=>Math.round(x*100)+"%";
const card=(v,s)=>KIT.pcHTML?KIT.pcHTML(v,s,"big"):"";
const RN=v=>({1:"A",11:"J",12:"Q",13:"K"}[v]||String(v));
/* multiple choice from numeric candidates: keep the correct one + distinct distractors */
function mc(correct,cands,fmt,gap,neg){const ok=c=>isFinite(c)&&(neg||c>0);const out=[correct];for(const c of cands){if(out.length>=4)break;if(ok(c)&&out.every(o=>Math.abs(o-c)>=gap))out.push(c)}
  let k=1;while(out.length<4&&k<60){const c=correct+(R()<.5?-1:1)*Math.max(gap*1.5,Math.abs(correct)*(.18+.12*k));k++;if(ok(c)&&out.every(o=>Math.abs(o-c)>=gap))out.push(c)}
  const order=shuffle(out.map((v,i)=>({v,i})));return{opts:order.map(o=>fmt(o.v)),ans:order.findIndex(o=>o.i===0)}}

/* ---------- question builders ---------- */
const CONTRACTS=[["Sum of two dice",7,"3.5 + 3.5 = 7"],["Maximum of two dice",161/36,"Σ k(2k−1)/36 = 161/36"],["Minimum of two dice",91/36,"7 − 161/36 = 91/36"],
  ["Heads in 10 fair coin flips",5,"10 × ½ = 5"],["Sum of three cards, A=1 … K=13, no replacement",21,"3 × 7 = 21"],["Product of two dice",12.25,"3.5 × 3.5 = 12.25"],
  ["Square of one die roll",91/6,"(1+4+9+16+25+36) ÷ 6 = 91/6"],["Rolls until the first 6",6,"1 ÷ (1/6) = 6"],["Sixes in 12 die rolls",2,"12 × 1/6 = 2"],
  ["One card, A=1 … K=13",7,"(1 + 13) ÷ 2 = 7"],["A die plus a card (A=1 … K=13)",10.5,"3.5 + 7 = 10.5"]];
const B={
  fair(){const [name,f,why]=pick(CONTRACTS),s=Math.max(.5,f*.08),w=Math.max(.5,Math.round(s*.9*4)/4),cs=pick(["buy","sell","pass"]);let bid,ask;
    if(cs==="buy"){ask=f-s*(.45+R()*.5);bid=ask-w}else if(cs==="sell"){bid=f+s*(.45+R()*.5);ask=bid+w}else{bid=f-s*(.2+R()*.4);ask=f+s*(.2+R()*.4)}
    bid=Math.round(bid*20)/20;ask=Math.round(ask*20)/20;const ans=f>ask?0:f<bid?1:2;
    return{tag:T("Market taking"),q:T("Contract: {0}. The market is {1} / {2}.",T(name),f2(bid),f2(ask)),vis:`<div class="gx-quote"><span class="bidc">${f2(bid)}</span><i>/</i><span class="askc">${f2(ask)}</span></div>`,
      opts:[T("Buy at the ask"),T("Sell at the bid"),T("Pass")],ans,why:T("Fair value = {0} ({1}). {2}",f2(f),why,ans===0?T("Fair is above the ask: buy."):ans===1?T("Fair is below the bid: sell."):T("Fair is inside the quote: pass."))}},
  pot(){let o,P,Bt,eq,req;do{o=pick([4,6,8,9,12,15]);P=ri(4,20)*10;Bt=Math.round(P*pick([.33,.5,.75,1,1.5]));eq=o/47;req=Bt/(P+2*Bt)}while(Math.abs(eq-req)<.03);
    return{tag:T("Pot odds"),q:T("One card to come. You have {0} outs among 47 unseen cards. The pot is {1} and your opponent bets {2}.",o,P,Bt),vis:"",
      opts:[T("Call"),T("Fold")],ans:eq>req?0:1,why:T("You need B ÷ (P + 2B) = {0}. You have {1} ÷ 47 = {2}. {3}",pc(req),o,pc(eq),eq>req?T("Equity beats the price: call."):T("Not enough equity: fold."))}},
  etf(){const names=shuffle(["NOVA","KITE","ORCA","BRIX","LUMA","PYRE"]).slice(0,3),st=names.map(n=>({n,q:ri(1,4),p:Math.round((10+R()*110)*100)/100}));
    const nav=st.reduce((a,s)=>a+s.q*s.p,0),cost=.05,cs=pick(["buy","sell","none"]);let bid,ask;
    if(cs==="buy"){ask=nav-cost-(.1+R()*.7);bid=ask-(.04+R()*.16)}else if(cs==="sell"){bid=nav+cost+(.1+R()*.7);ask=bid+(.04+R()*.16)}else{bid=nav-(.02+R()*.25);ask=nav+(.02+R()*.25)}
    bid=Math.round(bid*100)/100;ask=Math.round(ask*100)/100;const pb=nav-ask-cost,ps=bid-nav-cost,ans=pb>0?0:ps>0?1:2;
    const tbl=`<table class="gx-t"><thead><tr><th>${T("Ticker")}</th><th class="n">${T("Shares")}</th><th class="n">${T("Price")}</th></tr></thead><tbody>${st.map(s=>`<tr><td>${s.n}</td><td class="n">${s.q}</td><td class="n">${f2(s.p)}</td></tr>`).join("")}</tbody></table>`;
    return{tag:T("ETF arbitrage"),q:T("One ETF unit holds these shares. The ETF trades {0} / {1}, and trading the basket costs 0.05 per unit.",f2(bid),f2(ask)),vis:tbl,
      opts:[T("Buy the ETF"),T("Sell the ETF"),T("No trade")],ans,why:T("NAV = {0}. Buy edge = NAV − ask − 0.05 = {1}. Sell edge = bid − NAV − 0.05 = {2}.",f2(nav),f2(pb),f2(ps))}},
  bayes(){const p=pick([.05,.1,.2,.25,.3,.4,.5,.6]),L=pick([.25,.5,2,3,4,5]),o=p/(1-p)*L,post=o/(1+o);
    const m=mc(post,[Math.min(.99,p*L),p,1-post,L/(1+L),post*.6],pc0,.03);
    return{tag:T("Bayes"),q:T("Prior probability {0}. The news you just saw is {1}× as likely if the event is true as if it is false. Posterior probability?",pc0(p),L),vis:"",
      opts:m.opts,ans:m.ans,why:T("Prior odds {0} × LR {1} = {2}. Posterior = {2} ÷ (1 + {2}) = {3}.",f2(p/(1-p)),L,f2(o),pc(post))}},
  kelly(){let p,b,f;do{p=pick([.55,.6,.65,.7]);b=pick([1,1.5,2,3]);f=(b*p-(1-p))/b}while(f<=.02);
    const m=mc(f,[2*f,b*p-(1-p),p-(1-p)*1.5,f/2],pc0,.03);
    return{tag:T("Kelly sizing"),q:T("You win with probability {0}. A win pays {1} to 1; a loss costs your stake. What share of bankroll does Kelly bet?",pc0(p),b),vis:"",
      opts:m.opts,ans:m.ans,why:T("f* = (b·p − q) ÷ b = ({0}×{1} − {2}) ÷ {0} = {3}.",b,f2(p),f2(1-p),pc(f))}},
  hilo(){const r=ri(2,12),s=ri(0,3),h=4*(13-r),p=h/51;const m=mc(p,[(13-r)/13,h/52,(13-r)/12,(4*(13-r)+3)/51],pc0,.012);
    return{tag:T("Higher or lower"),q:T("A fresh deck. The first card is shown. What is the probability the next card is strictly higher?"),vis:card(r,s),
      opts:m.opts,ans:m.ans,why:T("{0} cards rank above {1}, out of 51 left: {0} ÷ 51 = {2}.",h,RN(r),pc(p))}},
  ev(){const p=pick([[1,6],[1,4],[1,3],[2,5],[1,2]]),pr=p[0]/p[1],W=ri(1,8)*5,Lo=ri(1,10)*2,ev=pr*W-(1-pr)*Lo;
    const m=mc(ev,[pr*W,pr*W-Lo,(W-Lo)/2,-ev],x=>(x<0?"−":"")+f2(Math.abs(x)),.4,true);
    return{tag:T("Expected value"),q:T("You win {0} with probability {1}/{2}, otherwise you lose {3}. Expected value of the bet?",W,p[0],p[1],Lo),vis:"",
      opts:m.opts,ans:m.ans,why:T("EV = {0} × {1} − {2} × {3} = {4}.",f2(pr),W,f2(1-pr),Lo,f2(ev))}},
  board(){const O=pick([["Sum is exactly 7",6],["Doubles",6],["Sum is 8 or 9",9],["Sum is odd",18],["Both dice are 4 or more",9],["Sum is 10, 11 or 12",6]]);
    const p=O[1]/36,val=R()<.5,mlt=val?.85+R()*.1:1.05+R()*.1,d=Math.round(100/(p*mlt))/100,x=p*d;
    return{tag:T("Betting board"),q:T("Two dice are rolled. \"{0}\" is offered at decimal odds {1}. Back it or skip?",T(O[0]),f2(d)),vis:"",
      opts:[T("Back it"),T("Skip")],ans:x>1?0:1,why:T("p = {0}/36 = {1}. p × odds = {2}, {3}",O[1],f2(p),f2(x),x>1?T("above 1: positive EV, back it."):T("below 1: negative EV, skip."))}},
  bluff(){const P=100,Bt=pick([25,33,50,66,75,100,150]),be=Bt/(P+Bt);const m=mc(be,[Bt/(P+2*Bt),P/(P+Bt),Bt/P,Bt/(2*P)],pc0,.03);
    return{tag:T("Bluff maths"),q:T("You bluff {0} into a pot of {1}. How often must your opponent fold for the bluff to break even?",Bt,P),vis:"",
      opts:m.opts,ans:m.ans,why:T("Risk ÷ (risk + reward) = {0} ÷ ({0} + {1}) = {2}.",Bt,P,pc(be))}},
  fact(){const F=pick([["Expected maximum of two dice",161/36,[3.5,4,5]],["Expected minimum of two dice",91/36,[2,3,1.75]],["Expected number of rolls until the first 6",6,[3.5,5,7]],
      ["Expected flips until two heads in a row",6,[4,3,8]],["Variance of one fair die",35/12,[3.5,1.71,2.5]],["Expected number of distinct faces in 3 die rolls",91/36,[3,2,2.75]],
      ["Expected value of the square of one die roll",91/6,[12.25,18,13.5]],["Value of a die game where you may re-roll once",4.25,[3.5,4,4.5]]]);
    const m=mc(F[1],F[2],f2,.1);
    return{tag:T("Quick maths"),q:T(F[0])+"?",vis:"",opts:m.opts,ans:m.ans,why:T("Answer: {0}.",f2(F[1]))}}
};
const Qs=shuffle(Object.keys(B)).map(k=>B[k]());

/* ---------- state ---------- */
const N=Qs.length,QSECS=30;let i=0,picks=[],t0=0,qt0=0,tick=0,serverStarted=false,saved=null,doneToday=false;
const LKEY="edgelab-gauntlet-"+DAY;
$("gxNo").textContent=T("No. {0}",NO);$("gxDate").textContent=DAY+" UTC";

function scoreOf(correct,secs){return correct*80+Math.round(200*Math.max(0,1-secs/300)*correct/10)}
function show(id){["gxIntro","gxPlay","gxDone"].forEach(k=>$(k).hidden=k!==id);window.scrollTo(0,0)}
function introState(){const u=EL.user,local=JSON.parse(store.get(LKEY)||"null");
  const st=$("gxStatus");
  if(EL.sb&&!u)st.innerHTML=`<b>${T("Playing as a guest.")}</b> ${T("Your score won't be saved.")} <button class="link" id="gxSignIn">${T("Sign in with Google")}</button> ${T("before you start to join the leaderboard.")}`;
  else if(u)st.innerHTML=`<b>${T("Signed in.")}</b> ${T("Your first attempt today goes on the leaderboard. The clock starts when you press Start.")}`;
  else st.textContent=T("Leaderboards are available on the live site.");
  const b=$("gxSignIn");if(b)b.onclick=()=>EL.openAccount?EL.openAccount():EL.signIn&&EL.signIn();
  if(u&&EL.sb){EL.sb.rpc("my_stats").then(({data})=>{if(!data)return;const s=data.stats,td=data.today;
    if(s)$("gxStreak").innerHTML=T("Streak {0} · best {1} · {2} days played",`<b>${s.streak}</b>`,s.best,s.days);
    if(td&&td.finished_at){doneToday=true;saved={score:td.score,correct:td.correct,results:td.results};$("gxStart").textContent=T("See today's result");
      st.innerHTML=`<b>${T("Done for today.")}</b> ${T("You scored {0}. Come back tomorrow, or replay for practice.",td.score)}`}
    else if(td&&td.started_at){st.innerHTML=`<b>${T("Your clock is already running.")}</b> ${T("You started at {0}. Finish now to save your score.",new Date(td.started_at).toLocaleTimeString())}`}})}
  else if(local&&!u){$("gxStart").textContent=T("Play again");}
}
async function start(){
  if(saved){renderDone(saved.correct,null,saved.results,{score:saved.score},true);return}
  picks=[];i=0;
  if(EL.user&&EL.sb&&!doneToday){const {error}=await EL.sb.rpc("start_gauntlet");serverStarted=!error}else serverStarted=false;
  t0=performance.now();show("gxPlay");renderQ();clearInterval(tick);tick=setInterval(clock,100)}
function clock(){const el=(performance.now()-t0)/1000,q=(performance.now()-qt0)/1000;$("gxClock").textContent=el.toFixed(1)+"s";
  $("gxBar").style.transform=`scaleX(${Math.max(0,1-q/QSECS)})`;if(q>=QSECS&&picks.length===i)answer(-1)}
function renderQ(){const q=Qs[i];qt0=performance.now();
  $("gxIdx").textContent=T("Question {0} of {1}",i+1,N);$("gxTag").textContent=q.tag;
  $("gxDots").innerHTML=Qs.map((_,k)=>`<i class="${k<i?(picks[k]===Qs[k].ans?"g":"r"):k===i?"now":""}"></i>`).join("");
  $("gxQ").textContent=q.q;$("gxVis").innerHTML=q.vis||"";$("gxVis").hidden=!q.vis;
  $("gxOpts").innerHTML=q.opts.map((o,k)=>`<button class="gx-opt" data-k="${k}"><kbd>${k+1}</kbd><span>${esc(o)}</span></button>`).join("");
  $("gxOpts").querySelectorAll("button").forEach(b=>b.onclick=()=>answer(+b.dataset.k));
  const f=$("gxOpts").querySelector("button");if(f)f.focus({preventScroll:true})}
function answer(k){if(picks.length!==i)return;picks.push(k);const q=Qs[i],ok=k===q.ans;sfx(ok?"good":"bad");
  $("gxOpts").querySelectorAll("button").forEach((b,j)=>{b.disabled=true;if(j===q.ans)b.classList.add("ok");else if(j===k)b.classList.add("no")});
  setTimeout(()=>{i++;if(i<N)renderQ();else finish()},ok?420:900)}
addEventListener("keydown",e=>{if($("gxPlay").hidden)return;const n=+e.key;if(n>=1&&n<=Qs[i].opts.length){e.preventDefault();answer(n-1)}});
async function finish(){clearInterval(tick);const secs=(performance.now()-t0)/1000,correct=picks.filter((p,k)=>p===Qs[k].ans).length,
  results=picks.map((p,k)=>p===Qs[k].ans?"g":"r").join("");let server=null;
  if(serverStarted&&EL.sb){const {data,error}=await EL.sb.rpc("submit_gauntlet",{p_correct:correct,p_results:results});if(!error){server=data;doneToday=true}else server={error:error.message}}
  if(!EL.user)store.set(LKEY,JSON.stringify({correct,results,score:scoreOf(correct,secs)}));
  renderDone(correct,secs,results,server,false)}

/* ---------- results ---------- */
let last=null;
function grid(r){return r.split("").map(c=>c==="g"?"🟩":"🟥").join("")}
async function renderDone(correct,secs,results,server,fromSaved){
  const score=server&&server.score!=null?server.score:scoreOf(correct,secs||300);last={score,correct,results,rank:server&&server.rank,streak:null};
  show("gxDone");$("gxScore").textContent=score;$("gxOf").textContent=T("{0}/10 correct",correct)+(secs?` · ${secs.toFixed(0)}s`:"");
  $("gxGrid").innerHTML=results.split("").map(c=>`<i class="${c}"></i>`).join("");
  let note="";
  if(server&&server.error)note=`<span class="bad">${T("Not saved: {0}",esc(server.error))}</span>`;
  else if(server&&server.rank)note=T("Saved. You're <b>#{0}</b> today.",server.rank);
  else if(fromSaved)note=T("Today's saved score.");
  else if(EL.user)note=T("Practice run: not saved.");
  else note=T("Guest score: not saved. Sign in before tomorrow's gauntlet to join the leaderboard.");
  $("gxNote").innerHTML=note;
  if(picks.length===N)$("gxReview").innerHTML=Qs.map((q,k)=>{const ok=picks[k]===q.ans;
    return`<li class="${ok?"g":"r"}"><span class="tg">${esc(q.tag)}</span><p>${esc(q.q)}</p><p class="ans">${ok?"✓":"✗"} ${picks[k]<0?T("Ran out of time."):T("You chose {0}.",`<b>${esc(q.opts[picks[k]])}</b>`)} ${ok?"":T("Answer: {0}.",`<b>${esc(q.opts[q.ans])}</b>`)}</p><p class="why">${esc(q.why)}</p></li>`}).join("");
  else $("gxReview").innerHTML="";
  $("gxReviewWrap").hidden=picks.length!==N;
  if(EL.user&&EL.sb){const {data}=await EL.sb.rpc("my_stats");if(data&&data.stats){last.streak=data.stats.streak;$("gxStreakEnd").innerHTML=T("Streak {0} 🔥",`<b>${data.stats.streak}</b>`)}}
  loadTop();countdown()}
async function loadTop(){const box=$("gxTop");if(!EL.sb){box.innerHTML=`<p class="dim">${T("Leaderboards are available on the live site.")}</p>`;return}
  const {data,error}=await EL.sb.rpc("leaderboard_day",{p_limit:10});
  if(error||!data||!data.length){box.innerHTML=`<p class="dim">${T("No scores yet today. Be the first.")}</p>`;return}
  const me=EL.profile&&EL.profile.display_name;
  box.innerHTML=`<ol class="lb mini">${data.map(r=>`<li class="${r.name===me?"me":""}"><span class="rk">${r.rank}</span>${r.avatar?`<img src="${esc(r.avatar)}" alt="" referrerpolicy="no-referrer">`:`<span class="ph">${esc(r.name.charAt(0))}</span>`}<span class="nm">${esc(r.name)}</span><span class="sc">${r.score}</span></li>`).join("")}</ol>`}
function countdown(){const el=$("gxNext");const f=()=>{const d=new Date(),n=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)-d.getTime();
  const h=Math.floor(n/36e5),m=Math.floor(n/6e4)%60,s=Math.floor(n/1e3)%60;el.textContent=T("Next gauntlet in {0}",`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`)};f();clearInterval(countdown.t);countdown.t=setInterval(f,1000)}

/* ---------- share ---------- */
function shareText(){const l=last;return T("Edge Lab Daily Gauntlet No. {0}: {1}/1000",NO,l.score)+"\n"+grid(l.results)+"\n"+
  (l.streak?T("Streak {0} 🔥",l.streak)+" · ":"")+(l.rank?T("#{0} today",l.rank)+"\n":"\n")+
  T("Ten trading-interview questions a day: fair value, pot odds, ETF arbitrage, Bayes and Kelly.")+"\n"+SITE+"/"+LP+"play/daily.html"}
async function shareImage(){const c=document.createElement("canvas");c.width=1200;c.height=627;const g=c.getContext("2d");
  const gr=g.createRadialGradient(840,250,40,700,320,820);gr.addColorStop(0,"#145a40");gr.addColorStop(.55,"#08281d");gr.addColorStop(1,"#030806");g.fillStyle=gr;g.fillRect(0,0,1200,627);
  g.strokeStyle="rgba(220,182,94,.5)";g.lineWidth=2;g.strokeRect(28,28,1144,571);
  try{await document.fonts.load("800 80px 'Big Shoulders Display'");await document.fonts.load("600 20px 'JetBrains Mono'")}catch(e){}
  g.fillStyle="#dcb65e";g.font="600 22px 'JetBrains Mono',monospace";g.fillText(T("EDGE LAB · DAILY GAUNTLET No. {0}",NO),70,96);
  g.fillStyle="#efe8d8";g.font="800 200px 'Big Shoulders Display','Arial Narrow',sans-serif";g.fillText(String(last.score),64,300);
  const sw=g.measureText(String(last.score)).width;g.fillStyle="rgba(239,232,216,.6)";g.font="600 34px 'JetBrains Mono',monospace";g.fillText("/ 1000",64+sw+20,300);
  last.results.split("").forEach((r,k)=>{g.fillStyle=r==="g"?"#4fe0a2":"#ff6b5e";const x=70+k*58;g.beginPath();g.roundRect?g.roundRect(x,350,46,46,8):g.rect(x,350,46,46);g.fill()});
  g.fillStyle="#efe8d8";g.font="600 28px 'JetBrains Mono',monospace";
  const line=[T("{0}/10 correct",last.correct),last.streak?T("Streak {0}",last.streak):"",last.rank?T("#{0} today",last.rank):""].filter(Boolean).join("  ·  ");g.fillText(line,70,460);
  g.fillStyle="#dcb65e";g.font="600 24px 'JetBrains Mono',monospace";g.fillText(SITE.replace("https://",""),70,548);
  /* chip */g.save();g.translate(1010,200);g.fillStyle="#7a1420";g.beginPath();g.arc(0,0,110,0,7);g.fill();g.fillStyle="#efe8d8";
  for(let k=0;k<8;k++){g.save();g.rotate(k*Math.PI/4);g.fillRect(-12,-110,24,30);g.restore()}g.strokeStyle="#dcb65e";g.lineWidth=5;g.beginPath();g.arc(0,0,72,0,7);g.stroke();
  g.fillStyle="#dcb65e";g.font="800 64px 'Big Shoulders Display',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("EL",0,4);g.restore();
  return new Promise(r=>c.toBlob(r,"image/png"))}
$("gxLinkedIn").onclick=()=>{const t=shareText();copy(t,true);window.open("https://www.linkedin.com/feed/?shareActive=true&text="+encodeURIComponent(t),"_blank","noopener")};
$("gxCopy").onclick=()=>copy(shareText());
$("gxImg").onclick=async()=>{const blob=await shareImage();const file=new File([blob],`edge-lab-gauntlet-${NO}.png`,{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text:shareText()});return}catch(e){if(e&&e.name==="AbortError")return}}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
function copy(t,quiet){const done=()=>{if(!quiet){$("gxShareMsg").textContent=T("Copied. Paste it anywhere.")}else $("gxShareMsg").textContent=T("Post text copied, in case LinkedIn doesn't pre-fill it.")};
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,()=>{});else done()}
$("gxStart").onclick=start;$("gxAgain").onclick=()=>{saved=null;start()};

introState();if(EL.onAuth)EL.onAuth(()=>introState());
})();
