/* Edge Lab · leaderboard page: today + all-time */
(function(){
"use strict";
const $=id=>document.getElementById(id);
if(!$("lbBody"))return;
const T=window.T||(s=>s),EL=window.EL||{};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const av=r=>r.avatar?`<img src="${esc(r.avatar)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:`<span class="ph">${esc((r.name||"?").charAt(0))}</span>`;
const sq=r=>(r||"").split("").map(c=>`<i class="${c}"></i>`).join("");
let mode="day";
async function load(){
  const body=$("lbBody"),head=$("lbHead");
  document.querySelectorAll("[data-lb]").forEach(b=>b.setAttribute("aria-selected",b.dataset.lb===mode));
  if(!EL.sb){body.innerHTML=`<tr><td colspan="6" class="dim">${T("Leaderboards are available on the live site.")}</td></tr>`;return}
  body.innerHTML=`<tr><td colspan="6" class="dim">${T("Loading…")}</td></tr>`;
  const me=EL.profile&&EL.profile.display_name;
  if(mode==="day"){
    head.innerHTML=`<tr><th class="n">#</th><th>${T("Player")}</th><th class="n">${T("Score")}</th><th class="hide-s">${T("Answers")}</th><th class="n hide-s">${T("Time")}</th></tr>`;
    const {data,error}=await EL.sb.rpc("leaderboard_day",{p_limit:100});
    if(error){body.innerHTML=`<tr><td colspan="5" class="bad">${esc(error.message)}</td></tr>`;return}
    body.innerHTML=data&&data.length?data.map(r=>`<tr class="${r.name===me?"me":""}"><td class="n rk">${r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:r.rank}</td><td><span class="who">${av(r)}${esc(r.name)}</span></td><td class="n sc">${r.score}</td><td class="hide-s"><span class="sq">${sq(r.results)}</span></td><td class="n hide-s">${r.seconds}s</td></tr>`).join("")
      :`<tr><td colspan="5" class="dim">${T("No scores yet today. Be the first.")}</td></tr>`;
  }else{
    head.innerHTML=`<tr><th class="n">#</th><th>${T("Player")}</th><th class="n">${T("Total")}</th><th class="n">${T("Days")}</th><th class="n hide-s">${T("Best")}</th><th class="n">${T("Streak")}</th></tr>`;
    const {data,error}=await EL.sb.rpc("leaderboard_all",{p_limit:100});
    if(error){body.innerHTML=`<tr><td colspan="6" class="bad">${esc(error.message)}</td></tr>`;return}
    body.innerHTML=data&&data.length?data.map(r=>`<tr class="${r.name===me?"me":""}"><td class="n rk">${r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:r.rank}</td><td><span class="who">${av(r)}${esc(r.name)}</span></td><td class="n sc">${r.total}</td><td class="n">${r.days}</td><td class="n hide-s">${r.best}</td><td class="n">${r.streak?r.streak+" 🔥":"0"}</td></tr>`).join("")
      :`<tr><td colspan="6" class="dim">${T("No scores yet. Play today's gauntlet to be first.")}</td></tr>`;
  }
}
document.querySelectorAll("[data-lb]").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.lb;load()}));
function you(){const y=$("lbYou");if(!y)return;
  if(!EL.sb){y.hidden=true;return}
  if(EL.user){EL.sb.rpc("my_stats").then(({data})=>{const s=data&&data.stats;
    y.innerHTML=s?T("You: {0} points over {1} days · best {2} · streak {3}",`<b>${s.total}</b>`,s.days,s.best,s.streak):T("You haven't finished a gauntlet yet.")})}
  else{y.innerHTML=`${T("Playing as a guest.")} <button class="link" id="lbSign">${T("Sign in with Google")}</button> ${T("to get on the board.")}`;
    $("lbSign").onclick=()=>EL.openAccount&&EL.openAccount()}}
if(EL.onAuth)EL.onAuth(()=>{you();load()});else load();
})();
