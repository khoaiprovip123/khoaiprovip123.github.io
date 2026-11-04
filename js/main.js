'use strict';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let motionEnabled = !prefersReduced;
const journey = document.querySelector('.journey');
const sticky = document.getElementById('sceneViewport');
const canvas = document.getElementById('universeCanvas');
const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
const sceneElements = [...document.querySelectorAll('[data-scene]')];
const rail = document.getElementById('railProgress');
// Cross-fades overlap: no progress interval can hide every heading.
const crossfades = [[.10,.22],[.32,.44],[.55,.67],[.77,.89]];
const state = { target: 0, current: 0, ptrX: 0, ptrY: 0, easedX: 0, easedY: 0, seconds: 0, last: performance.now(), width: 0, height: 0, scale: 1, mouseX: -500, mouseY: -500 };
const rand = (function () { let seed = 19650718; return function () { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; })();
const stars = Array.from({ length: 760 }, () => ({
  x: rand(), y: rand(), r: mix(.22, 1.65, rand() ** 3), z: rand(), phase: rand() * TAU,
  speed: mix(.17, 1.4, rand()), kind: rand()
}));
const shards = Array.from({length: 150}, (_, i) => ({
  t: (i + rand() * .8) / 150, side: i % 2, radial: rand() * .85 + .45,
  angle: rand() * TAU, lift: rand() * 2 - 1, scale: mix(.35, 1.5, rand()),
}));
function resize() {
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, rect.width), h = Math.max(1, rect.height);
  const pixelRatio = Math.min(1.75, window.devicePixelRatio || 1);
  if (w !== state.width || h !== state.height || pixelRatio !== state.scale) {
    state.width = w; state.height = h; state.scale = pixelRatio;
    canvas.width = Math.round(w * pixelRatio);
    canvas.height = Math.round(h * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
}
function getScrollProgress() {
  const max = journey.offsetHeight - window.innerHeight;
  return clamp(max > 0 ? (window.scrollY - journey.offsetTop) / max : 0);
}
function activeChapter(p) {
  return p < .20 ? 0 : p < .425 ? 1 : p < .64 ? 2 : p < .844 ? 3 : 4;
}
let displayedChapter = -1;
function sceneOpacity(i, p) {
  const arrival = i === 0 ? 1 : smooth(crossfades[i - 1][0], crossfades[i - 1][1], p);
  const departure = i === 4 ? 1 : 1 - smooth(crossfades[i][0], crossfades[i][1], p);
  return arrival * departure;
}
function updateDOM(p) {
  const dawn = smooth(.22, .70, p), daylight = smooth(.70, .92, p);
  const sun = smooth(.30, .62, p) * (1 - smooth(.82, 1, p) * .7);
  sticky.style.setProperty('--dawn', dawn.toFixed(3));
  sticky.style.setProperty('--daylight', daylight.toFixed(3));
  sticky.style.setProperty('--sun', sun.toFixed(3));
  sticky.style.setProperty('--nightFade', (1 - smooth(.24, .78, p)).toFixed(3));
  sticky.style.setProperty('--worldFade', (1 - smooth(.81, .98, p)).toFixed(3));
  sticky.style.setProperty('--rise', String(Math.round(mix(0, state.height * .56, smooth(.29, .88, p)))));
  sceneElements.forEach((el, i) => {
    const opacity = sceneOpacity(i, p);
    el.style.opacity = opacity.toFixed(4);
    el.style.filter = motionEnabled ? `blur(${(1 - opacity) * 7}px)` : "none";
    const y = (i === 0 && p < .07) ? 0 : (1 - opacity) * 22;
    if (window.innerWidth <= 640) el.style.transform = `translate3d(0, ${y}px, 0)`;
    else el.style.transform = `translate3d(0, calc(-46% + ${y}px), 0)`;
    el.classList.toggle('is-active', opacity > .6);
  });
  const index = activeChapter(p);
  if (index !== displayedChapter) {
    displayedChapter = index;
    document.getElementById('chapterNum').textContent = `0${index}`;
    document.getElementById('sideCount').textContent = `0${index}`;
  }
  rail.style.height = `${Math.round(p * 100)}%`;
  document.getElementById('scenePercent').textContent = String(Math.round(p * 100)).padStart(3, '0');
  // One normalized scroll timeline drives the fixed sky behind the entire page.
  const entire = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const siteP = clamp(window.scrollY / entire);
  document.getElementById('siteProgress').style.width = `${(siteP * 100).toFixed(2)}%`;
  document.documentElement.style.setProperty('--global-night-alpha', (1 - smooth(.07, .81, siteP)).toFixed(3));
  document.documentElement.style.setProperty('--global-dawn-alpha', smooth(.03, .72, siteP).toFixed(3));
  document.documentElement.style.setProperty('--global-day-alpha', smooth(.30, .94, siteP).toFixed(3));
  document.documentElement.style.setProperty('--global-star-alpha', (1 - smooth(.14, .71, siteP)).toFixed(3));
  document.documentElement.style.setProperty('--global-glow-alpha', smooth(.17, .95, siteP).toFixed(3));
  document.documentElement.style.setProperty('--global-energy-shift', siteP.toFixed(3));
  document.body.classList.toggle('is-day', siteP > .50);
  document.body.classList.toggle('burst-bright', p > .705 && p < .86);
  document.getElementById('header').classList.toggle('scrolled', window.scrollY > 30);
}

function rotatePoint(x, y, z, rx, ry, rz) {
  let tx, tz;
  tx = x * Math.cos(ry) - z * Math.sin(ry);
  tz = x * Math.sin(ry) + z * Math.cos(ry);
  x = tx; z = tz;
  let ty = y * Math.cos(rx) - z * Math.sin(rx);
  tz = y * Math.sin(rx) + z * Math.cos(rx);
  y = ty; z = tz;
  tx = x * Math.cos(rz) - y * Math.sin(rz);
  ty = x * Math.sin(rz) + y * Math.cos(rz);
  return {x: tx, y: ty, z};
}
function projectPoint(point, cfg) {
  const r = rotatePoint(point.x, point.y, point.z, cfg.rx, cfg.ry, cfg.rz);
  const perspective = 3.9 / (3.9 - r.z * .34);
  const u = Math.min(state.width * (state.width <= 640 ? .165 : .11), state.height * (state.width <= 640 ? .144 : .149));
  return {x: cfg.cx + r.x * u * perspective, y: cfg.cy + r.y * u * perspective, z: r.z, factor: perspective};
}
function helixPoint(t, side, cfg, scale = 1) {
  const theta = t * TAU * 3.86 + side * Math.PI * .92 + cfg.turn;
  const r = (.91 + .13 * Math.sin(t * 14.8 + side * 1.1)) * scale;
  const shift = cfg.burst * (1.37 + Math.sin(t * 19 + side * 2.2) * .38);
  const a = theta + cfg.burst * Math.sin(t * 19 + side) * .24;
  const radial = r + shift;
  return { x: Math.cos(a) * radial, y: (t - .5) * (4.24 + cfg.burst * 1.5) + Math.sin(t * 11.5 + side) * .075 + Math.sin(t * 28) * cfg.burst * .3, z: Math.sin(a) * radial * .86 };
}
function drawStarfield(p) {
  const night = (1 - smooth(.27, .79, p));
  if (night < .006) return;
  const w = state.width, h = state.height;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const fx = ((s.x * w + state.easedX * (s.z + .15) * 16 + p * s.speed * 85) % (w + 20) + w + 20) % (w + 20);
    const fy = ((s.y * h + state.easedY * (s.z + .15) * 10 + p * s.speed * 44) % (h + 20) + h + 20) % (h + 20);
    const twinkle = .65 + .32 * Math.sin(state.seconds * (.6 + s.speed) + s.phase);
    const alpha = (.17 + s.z * .7) * night * twinkle;
    const radius = s.r * Math.min(1.25, h / 800);
    ctx.fillStyle = `rgba(${s.kind < .18 ? '221,187,157' : s.kind < .63 ? '213,226,231' : '156,188,199'},${alpha})`;
    ctx.beginPath(); ctx.arc(fx, fy, radius, 0, TAU); ctx.fill();
    if (s.kind > .987) {
      ctx.strokeStyle = `rgba(216,233,238,${alpha * .55})`;
      ctx.lineWidth = .55;
      ctx.beginPath(); ctx.moveTo(fx - 5, fy); ctx.lineTo(fx + 5, fy); ctx.moveTo(fx, fy - 5); ctx.lineTo(fx, fy + 5); ctx.stroke();
    }
  }
  ctx.save(); ctx.globalAlpha = .12 * night;
  const left = w*.11 + state.easedX*9, top = h*.15 + state.easedY*7;
  const stream = ctx.createLinearGradient(left, top, left + w*.8, top + h*.6);
  stream.addColorStop(0, '#a1bfc8'); stream.addColorStop(.54, '#e0c4ad'); stream.addColorStop(1, '#a1bfc8');
  ctx.strokeStyle = stream; ctx.lineWidth = .6;
  for (let i=0;i<7;i++) {ctx.beginPath();ctx.ellipse(w*.6,h*.53,h*.65+i*15,w*.18+i*6,-.25,0,TAU);ctx.stroke();}
  ctx.restore();
}
function stroke3D(points, cfg, color, width, alpha, glow) {
  if (points.length < 2) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
  if (glow) {ctx.shadowColor = color; ctx.shadowBlur = glow;}
  ctx.beginPath();
  points.forEach((point, idx) => {const a = projectPoint(point, cfg); idx ? ctx.lineTo(a.x, a.y) : ctx.moveTo(a.x, a.y);});
  ctx.stroke(); ctx.restore();
}
function drawRings(cfg, p) {
  const alpha = (1 - smooth(.67, .84, p)) * .34;
  if (alpha <= .003) return;
  for (let j = 0; j < 4; j++) {
    const t = [0.14, .37, .63, .86][j];
    const pts = [];
    const radius = .86 + (j % 2) * .13;
    for (let i = 0; i <= 110; i++) {
      const angle = i/110 * TAU;
      pts.push({x: Math.cos(angle) * radius, y: (t-.5)*4.12 + Math.sin(angle)*.05, z: Math.sin(angle)*radius});
    }
    stroke3D(pts,cfg,p<.48?'#a7c9cc':'#e6ceac',.68,alpha,0);
  }
  stroke3D([{x:0,y:-2.35,z:0},{x:0,y:2.35,z:0}],cfg,p<.4?'#93c2ce':'#efd7b4',1.1,.45*(1-cfg.burst),11);
}
function drawSpindle(p) {
  const w = state.width, h = state.height;
  if (!w || !h) return;
  const burst = smooth(.63, .84, p);
  const fade = 1 - smooth(.83, .98, p);
  if (fade < .005) return;
  const warmth = smooth(.36, .72, p);
  const cfg = {
    turn: state.seconds * (motionEnabled ? .16 : 0) + p * Math.PI * 5.5,
    rx: -.16 + p*.16 + state.easedY*.055,
    ry: p * Math.PI * .77 + state.easedX*.16,
    rz: -.09 + Math.sin(p*TAU)*.06,
    cx: w * (w <= 640 ? .52 : .705), cy: h * (w < 370 ? .29 : w <= 640 ? .35 : .51), burst
  };
  const backbone = projectPoint({x:0,y:0,z:0},cfg);
  const coreGlow = ctx.createRadialGradient(backbone.x,backbone.y,2,backbone.x,backbone.y,Math.min(w*.25,h*.35));
  const glowAlpha = fade * (1-burst*.4);
  coreGlow.addColorStop(0,`rgba(${Math.round(mix(104,245,warmth))},${Math.round(mix(173,192,warmth))},${Math.round(mix(196,142,warmth))},${.09*glowAlpha})`);
  coreGlow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.save();ctx.fillStyle=coreGlow;ctx.fillRect(backbone.x-w*.35,backbone.y-h*.38,w*.7,h*.76);ctx.restore();
  drawRings(cfg,p);
  // Individual facets are depth-sorted; a real 3D curve controls their positions.
  const facets = [];
  const N = state.width < 700 ? 108 : 160;
  for (let side=0;side<2;side++) {
    for (let i=0;i<N;i++) {
      const t = (i+.2)/N, n=(i+1.05)/N;
      const a = helixPoint(t, side, cfg, side ? .95 : .84), b = helixPoint(n, side, cfg, side ? .95 : .84);
      const c = helixPoint(n, side, cfg, side ? 1.045 : 1.12), d = helixPoint(t,side,cfg,side ? 1.045 : 1.12);
      const qa=projectPoint(a,cfg),qb=projectPoint(b,cfg),qc=projectPoint(c,cfg),qd=projectPoint(d,cfg);
      const depth=(qa.z+qb.z+qc.z+qd.z)/4;
      const facing = clamp((depth+1.7)/3.4);
      facets.push({coords:[qa,qb,qc,qd],depth,facing,index:i,side});
    }
  }
  facets.sort((a,b)=>a.depth-b.depth);
  ctx.save(); ctx.globalAlpha = fade;
  for (const f of facets) {
    const {coords, facing, index, side} = f;
    const lum = (.29 + facing*.67) * (1 - burst * .12);
    const colorA = side ? [52,113,125] : [82,129,148], colorB = side ? [142,205,203] : [215,237,231];
    const warmA = side ? [145,116,98] : [177,112,86], warmB = side ? [231,193,159] : [255,239,203];
    const cool = colorA.map((v,i)=>mix(v,colorB[i],lum));
    const hot = warmA.map((v,i)=>mix(v,warmB[i],lum));
    const rgb = cool.map((v,i)=>Math.round(mix(v,hot[i],warmth)));
    ctx.fillStyle = `rgba(${rgb.join(',')},${(side ? .37 : .54) + facing*(side ? .23 : .37)})`;
    ctx.beginPath();ctx.moveTo(coords[0].x,coords[0].y);for(let i=1;i<4;i++)ctx.lineTo(coords[i].x,coords[i].y);ctx.closePath();ctx.fill();
    if (facing > .60) {
      ctx.strokeStyle=`rgba(${warmth>.5?'255,227,188':'194,241,248'},${(.22+facing*.33)*(1-burst*.3)})`;
      ctx.lineWidth = facing > .84 ? 1.0 : .58;
      ctx.beginPath(); ctx.moveTo(coords[3].x,coords[3].y); ctx.lineTo(coords[2].x,coords[2].y);ctx.stroke();
    }
    if (index % 20 === 0 && facing > .50 && !burst) {
      ctx.fillStyle=`rgba(255,241,212,${facing*.7})`;
      ctx.beginPath();ctx.arc(coords[2].x,coords[2].y,1.7,0,TAU);ctx.fill();
    }
  }
  ctx.restore();
  // Inner radial struts complete the axis; their position changes with each turn.
  ctx.save();ctx.globalAlpha=fade*(1-burst*.35);
  for(let i=0;i<60;i++){
    const t=i/59;
    const path=helixPoint(t,0,cfg,.92),inner=helixPoint(t,0,cfg,.18);
    const a=projectPoint(inner,cfg), b=projectPoint(path,cfg);
    ctx.strokeStyle = warmth>.45?`rgba(245,210,168,${.06+clamp((b.z+1)/2)*.23})`:`rgba(168,206,220,${.05+clamp((b.z+1)/2)*.24})`;
    ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  ctx.restore();
  // Light travels along the edges of the sculpted ribbons, driven by scroll and time.
  // Lines are projected through the same 3D camera as the facets, not a CSS overlay.
  for (let side=0;side<2;side++) {
    const edge=[];
    for (let i=0;i<=170;i++) edge.push(helixPoint(i/170, side, cfg, side ? 1.05 : 1.125));
    stroke3D(edge,cfg,warmth>.45?'#f9d7a6':'#a8ebed',side ? .8 : 1.1, fade*(side?.37:.72)*(1-burst*.3),side?4:9);
  }
  ctx.save();
  for(let i=0;i<9;i++){
    const t=(i/9 + state.seconds*.035 + p*.11)%1;
    const side=i%3===0 ? 1 : 0;
    const q=projectPoint(helixPoint(t,side,cfg,side?1.05:1.125),cfg);
    const glow=2.0+(Math.sin(state.seconds*2+i)*.5+.5)*1.4;
    ctx.globalAlpha=fade*(.35+clamp((q.z+1.3)/2.6)*.5);
    ctx.shadowColor=warmth>.5?'#ffe2b5':'#b8f4ee';ctx.shadowBlur=14;
    ctx.fillStyle=warmth>.5?'#ffe2b5':'#dcffff';
    ctx.beginPath();ctx.arc(q.x,q.y,glow,0,TAU);ctx.fill();
  }
  ctx.restore();
  // A restrained pulse moving inside the central axis.
  const axisT=(state.seconds*.10 + p*.32)%1;
  const axisDot=projectPoint({x:0,y:(axisT-.5)*4.24,z:0},cfg);
  ctx.save();ctx.globalAlpha=fade*(1-burst*.65)*.86;
  ctx.fillStyle=warmth>.5?'#ffe2be':'#c4f6f3';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=20;
  ctx.beginPath();ctx.arc(axisDot.x,axisDot.y,2.6,0,TAU);ctx.fill();ctx.restore();
  if (burst > .005) {
    ctx.save();ctx.globalAlpha=fade*burst;
    for(const s of shards){
      const theta=s.t*TAU*3.86+s.side*Math.PI*.92+cfg.turn;
      const radius=.95+s.radial*burst*2.6;
      const o={x:Math.cos(theta+s.angle*.2)*radius,y:(s.t-.5)*4.1+s.lift*burst*1.7,z:Math.sin(theta+s.angle*.2)*radius};
      const q=projectPoint(o,cfg);const size=s.scale*(1+burst*3.2)*q.factor;
      ctx.fillStyle = warmth>.35 ? `rgba(246,206,156,${.35+.55*s.radial})` : `rgba(181,211,227,${.35+.45*s.radial})`;
      ctx.beginPath();ctx.moveTo(q.x-size,q.y-size*.4);ctx.lineTo(q.x+size*.5,q.y-size*1.5);ctx.lineTo(q.x+size*.7,q.y+size*.8);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
}

function paint() {
  if (!ctx) return;
  ctx.clearRect(0, 0, state.width, state.height);
  if (state.current < .986) {drawStarfield(state.current);drawSpindle(state.current);}
}
// Limit unnecessary Canvas work, especially on touch devices and below the journey.
const coarseCanvas = window.matchMedia('(pointer:coarse)').matches;
const frameInterval = coarseCanvas ? 1000 / 30 : 1000 / 60;
let lastDrawAt = -1000;
function onFrame(now) {
  requestAnimationFrame(onFrame);
  if (now - lastDrawAt < frameInterval) return;
  lastDrawAt = now;
  const dt = Math.min(.06,(now - state.last)/1000);state.last=now;
  const rate = motionEnabled ? 1-Math.exp(-dt*8.5) : 1;
  state.current=mix(state.current,state.target,rate);
  state.easedX=mix(state.easedX,state.ptrX,1-Math.exp(-dt*3.3));
  state.easedY=mix(state.easedY,state.ptrY,1-Math.exp(-dt*3.3));
  const visible = !document.hidden && window.scrollY < journey.offsetTop + journey.offsetHeight && window.scrollY + window.innerHeight > journey.offsetTop;
  if (!visible) return;  // Static sections are driven only by actual scroll events.
  if (motionEnabled) state.seconds += dt;
  updateDOM(state.current);
  paint();
}
function onScroll() {
  state.target = getScrollProgress();
  const outOfJourney = window.scrollY >= journey.offsetTop + journey.offsetHeight || window.scrollY + window.innerHeight < journey.offsetTop;
  if (outOfJourney) { state.current = state.target; updateDOM(state.current); }
}
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',()=>{resize();onScroll();},{passive:true});
window.addEventListener('pointermove',event=>{
  state.ptrX = clamp((event.clientX/window.innerWidth-.5)*2,-1,1);
  state.ptrY = clamp((event.clientY/window.innerHeight-.5)*2,-1,1);
  state.mouseX=event.clientX;state.mouseY=event.clientY;
},{passive:true});
const motionToggle=document.getElementById('motionToggle');
function refreshMotionLabel(){document.body.classList.toggle('motion-off',!motionEnabled);motionToggle.innerHTML=`<span class="motion-bullet"></span> CHUYỂN ĐỘNG: ${motionEnabled?'BẬT':'TẮT'}`;motionToggle.setAttribute('aria-pressed',String(!motionEnabled));}
motionToggle.addEventListener('click',()=>{motionEnabled=!motionEnabled;refreshMotionLabel();});refreshMotionLabel();
const reducedQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
reducedQuery.addEventListener?.('change',event=>{if(event.matches){motionEnabled=false;refreshMotionLabel();}});

const showElements=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
  }),{threshold:.08,rootMargin:'0px 0px -5% 0px'});
  showElements.forEach(element=>observer.observe(element));
}else showElements.forEach(element=>element.classList.add('visible'));

