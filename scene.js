/* Edge Lab · After Hours — 3D casino table (three.js r128 + GSAP) */
(function(){
"use strict";
const stage=document.getElementById("stage");
const fail=()=>document.documentElement.classList.add("no-3d");
if(!stage||!window.THREE){fail();return}
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:stage,antialias:true,powerPreference:"high-performance"})}catch(e){fail();return}
if(!renderer.getContext()){fail();return}
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall=()=>innerWidth<760;
const sfx=t=>{try{window.ELsfx&&window.ELsfx(t)}catch(e){}};
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isSmall()?1.5:2));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const BG=0x050a08;
const scene=new THREE.Scene();scene.background=new THREE.Color(BG);scene.fog=new THREE.Fog(BG,14,34);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,0.1,90);
const cam={px:0,py:3.9,pz:12.6,lx:0,ly:2.5,lz:0,sx:-2.5};
const MAXA=renderer.capabilities.getMaxAnisotropy();
const PI=Math.PI;

/* ---------- tween helper (GSAP when present) ---------- */
const G=window.gsap;
function to(o,v){if(G&&!reduce)return G.to(o,v);
  for(const k in v){if(k==="keyframes"){for(const kk in v.keyframes){const a=v.keyframes[kk];o[kk]=a[a.length-1]}}
    else if(typeof v[k]==="number"&&k!=="duration"&&k!=="delay"&&k in o)o[k]=v[k]}
  if(v.onComplete)v.onComplete()}
const kill=o=>{if(G)G.killTweensOf(o)};
const later=(fn,ms)=>setTimeout(fn,reduce?0:ms);

/* ---------- canvas textures ---------- */
function tex(w,h,draw){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d");draw(g,w,h);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=MAXA;return t}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function suit(g,s,cx,cy,S){g.beginPath();
  if(s===1){g.moveTo(cx,cy+.62*S);g.bezierCurveTo(cx-1.15*S,cy-.1*S,cx-.55*S,cy-.98*S,cx,cy-.36*S);g.bezierCurveTo(cx+.55*S,cy-.98*S,cx+1.15*S,cy-.1*S,cx,cy+.62*S);g.fill();return}
  if(s===2){g.moveTo(cx,cy-.8*S);g.lineTo(cx+.58*S,cy);g.lineTo(cx,cy+.8*S);g.lineTo(cx-.58*S,cy);g.closePath();g.fill();return}
  if(s===0){g.moveTo(cx,cy-.78*S);g.bezierCurveTo(cx+1.15*S,cy-.02*S,cx+.55*S,cy+.82*S,cx,cy+.24*S);g.bezierCurveTo(cx-.55*S,cy+.82*S,cx-1.15*S,cy-.02*S,cx,cy-.78*S);g.fill();
    g.beginPath();g.moveTo(cx,cy+.05*S);g.lineTo(cx+.28*S,cy+.8*S);g.lineTo(cx-.28*S,cy+.8*S);g.closePath();g.fill();return}
  [[0,-.42],[-.38,.07],[.38,.07]].forEach(([dx,dy])=>{g.beginPath();g.arc(cx+dx*S,cy+dy*S,.32*S,0,PI*2);g.fill()});
  g.beginPath();g.moveTo(cx,cy-.05*S);g.lineTo(cx+.26*S,cy+.8*S);g.lineTo(cx-.26*S,cy+.8*S);g.closePath();g.fill()}
