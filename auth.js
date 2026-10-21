/* Edge Lab accounts: optional Google sign-in via Supabase. Guests can play everything; only signed-in scores are kept. */
(function(){
"use strict";
const SB_URL="https://wfkkgawjvruwueyouzow.supabase.co",SB_KEY="sb_publishable_wYl4xhQCuTDKo6PakzFodQ_o29FnfbC";
const T=window.T||(s=>s);
const EL=window.EL=window.EL||{};
let sb=null;
try{if(window.supabase&&/^https?:$/.test(location.protocol))sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce"}})}catch(e){sb=null}
EL.sb=sb;EL.user=null;EL.profile=null;EL.authReady=false;
const subs=[];
EL.onAuth=fn=>{subs.push(fn);if(EL.authReady)fn(EL.user,EL.profile)};
const emit=()=>{EL.authReady=true;render();subs.forEach(f=>{try{f(EL.user,EL.profile)}catch(e){}})};
EL.signIn=()=>{if(!sb)return;const u=new URL(location.href);u.hash="";u.searchParams.delete("code");
  sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:u.toString()}})};
EL.signOut=async()=>{if(sb)await sb.auth.signOut()};
async function loadProfile(){EL.profile=null;if(!sb||!EL.user)return;
  const {data}=await sb.from("profiles").select("display_name,avatar_url").eq("id",EL.user.id).maybeSingle();EL.profile=data||null}
EL.rename=async name=>{name=String(name||"").trim().slice(0,24);if(!sb||!EL.user||name.length<2)return false;
  const {error}=await sb.from("profiles").update({display_name:name}).eq("id",EL.user.id);if(error)return false;await loadProfile();emit();return true};

/* ---------- account chip in the top bar ---------- */
const host=document.querySelector(".tb-r");let chip=null,menu=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initial=n=>esc((n||"?").trim().charAt(0).toUpperCase());
function avatar(p,cls){return p&&p.avatar_url?`<img class="${cls}" src="${esc(p.avatar_url)}" alt="" referrerpolicy="no-referrer">`:`<span class="${cls} ph">${initial(p&&p.display_name)}</span>`}
const root=document.documentElement.dataset.root||"";
function render(){
  if(!host||!sb)return;
  if(!chip){chip=document.createElement("button");chip.className="tb-btn acct";chip.id="acctBtn";chip.setAttribute("aria-haspopup","true");chip.setAttribute("aria-expanded","false");host.appendChild(chip);
    menu=document.createElement("div");menu.className="acct-menu";menu.hidden=true;menu.setAttribute("role","dialog");menu.setAttribute("aria-label",T("Account"));document.body.appendChild(menu);
    chip.addEventListener("click",e=>{e.stopPropagation();toggle()});
    document.addEventListener("click",e=>{if(!menu.hidden&&!menu.contains(e.target))toggle(false)});
    addEventListener("keydown",e=>{if(e.key==="Escape")toggle(false)})}
  if(EL.user){const p=EL.profile||{display_name:(EL.user.user_metadata&&EL.user.user_metadata.full_name)||T("Player")};
    chip.innerHTML=avatar(p,"av")+`<span class="nm">${esc(p.display_name)}</span>`;chip.setAttribute("aria-label",T("Account: {0}",p.display_name));
    menu.innerHTML=`<div class="am-h">${avatar(p,"av lg")}<div><b>${esc(p.display_name)}</b><small>${T("Scores are saved to the leaderboard.")}</small></div></div>
      <a class="am-row" href="${root}play/leaderboard.html" data-nav>${T("Leaderboard")}</a>
      <a class="am-row" href="${root}play/daily.html" data-nav>${T("Daily Gauntlet")}</a>
      <form class="am-rename"><label for="amName">${T("Name on the leaderboard")}</label><div><input id="amName" maxlength="24" minlength="2" value="${esc(p.display_name)}"><button class="go">${T("Save")}</button></div><span class="am-msg" aria-live="polite"></span></form>
      <button class="am-row am-out">${T("Sign out")}</button>`;
    menu.querySelector(".am-out").onclick=async()=>{await EL.signOut();toggle(false)};
    menu.querySelector(".am-rename").onsubmit=async e=>{e.preventDefault();const ok=await EL.rename(menu.querySelector("#amName").value);
      const m=menu.querySelector(".am-msg");if(m)m.textContent=ok?T("Saved."):T("Use 2–24 characters.")};
  }else{
    chip.innerHTML=`<svg class="ic" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z"/></svg><span class="lbl">${T("Sign in")}</span>`;chip.setAttribute("aria-label",T("Sign in"));
    menu.innerHTML=`<div class="am-h"><div><b>${T("Keep your scores")}</b><small>${T("Sign in to save Daily Gauntlet scores, build a streak and appear on the leaderboard. Every game is free to play without an account.")}</small></div></div>
      <button class="am-google"><svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${T("Continue with Google")}</button>
      <small class="am-note">${T("Your leaderboard name is your first name and last initial. You can change it.")}</small>`;
    menu.querySelector(".am-google").onclick=()=>EL.signIn();
  }
}
function toggle(on){if(!menu)return;on=on==null?menu.hidden:on;menu.hidden=!on;chip.setAttribute("aria-expanded",on);
  if(on){const r=chip.getBoundingClientRect();menu.style.top=(r.bottom+8)+"px";menu.style.right=Math.max(12,innerWidth-r.right)+"px";const f=menu.querySelector("button,input,a");if(f)setTimeout(()=>f.focus(),30)}}
EL.openAccount=()=>{render();toggle(true)};

if(!sb){EL.authReady=true;return}
sb.auth.onAuthStateChange((ev,session)=>{const u=session?session.user:null;const changed=(u&&u.id)!==(EL.user&&EL.user.id);EL.user=u;
  if(changed||ev==="INITIAL_SESSION")setTimeout(async()=>{await loadProfile();emit()},0)});
})();