const toggle=document.getElementById('menuToggle');
const mobileMenu=document.getElementById('mobileNav');
function hideMenu(){mobileMenu.hidden=true;toggle.setAttribute('aria-expanded','false');}
toggle.addEventListener('click',()=>{const show=mobileMenu.hidden;mobileMenu.hidden=!show;toggle.setAttribute('aria-expanded',String(show));});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',hideMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){hideMenu();closeLightbox();}});

const lightbox=document.getElementById('lightbox');
const image=document.getElementById('lightboxImage');
const title=document.getElementById('lightboxTitle');
const closeButton=document.getElementById('lightboxClose');
let priorFocus=null;
function openLightbox(button){
  priorFocus=document.activeElement;
  image.src=button.dataset.src;
  image.alt=button.dataset.title || 'Ảnh giao diện thực tế';
  title.textContent=button.dataset.title || 'ẢNH GIAO DIỆN';
  lightbox.hidden=false;document.body.classList.add('no-scroll');closeButton.focus();
}
function closeLightbox(){if(lightbox.hidden) return;lightbox.hidden=true;image.removeAttribute('src');document.body.classList.remove('no-scroll');priorFocus?.focus();}
document.querySelectorAll('[data-src]').forEach(el=>el.addEventListener('click',()=>openLightbox(el)));
closeButton.addEventListener('click',closeLightbox);
lightbox.addEventListener('click',event=>{if(event.target.dataset.close)closeLightbox();});
lightbox.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();closeButton.focus();}});