const RN=["","A","2","3","4","5","6","7","8","9","10","J","Q","K"],SN=["♠","♥","♦","♣"];
const SERIF="'Times New Roman',Georgia,serif",COND="'Big Shoulders Display','Arial Narrow',Impact,sans-serif";
const faceCache={};
function faceTex(r,s){const k=r+"-"+s;if(faceCache[k])return faceCache[k];
  faceCache[k]=tex(256,358,(g,w,h)=>{rr(g,2,2,w-4,h-4,22);g.fillStyle="#f6f1e4";g.fill();
    g.lineWidth=2;g.strokeStyle="#dbd1b8";rr(g,11,11,w-22,h-22,15);g.stroke();
    const col=(s===1||s===2)?"#b3202b":"#15171b";g.fillStyle=col;g.textAlign="center";g.textBaseline="alphabetic";
    const corner=()=>{g.font=`700 ${r===10?40:46}px ${SERIF}`;g.fillText(RN[r],36,60);suit(g,s,36,88,19)};
    corner();g.save();g.translate(w,h);g.rotate(PI);corner();g.restore();
    if(r>=11){g.strokeStyle=col;g.lineWidth=3;rr(g,64,78,w-128,h-156,10);g.stroke();g.globalAlpha=.07;g.fillRect(64,78,w-128,h-156);g.globalAlpha=1;
      g.font=`700 118px ${SERIF}`;g.fillText(RN[r],w/2,h/2+40);suit(g,s,w/2,h/2-72,20);suit(g,s,w/2,h/2+96,20)}
    else if(r===1){suit(g,s,w/2,h/2+4,96)}
    else{suit(g,s,w/2,h/2,64)}});
  return faceCache[k]}
const backTex=tex(256,358,(g,w,h)=>{rr(g,2,2,w-4,h-4,22);g.fillStyle="#5e1019";g.fill();
  g.save();rr(g,18,18,w-36,h-36,13);g.clip();g.strokeStyle="rgba(220,182,94,.32)";g.lineWidth=1.4;
  for(let i=-h;i<w+h;i+=17){g.beginPath();g.moveTo(i,0);g.lineTo(i+h,h);g.stroke();g.beginPath();g.moveTo(i,h);g.lineTo(i+h,0);g.stroke()}g.restore();
  g.strokeStyle="#dcb65e";g.lineWidth=3;rr(g,18,18,w-36,h-36,13);g.stroke();g.lineWidth=1.4;rr(g,27,27,w-54,h-54,9);g.stroke();
  g.fillStyle="#5e1019";g.beginPath();g.arc(w/2,h/2,54,0,PI*2);g.fill();g.strokeStyle="#dcb65e";g.lineWidth=3;g.stroke();g.lineWidth=1.2;g.beginPath();g.arc(w/2,h/2,46,0,PI*2);g.stroke();
  g.fillStyle="#dcb65e";g.font=`800 46px ${COND}`;g.textAlign="center";g.textBaseline="middle";g.fillText("EL",w/2,h/2+2)});
const feltTex=tex(1024,1024,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h*.45,30,w/2,h/2,w/2);gr.addColorStop(0,"#145a40");gr.addColorStop(.6,"#0b3a28");gr.addColorStop(1,"#051a12");g.fillStyle=gr;g.fillRect(0,0,w,h);
  const id=g.getImageData(0,0,w,h),d=id.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*16;d[i]+=n;d[i+1]+=n;d[i+2]+=n}g.putImageData(id,0,0);
  g.strokeStyle="rgba(220,182,94,.55)";g.lineWidth=3;g.beginPath();g.arc(w/2,h/2,w*.37,0,PI*2);g.stroke();g.lineWidth=1.4;g.beginPath();g.arc(w/2,h/2,w*.355,0,PI*2);g.stroke();
  const arcText=(txt,rad,center,size,bottom)=>{g.font=`700 ${size}px ${COND}`;g.fillStyle="rgba(220,182,94,.75)";g.textAlign="center";g.textBaseline="middle";
    const step=size*.72/rad,dir=bottom?-1:1;let a=center-dir*step*(txt.length-1)/2;
    for(const ch of txt){g.save();g.translate(w/2+Math.cos(a)*rad,h/2+Math.sin(a)*rad);g.rotate(a+(bottom?-PI/2:PI/2));g.fillText(ch,0,0);g.restore();a+=dir*step}};
  arcText("THE HOUSE KNOWS THE ODDS",w*.415,-PI/2,30,false);
  arcText("EDGE = FAIR VALUE − PRICE",w*.415,PI/2,28,true);
  g.fillStyle="rgba(220,182,94,.13)";g.font=`800 132px ${COND}`;g.textAlign="center";g.textBaseline="middle";g.fillText("EDGE LAB",w/2,h/2);
  g.font=`600 26px ${COND}`;g.fillStyle="rgba(220,182,94,.4)";g.fillText("PAYS IN EXPECTATION",w/2,h/2+92)});
const PIP={1:[[.5,.5]],2:[[.27,.27],[.73,.73]],3:[[.27,.27],[.5,.5],[.73,.73]],4:[[.27,.27],[.73,.27],[.27,.73],[.73,.73]],5:[[.27,.27],[.73,.27],[.5,.5],[.27,.73],[.73,.73]],6:[[.28,.25],[.72,.25],[.28,.5],[.72,.5],[.28,.75],[.72,.75]]};
const dieTex=v=>tex(256,256,(g,w,h)=>{const gr=g.createRadialGradient(w/2,h/2,20,w/2,h/2,w*.75);gr.addColorStop(0,"#fbf7ee");gr.addColorStop(1,"#d6cfbc");g.fillStyle=gr;g.fillRect(0,0,w,h);
  PIP[v].forEach(([x,y])=>{const r=v===1?31:21,red=v===1;const pg=g.createRadialGradient(x*w-5,y*h-5,2,x*w,y*h,r);pg.addColorStop(0,red?"#e2434e":"#444");pg.addColorStop(1,red?"#8e1620":"#050505");g.fillStyle=pg;g.beginPath();g.arc(x*w,y*h,r,0,PI*2);g.fill()})});
const CHIP=[{c:"#b3202b",v:"5"},{c:"#1f4fae",v:"10"},{c:"#157046",v:"25"},{c:"#151517",v:"100"},{c:"#e8e1cd",v:"1",ink:"#1b1b1b"}];
function chipMats(k){const {c,v}=CHIP[k],ink=CHIP[k].ink||"#f3ecd9";
  const side=tex(512,32,(g,w,h)=>{g.fillStyle=c;g.fillRect(0,0,w,h);g.fillStyle=ink;for(let i=0;i<8;i++)g.fillRect(i*w/8+12,0,w/16-6,h)});
  const top=tex(256,256,(g)=>{g.fillStyle=c;g.beginPath();g.arc(128,128,128,0,PI*2);g.fill();g.fillStyle=ink;
    for(let i=0;i<8;i++){g.save();g.translate(128,128);g.rotate(i*PI/4);g.fillRect(-13,-128,26,34);g.restore()}
    g.strokeStyle=ink;g.lineWidth=3;g.beginPath();g.arc(128,128,82,0,PI*2);g.stroke();g.setLineDash([6,8]);g.beginPath();g.arc(128,128,71,0,PI*2);g.stroke();g.setLineDash([]);
    g.font=`800 66px ${COND}`;g.textAlign="center";g.textBaseline="middle";g.fillText(v,128,132)});
  const m=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.42,metalness:.05},o));
  return[m({map:side}),m({map:top}),m({map:top})]}