// A deliberately restrained product tilt; no scroll hijacking or synthetic wheel events.
if(window.matchMedia('(hover:hover) and (pointer:fine)').matches && !prefersReduced){
  document.querySelectorAll('.js-tilt').forEach(el=>{
    const base=el.closest('.project-adb')?-11:-13;
    el.addEventListener('pointermove',event=>{
      if (!motionEnabled) return;
      const r=el.getBoundingClientRect();const x=clamp((event.clientX-r.left)/r.width*2-1,-1,1);const y=clamp((event.clientY-r.top)/r.height*2-1,-1,1);
      el.style.transform=`perspective(1300px) rotateY(${base+x*4}deg) rotateX(${5-y*4}deg) translateY(${-Math.abs(x)*2}px)`;
    });
    el.addEventListener('pointerleave',()=>{el.style.transform='';});
  });
  const cursor=document.getElementById('cursor');
  window.addEventListener('pointermove',event=>{cursor.style.transform=`translate3d(${event.clientX-21}px,${event.clientY-21}px,0)`;},{passive:true});
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>cursor.classList.add('hovering'));
    el.addEventListener('mouseleave',()=>cursor.classList.remove('hovering'));
  });
}
// Tiny illustrated waveform is seeded, not randomized on each load.
document.querySelectorAll('.wave-lines i').forEach((el,i)=>{el.style.setProperty('--h',`${20+Math.abs(Math.sin(i*1.2)*Math.cos(i*.42))*75}%`);el.style.setProperty('--d',`${-(i*0.13)%2.7}s`);});
document.getElementById('year').textContent=String(new Date().getFullYear());
resize();onScroll();state.current=state.target;updateDOM(state.current);paint();
requestAnimationFrame(onFrame);