/* ---------- table, lights, atmosphere ---------- */
const felt=new THREE.Mesh(new THREE.CircleGeometry(9.6,128),new THREE.MeshStandardMaterial({map:feltTex,roughness:.95}));
felt.rotation.x=-PI/2;felt.receiveShadow=true;scene.add(felt);
const rail=new THREE.Mesh(new THREE.TorusGeometry(9.95,.42,28,220),new THREE.MeshStandardMaterial({color:0x2b170c,roughness:.36,metalness:.12}));
rail.rotation.x=-PI/2;rail.position.y=.12;rail.receiveShadow=true;scene.add(rail);
const brass=new THREE.Mesh(new THREE.TorusGeometry(9.48,.045,12,220),new THREE.MeshStandardMaterial({color:0xdcb65e,roughness:.25,metalness:.85,emissive:0x3a2a08,emissiveIntensity:.7}));
brass.rotation.x=-PI/2;brass.position.y=.03;scene.add(brass);
scene.add(new THREE.HemisphereLight(0xffe9c4,0x0a1a12,.42));
const spot=new THREE.SpotLight(0xfff0d2,2.5,40,.6,.62,1.1);spot.position.set(0,13,1.2);spot.target.position.set(0,0,.7);
spot.castShadow=true;spot.shadow.mapSize.set(isSmall()?512:1024,isSmall()?512:1024);spot.shadow.bias=-.0004;spot.shadow.camera.near=4;spot.shadow.camera.far=24;
scene.add(spot,spot.target);
const rimG=new THREE.PointLight(0xdcb65e,.9,24);rimG.position.set(-7,4,-4);scene.add(rimG);
const rimT=new THREE.PointLight(0x2ad1a0,.45,22);rimT.position.set(7,3,-5);scene.add(rimT);
const beam=new THREE.Mesh(new THREE.ConeGeometry(4.6,13,64,1,true),new THREE.MeshBasicMaterial({color:0xfff1d6,transparent:true,opacity:.032,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
beam.position.set(0,6.5,1.2);scene.add(beam);
const ND=isSmall()?260:520,dpos=new Float32Array(ND*3),dsp=new Float32Array(ND);
for(let i=0;i<ND;i++){const a=Math.random()*PI*2,r=Math.sqrt(Math.random())*3.6;dpos[i*3]=Math.cos(a)*r;dpos[i*3+1]=Math.random()*9;dpos[i*3+2]=1.2+Math.sin(a)*r;dsp[i]=.08+Math.random()*.22}
const dgeo=new THREE.BufferGeometry();dgeo.setAttribute("position",new THREE.BufferAttribute(dpos,3));
const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({color:0xffe7b8,size:.035,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(dust);
const ico=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(13,1)),new THREE.LineBasicMaterial({color:0xdcb65e,transparent:true,opacity:.09}));
ico.position.set(0,3,-1);scene.add(ico);

/* ---------- objects ---------- */
const cardGeo=new THREE.BoxGeometry(.9,1.26,.012);
const edgeMat=new THREE.MeshStandardMaterial({color:0xece4d0,roughness:.6});
const backMat=new THREE.MeshStandardMaterial({map:backTex,emissiveMap:backTex,emissive:0xffffff,emissiveIntensity:.08,roughness:.5,alphaTest:.5});
const cards=[];
for(let i=0;i<24;i++){const ft=faceTex(1,0),front=new THREE.MeshStandardMaterial({map:ft,emissiveMap:ft,emissive:0xffffff,emissiveIntensity:.2,roughness:.42,alphaTest:.5});
  const m=new THREE.Mesh(cardGeo,[edgeMat,edgeMat,edgeMat,edgeMat,front,backMat]);m.castShadow=true;m.receiveShadow=true;
  const g=new THREE.Group();g.add(m);scene.add(g);cards.push({g,m,front,face:[1,0]})}
function setFace(c,r,s){c.face=[r,s];const t=faceTex(r,s);c.front.map=t;c.front.emissiveMap=t}
const DIE_FACES=[3,4,1,6,2,5];
const dieMats=DIE_FACES.map(v=>new THREE.MeshPhysicalMaterial({map:dieTex(v),roughness:.28,clearcoat:.9,clearcoatRoughness:.2}));
const UP={1:[0,0],6:[PI,0],2:[-PI/2,0],5:[PI/2,0],3:[0,PI/2],4:[0,-PI/2]};
const dice=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.62,.62,.62),dieMats);m.castShadow=true;m.receiveShadow=true;
  const g=new THREE.Group();g.rotation.order="YXZ";g.add(m);scene.add(g);return{g,v:1}});
const chipGeo=new THREE.CylinderGeometry(.42,.42,.085,48);const chipSets=CHIP.map((_,k)=>chipMats(k));
const chips=[];for(let i=0;i<60;i++){const k=i%5;const m=new THREE.Mesh(chipGeo,chipSets[k]);m.castShadow=true;m.receiveShadow=true;const g=new THREE.Group();g.add(m);scene.add(g);chips.push({g,k})}

/* ---------- rest positions ---------- */
const deckRest=i=>({p:[3.7,.007+i*.0135,2.3],r:[PI/2,0,.08+((i*37)%7-3)*.004]});
const chipRest=i=>{const k=i%5,j=Math.floor(i/5);return{p:[1.1+k*.95,.045+j*.087,-3.9],r:[0,(i*1.7)%PI,0]}};
const diceRest=[[-1.6,.31,-3.4],[-.8,.31,-3.7]];
function place(o,t){o.g.position.set(...t.p);o.g.rotation.set(...t.r)}
cards.forEach((c,i)=>place(c,deckRest(i)));chips.forEach((c,i)=>place(c,chipRest(i)));dice.forEach((d,k)=>{d.g.position.set(...diceRest[k]);d.g.rotation.set(0,k*.6,0)});

/* ---------- movement ---------- */
function move(o,p,r,opt={}){const P=o.g.position,R=o.g.rotation;kill(P);kill(R);kill(o.g.scale);
  const d=opt.dur||.9,delay=opt.delay||0;
  if(opt.arc){to(P,{x:p[0],z:p[2],duration:d,delay,ease:"power3.inOut"});to(P,{keyframes:{y:[P.y,Math.max(P.y,p[1])+(opt.arcH||1.3),p[1]]},duration:d,delay,ease:"sine.inOut"})}
  else to(P,{x:p[0],y:p[1],z:p[2],duration:d,delay,ease:opt.ease||"power3.inOut"});
  to(R,{x:r[0],y:r[1],z:r[2],duration:d,delay,ease:"power3.inOut",onComplete:opt.done});
  const s=opt.scale==null?1:opt.scale;to(o.g.scale,{x:s,y:s,z:s,duration:d,delay,ease:"power3.inOut"})}
function restCards(used){cards.forEach((c,i)=>{if(used&&used.has(i))return;const t=deckRest(i);move(c,t.p,t.r,{dur:.85,delay:(23-i)*.012})})}
function restChips(used){chips.forEach((c,i)=>{if(used&&used.has(i))return;const t=chipRest(i);move(c,t.p,t.r,{dur:.9,delay:(i%12)*.015,arc:true,arcH:.6})})}
function restDice(){dice.forEach((d,k)=>{const P=d.g.position;kill(P);to(P,{x:diceRest[k][0],y:.31,z:diceRest[k][2],duration:.9,ease:"power2.inOut"})})}
function camTo(px,py,pz,lx,ly,lz,sx=-1.9,d=1.6){kill(cam);to(cam,{px,py,pz,lx,ly,lz,sx,duration:d,ease:"power2.inOut"})}
function shuffled(){const d=[];for(let s=0;s<4;s++)for(let r=1;r<=13;r++)d.push([r,s]);for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
const nm=(r,s)=>`<b>${RN[r]}${SN[s]}</b>`;
let hud=null;const say=t=>{if(hud)hud.innerHTML=t};

/* ---------- scenes ---------- */
const FAN=13,hero={deck:shuffled(),drawn:-1};
const fanSlot=i=>{const a=-.84+i*.14,R=2.7;return{p:[R*Math.sin(a),1.05+R*Math.cos(a),1.5+i*.014],r:[-.12,PI,a]}};
const S={
  fan(){camTo(0,3.9,12.6,0,2.5,0,-2.5);const used=new Set();
    for(let i=0;i<FAN;i++){used.add(i);const t=fanSlot(i);move(cards[i],t.p,t.r,{dur:1.15,delay:.25+i*.045})}
    hero.drawn=-1;restCards(used);restChips();restDice();
    say("Pick any card from the fan. I'll tell you the odds that the <b>next</b> card is higher.")},
  dice(){camTo(0,6.3,8.4,0,.2,.6);restCards();restChips();roll()},
  deal(){camTo(0,7,7.9,0,0,.9);restChips();restDice();dealRow(false)},
  trade(){camTo(0,7,7.9,0,0,.9);restChips();restDice();dealRow(true)},
  chips(){camTo(0,5.6,8.2,0,.5,.4);restCards();restDice();book()},
  bell(){camTo(0,4.7,9.2,0,1.1,0);restCards();restDice();bellDrop(false)},
  poker(){camTo(0,6.4,8.6,0,0,.6);restDice();pokerHand()},
  hilo(){camTo(0,3.1,9.4,0,1.5,.5);restChips();restDice();hiloDeal()},
  deck(){camTo(0,7.6,10.6,0,0,0);restCards();restChips();restDice()}
};
function heroDraw(i){
  if(hero.drawn===i){const t=fanSlot(i);move(cards[i],t.p,t.r,{dur:.8});hero.drawn=-1;say("Card returned. Pick another.");return}
  if(hero.drawn>=0){const j=hero.drawn,t=fanSlot(j);move(cards[j],t.p,t.r,{dur:.8})}
  if(hero.deck.length<8)hero.deck=shuffled();
  const [r,s]=hero.deck.pop(),c=cards[i];setFace(c,r,s);hero.drawn=i;
  move(c,[.1,2.6,5.6],[-.1,0,0],{dur:1.05,scale:1.55});sfx("deal");
  const n=hero.deck.length,hi=hero.deck.filter(x=>x[0]>r).length,lo=hero.deck.filter(x=>x[0]<r).length,eq=n-hi-lo;
  const p=Math.max(hi,lo)/n,side=hi>=lo?"higher":"lower",k=Math.max(0,2*p-1);
  later(()=>say(`You drew ${nm(r,s)}. Of the ${n} cards left, ${hi} are higher, ${lo} lower and ${eq} tie.<br>P(${side}) = ${Math.max(hi,lo)}/${n} = <b>${(p*100).toFixed(1)}%</b>. At even money, Kelly stakes 2p − 1 = <b>${(k*100).toFixed(0)}%</b> on ${side}.${k===0?" No edge: don't bet.":""}`),500)}
function roll(){const out=[];sfx("roll");
  dice.forEach((d,k)=>{const v=1+Math.floor(Math.random()*6),yaw=Math.random()*PI*2;d.v=v;out.push(v);
    const P=d.g.position,R=d.g.rotation,tx=k?.75:-.55,tz=k?.55:1.25;kill(P);kill(R);
    to(P,{x:tx,z:tz,duration:1.15,ease:"power2.out"});to(P,{y:2.5+Math.random()*.6,duration:.36,ease:"power2.out"});to(P,{y:.31,duration:.85,delay:.36,ease:"bounce.out"});
    to(R,{x:UP[v][0]+PI*4*(k?1:-1),y:yaw,z:UP[v][1]+PI*2,duration:1.2,ease:"power3.out",onComplete:()=>R.set(UP[v][0],yaw,UP[v][1])})});
  const s=out[0]+out[1],ways=6-Math.abs(7-s);
  later(()=>say(`Rolled <b>${out[0]} + ${out[1]} = ${s}</b>. Expected sum = 7. This total comes up ${ways} ways in 36 = ${(ways/36*100).toFixed(1)}%. Click the felt to roll again.`),1100)}
let row=[];
function dealRow(trade){const d=shuffled().slice(0,5),used=new Set();row=[];
  for(let i=0;i<5;i++){const ci=13+i,c=cards[ci];used.add(ci);setFace(c,d[i][0],d[i][1]);const down=trade&&i>=2;
    move(c,[-2+i,.01+i*.002,1],[down?PI/2:-PI/2,0,(Math.random()-.5)*.14],{arc:true,arcH:1.1,dur:.75,delay:.15+i*.13});later(()=>sfx("deal"),150+i*130);row.push(d[i])}
  restCards(used);
  const sum=d.reduce((a,x)=>a+x[0],0);
  later(()=>say(`Dealt ${d.map(x=>nm(x[0],x[1])).join(" ")} = <b>${sum}</b>. Expected sum of five cards = 5 × 7 = 35. Click the felt to deal again.`),900)}
function book(){const used=new Set(),blue=chips.map((c,i)=>i).filter(i=>chips[i].k===1),red=chips.map((c,i)=>i).filter(i=>chips[i].k===0);
  const H=[2,4,6],X=[.85,1.75,2.65];let b=0,r=0,n=0;
  H.forEach((h,s)=>{for(let j=0;j<h;j++){const bi=blue[b++],ri=red[r++];used.add(bi);used.add(ri);
    move(chips[bi],[-X[s],.045+j*.087,.8],[0,Math.random()*PI,0],{arc:true,arcH:1,dur:.8,delay:.1+n*.035});
    move(chips[ri],[X[s],.045+j*.087,.8],[0,Math.random()*PI,0],{arc:true,arcH:1,dur:.8,delay:.12+n*.035});n++}});
  restChips(used);later(()=>sfx("fill"),300);
  say("Blue stacks are bids, red stacks are offers. Size grows away from the middle, and the gap between the best bid and best offer is the spread you earn.")}
function bellDrop(random){const N=36,bins=Array(9).fill(0),used=new Set();
  if(random){for(let i=0;i<N;i++){let h=0;for(let f=0;f<8;f++)h+=Math.random()<.5?1:0;bins[h]++}}
  else{[0,1,4,7,9,7,4,1,0].forEach((v,k)=>bins[k]=v)}
  let i=0;bins.forEach((cnt,k)=>{for(let j=0;j<cnt&&i<chips.length;j++){const c=chips[i];used.add(i);
    move(c,[-3.4+k*.85,.045+j*.087,.7],[0,Math.random()*PI,0],{arc:true,arcH:2.2+Math.random(),dur:.9+Math.random()*.4,delay:Math.random()*.6});i++}});
  restChips(used);later(()=>sfx("roll"),200);
  say(random?`Each chip is the number of heads in 8 coin flips. Counts: ${bins.join(" · ")}. Add up enough random bets and a bell curve appears. Click to drop again.`
    :"Stack heights follow C(8, k): 1 · 8 · 28 · 56 · 70 · 56 · 28 · 8 · 1, scaled. That's the √n rule in chips. Click the felt to drop them for real.")}
let pk={phase:0,board:[]};
function pokerHand(){const d=shuffled(),used=new Set();pk={phase:0,board:d.slice(4,9),hole:d.slice(0,2)};
  [[13,-.55,2.7,-.09],[14,.45,2.75,.11]].forEach(([ci,x,z,yw],k)=>{used.add(ci);setFace(cards[ci],...pk.hole[k]);move(cards[ci],[x,.25,z],[-PI/2+.38,0,yw],{arc:true,dur:.8,delay:.1+k*.12})});
  [[15,-.5,-2.0],[16,.5,-2.05]].forEach(([ci,x,z],k)=>{used.add(ci);move(cards[ci],[x,.02,z],[PI/2,0,(k-.5)*.1],{arc:true,dur:.8,delay:.35+k*.1})});
  for(let i=0;i<5;i++){const ci=17+i;used.add(ci);setFace(cards[ci],...pk.board[i]);move(cards[ci],[-2.2+i*1.1,.01,.55],[i<3?-PI/2:PI/2,0,0],{arc:true,dur:.8,delay:.6+i*.12});later(()=>sfx("deal"),600+i*120)}
  restCards(used);
  const pot=new Set(),blacks=chips.map((c,i)=>i).filter(i=>chips[i].k===3);[[0,-.95,-.95,4],[1,0,-1.0,5],[2,.95,-.95,3]].forEach(([s,x,z,h])=>{for(let j=0;j<h&&blacks.length;j++){const ci=blacks.pop();pot.add(ci);move(chips[ci],[x,.045+j*.087,z],[0,Math.random()*PI,0],{arc:true,dur:.8,delay:.3+j*.04})}});
  restChips(pot);
  say(`You hold ${nm(...pk.hole[0])} ${nm(...pk.hole[1])}. Flop: ${pk.board.slice(0,3).map(x=>nm(...x)).join(" ")}. Count your outs, then click the felt to run out the turn and river.`)}
function pokerRun(){if(pk.phase>0){pokerHand();return}pk.phase=1;
  [3,4].forEach((i,k)=>{const c=cards[17+i];later(()=>{sfx("deal");move(c,[-2.2+i*1.1,.01,.55],[-PI/2,0,0],{arc:true,arcH:.7,dur:.6})},k*450)});
  later(()=>say(`Turn ${nm(...pk.board[3])}, river ${nm(...pk.board[4])}. Did your outs arrive? Each unseen card was ${ (1/47*100).toFixed(1)}% likely on the turn. Click to deal a new hand.`),1000)}
let hl={deck:[],cur:null,nx:null,flipped:false};
function hiloDeal(){hl.deck=shuffled();hl.cur=hl.deck.pop();hl.nx=hl.deck.pop();hl.flipped=false;const used=new Set([13,14]);
  setFace(cards[13],...hl.cur);setFace(cards[14],...hl.nx);
  move(cards[13],[-.75,1.55,3.6],[-.14,0,-.05],{dur:1,scale:1.35});move(cards[14],[.8,1.55,3.5],[-.14,PI,.05],{dur:1,delay:.12,scale:1.35});restCards(used)}

/* ---------- presets, page mode, reactions ---------- */
const PAGE=document.body.dataset.scene3d||"";
const lobbyHud=document.querySelector("[data-hud]");
let current=null;
function go(name){if(!S[name]||name===current)return;current=name;hud=name==="fan"?lobbyHud:null;S[name]()}
const GOLD=new THREE.Color(0xdcb65e),TEAL=new THREE.Color(0x2ad1a0),GREEN=new THREE.Color(0x4fe0a2),RED=new THREE.Color(0xff4b3e);
function flash(col){if(reduce)return;kill(rimG);kill(rimT);rimG.color.copy(col);rimT.color.copy(col);rimG.intensity=3.2;rimT.intensity=2.2;
  to(rimG,{intensity:.9,duration:1.2,ease:"power2.out",onComplete:()=>rimG.color.copy(GOLD)});to(rimT,{intensity:.45,duration:1.2,ease:"power2.out",onComplete:()=>rimT.color.copy(TEAL)})}
function react(t){if(t==="good")flash(GREEN);else if(t==="bad")flash(RED);else if(t==="roll"&&current==="dice")roll()}
function dive(){camTo(cam.px,2.3,6.4,cam.lx,.5,cam.lz,cam.sx,.6)}

/* ---------- pointer ---------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(-9,-9),mouse={x:0,y:0,sx:0,sy:0};let over=false,hovered=-1;
addEventListener("pointermove",e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ndc.set(mouse.x,mouse.y);over=e.target===stage},{passive:true});
stage.addEventListener("click",()=>{
  if(current==="fan"){if(hovered>=0)heroDraw(hovered);return}
  if(current==="dice")roll();else if(current==="deal")dealRow(false);else if(current==="trade")dealRow(true);else if(current==="poker")pokerRun();
  else if(current==="bell")bellDrop(true);else if(current==="chips")book();else if(current==="hilo")hiloDeal()});

/* ---------- loop ---------- */
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;const t=now/1000;
  mouse.sx+=(mouse.x-mouse.sx)*.04;mouse.sy+=(mouse.y-mouse.sy)*.04;
  const shift=(isSmall()||PAGE)?0:cam.sx,yo=(isSmall()&&!PAGE)?-.65:0,mx=reduce?0:mouse.sx,my=reduce?0:mouse.sy;
  camera.position.set(cam.px+shift+mx*.55,cam.py-my*.3+yo,cam.pz);camera.lookAt(cam.lx+shift,cam.ly+yo,cam.lz);
  hovered=-1;
  if(current==="fan"&&over){ray.setFromCamera(ndc,camera);const hit=ray.intersectObjects(cards.slice(0,FAN).map(c=>c.m));if(hit.length)hovered=cards.findIndex(c=>c.m===hit[0].object)}
  stage.style.cursor=(hovered>=0||(over&&current!=="fan"))?"pointer":"";
  for(let i=0;i<cards.length;i++){const c=cards[i],h=(i===hovered&&i!==hero.drawn)?1:0;
    c.m.position.y+=(h*.34-c.m.position.y)*.15;c.m.position.z+=(-h*.2-c.m.position.z)*.15;
    c.m.rotation.z=(current==="fan"&&i<FAN&&i!==hero.drawn&&!reduce)?Math.sin(t*.8+i*.5)*.012:c.m.rotation.z*.9}
  if(!reduce){const a=dgeo.attributes.position.array;for(let i=0;i<ND;i++){a[i*3+1]+=dsp[i]*.004;if(a[i*3+1]>9)a[i*3+1]=0}dgeo.attributes.position.needsUpdate=true;
    ico.rotation.y=t*.025;ico.rotation.x=t*.011;beam.material.opacity=.03+Math.sin(t*1.3)*.004}
  renderer.render(scene,camera)}
addEventListener("resize",()=>{renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,isSmall()?1.5:2));renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
go(PAGE||"fan");
requestAnimationFrame(frame);
window.EL3D={S,go,dive,react,roll,heroDraw,get current(){return current}};
})();
