/* Background-theme switcher for In Order Words — v4 "image scenes".
   Each theme is a high-quality illustrated background IMAGE (real depth: haze,
   bloom, layers) with a slow Ken-Burns drift for life, plus a light animated
   particle layer on top (embers / fireflies / bubbles / petals / sparkles).
   Dark pages get the full image scene behind the UI; light study pages get a
   soft readable pale wash of the same theme. Remembered per device.
*/
(function(){
  var THEMES = [
    { id:'space',  emoji:'🌌', name:'Space' },
    { id:'forest', emoji:'🌳', name:'Forest', img:'bg-forest.jpg',
      litegrad:'linear-gradient(165deg, #eef7ea 0%, #dceee1 100%)',
      part:{kind:'firefly', n:30, colors:['#d6ff8a','#ecff9c','#bdf06a'], size:[1.6,3.4], rise:0.5} },
    { id:'sea',    emoji:'🌊', name:'Sea', img:'bg-sea.jpg',
      litegrad:'linear-gradient(165deg, #ecf6fb 0%, #d6ebf6 100%)',
      part:{kind:'bubble', n:34, colors:['#cdefff','#9fdcf2','#eafaff'], size:[2,7], rise:0.7} },
    { id:'sunset', emoji:'🌅', name:'Sunset', img:'bg-sunset.jpg',
      litegrad:'linear-gradient(165deg, #fdf2e8 0%, #f8e4ee 100%)',
      part:{kind:'ember', n:40, colors:['#ffe3a0','#ffb060','#ffd08a'], size:[1.4,3.8], rise:0.6} },
    { id:'sakura', emoji:'🌸', name:'Blossom', img:'bg-sakura.jpg',
      litegrad:'linear-gradient(165deg, #fcf0f7 0%, #f0e7fb 100%)',
      part:{kind:'petal', n:40, colors:['#ffc2dd','#ffd9ea','#ff9ec4'], size:[5,11], rise:0.5} },
    { id:'aurora', emoji:'🌠', name:'Aurora', img:'bg-aurora.jpg',
      litegrad:'linear-gradient(165deg, #e9f5f1 0%, #e2ecfb 100%)',
      part:{kind:'sparkle', n:32, colors:['#bfffe0','#cfe6ff','#ffffff'], size:[0.8,1.8], rise:0.15, shoot:true} }
  ];

  var idx=0, canvas=null, cx=null, bgImg=null, scrim=null, raf=null, t0=0, DPR=1, reduce=false, LIGHT=false;
  var parts=[], shoots=[];
  try{ reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}

  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
  function rnd(a,b){ return a+Math.random()*(b-a); }
  function pick(a){ return a[(Math.random()*a.length)|0]; }
  function W(){ return canvas ? canvas.width/DPR : innerWidth; }
  function H(){ return canvas ? canvas.height/DPR : innerHeight; }

  function detectLight(){
    try{
      function probe(el){ if(!el) return null; var c=getComputedStyle(el).backgroundColor||''; var m=c.match(/rgba?\(([^)]+)\)/); if(!m) return null;
        var p=m[1].split(',').map(parseFloat); if(p.length>=4 && p[3]===0) return null; return (0.299*p[0]+0.587*p[1]+0.114*p[2])/255; }
      var lb=probe(document.body), lh=probe(document.documentElement);
      var lum=(lb!==null)?lb:(lh!==null?lh:0); return lum>0.62;
    }catch(e){ return false; }
  }

  // base path for images = folder of this script (so it works from any page)
  function basePath(){
    try{ var s=document.currentScript; if(!s){ var ss=document.getElementsByTagName('script'); for(var i=0;i<ss.length;i++){ if(/theme-switcher\.js/.test(ss[i].src)) s=ss[i]; } }
      if(s&&s.src) return s.src.replace(/[^\/]*$/,''); }catch(e){}
    return '';
  }
  var BASE = basePath();

  function ensureLayers(){
    if(canvas) return;
    var z='0';
    bgImg=document.createElement('div'); bgImg.id='iowBgImg';
    bgImg.style.cssText='position:fixed;inset:-6%;z-index:'+z+';pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;will-change:transform;display:none;';
    document.body.appendChild(bgImg);
    scrim=document.createElement('div'); scrim.id='iowScrim';
    scrim.style.cssText='position:fixed;inset:0;z-index:'+z+';pointer-events:none;display:none;'
      +'background:linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.42) 100%);';
    document.body.appendChild(scrim);
    canvas=document.createElement('canvas'); canvas.id='iowThemeFx';
    canvas.style.cssText='position:fixed;inset:0;z-index:'+z+';pointer-events:none;display:none;';
    document.body.appendChild(canvas);
    cx=canvas.getContext('2d');
    var st=document.createElement('style');
    st.textContent='@keyframes iowKB{0%{transform:scale(1.06) translate(0,0)}50%{transform:scale(1.13) translate(-2.2%,-1.4%)}100%{transform:scale(1.06) translate(0,0)}}'
      +'#iowBgImg{animation:iowKB 46s ease-in-out infinite;}'
      +'@media (prefers-reduced-motion:reduce){#iowBgImg{animation:none;}}'
      +'html[data-iow-theme] #stars,html[data-iow-theme] #starfield,html[data-iow-theme] canvas#bg,html[data-iow-theme] #space,html[data-iow-theme] #bgCanvas,html[data-iow-theme] #bg-canvas,html[data-iow-theme] .starfield,html[data-iow-theme] #particles{display:none!important;}';
    document.head.appendChild(st);
    window.addEventListener('resize', resize);
  }
  function resize(){
    if(!canvas) return;
    DPR=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(innerWidth*DPR); canvas.height=Math.floor(innerHeight*DPR);
    canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px';
    cx.setTransform(DPR,0,0,DPR,0,0);
  }

  function build(theme){
    var w=W(), h=H(); parts=[]; shoots=[];
    var p=theme.part; if(!p) return;
    for(var i=0;i<p.n;i++) parts.push({ x:rnd(0,w), y:rnd(0,h), r:rnd(p.size[0],p.size[1]),
      sp:rnd(p.rise*0.5,p.rise*1.5), sway:rnd(0.4,1.6), ph:rnd(0,6.28), ang:rnd(0,6.28), spin:rnd(-0.03,0.03),
      tw:rnd(0.004,0.02), tph:rnd(0,6.28), c:pick(p.colors) });
  }

  function glow(x,y,r,color,a){
    cx.globalAlpha=a*0.2; cx.fillStyle=color; cx.beginPath(); cx.arc(x,y,r*3,0,6.2832); cx.fill();
    cx.globalAlpha=a*0.5; cx.beginPath(); cx.arc(x,y,r*1.7,0,6.2832); cx.fill();
    cx.globalAlpha=a; cx.beginPath(); cx.arc(x,y,r,0,6.2832); cx.fill();
  }
  function petalShape(x,y,r,ang,color,a){
    cx.save(); cx.translate(x,y); cx.rotate(ang); cx.globalAlpha=a; cx.fillStyle=color;
    cx.beginPath(); cx.moveTo(0,-r); cx.quadraticCurveTo(r*0.95,-r*0.2,0,r); cx.quadraticCurveTo(-r*0.95,-r*0.2,0,-r); cx.fill();
    cx.restore();
  }

  function frame(theme, now){
    if(!cx) return;
    var w=W(), h=H(), dt=Math.min(40, now-(t0||now)); t0=now;
    cx.clearRect(0,0,w,h);
    var p=theme.part, up=(p.kind!=='petal');
    parts.forEach(function(d){
      d.ph += 0.02*dt*0.06; d.tph += d.tw*dt; d.ang += d.spin*dt*0.06;
      d.y += (up?-1:1)*d.sp*dt*0.05; d.x += Math.sin(d.ph)*d.sway*dt*0.03;
      if(up && d.y<-14){ d.y=h+14; d.x=rnd(0,w); } if(!up && d.y>h+14){ d.y=-14; d.x=rnd(0,w); }
      if(d.x<-14) d.x=w+14; if(d.x>w+14) d.x=-14;
      var tw=0.55+0.45*(0.5+0.5*Math.sin(d.tph));
      if(p.kind==='petal'){ petalShape(d.x,d.y,d.r,d.ang+Math.sin(d.ph)*0.6,d.c,0.9*tw); }
      else if(p.kind==='bubble'){ cx.globalAlpha=0.5*tw; cx.strokeStyle=d.c; cx.lineWidth=1.3; cx.beginPath(); cx.arc(d.x,d.y,d.r,0,6.2832); cx.stroke();
        cx.globalAlpha=0.9*tw; cx.fillStyle=d.c; cx.beginPath(); cx.arc(d.x-d.r*0.3,d.y-d.r*0.3,Math.max(0.8,d.r*0.3),0,6.2832); cx.fill(); }
      else if(p.kind==='sparkle'){ cx.globalAlpha=tw*0.9; cx.fillStyle=d.c; cx.beginPath(); cx.arc(d.x,d.y,d.r,0,6.2832); cx.fill(); }
      else { glow(d.x,d.y,d.r,d.c,0.8*tw); } // ember / firefly
    });
    // shooting stars for aurora
    if(p.shoot){
      if(Math.random()<0.01 && shoots.length<2) shoots.push({x:rnd(0.1,0.7)*w,y:rnd(0.02,0.25)*h,vx:rnd(8,12),vy:rnd(3,5),life:0,max:rnd(40,70)});
      shoots.forEach(function(s){ s.x+=s.vx*dt*0.06; s.y+=s.vy*dt*0.06; s.life+=dt*0.06; var al=Math.max(0,1-s.life/s.max);
        cx.globalAlpha=al; cx.strokeStyle='#fff'; cx.lineWidth=2; cx.lineCap='round'; cx.beginPath(); cx.moveTo(s.x,s.y); cx.lineTo(s.x-s.vx*4,s.y-s.vy*4); cx.stroke(); });
      shoots=shoots.filter(function(s){ return s.life<s.max; });
    }
    cx.globalAlpha=1;
    raf=requestAnimationFrame(function(n){ frame(theme,n); });
  }

  function clearTheme(){
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    document.documentElement.removeAttribute('data-iow-theme');
    document.body.style.removeProperty('background'); document.body.style.removeProperty('background-attachment');
    if(bgImg) bgImg.style.display='none'; if(scrim) scrim.style.display='none'; if(canvas) canvas.style.display='none';
  }

  function apply(i){
    idx=((i%THEMES.length)+THEMES.length)%THEMES.length; var t=THEMES[idx];
    ls('iow_theme', t.id);
    var btn=document.getElementById('iowThemeBtn'); if(btn){ btn.textContent=t.emoji; btn.title='Background: '+t.name+' (tap to change)'; }
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    if(t.id==='space'){ clearTheme(); return; }
    document.documentElement.setAttribute('data-iow-theme', t.id);

    if(LIGHT){
      document.body.style.setProperty('background', t.litegrad, 'important');
      document.body.style.setProperty('background-attachment','fixed','important');
      if(bgImg) bgImg.style.display='none'; if(scrim) scrim.style.display='none'; if(canvas) canvas.style.display='none';
      return;
    }

    ensureLayers(); resize();
    document.body.style.removeProperty('background');
    bgImg.style.backgroundImage="url('"+BASE+t.img+"?v=6')"; bgImg.style.display='block';
    scrim.style.display='block'; canvas.style.display='block';
    build(t); t0=0;
    if(reduce){ frame(t,16); if(raf){ cancelAnimationFrame(raf); raf=null; } }
    else raf=requestAnimationFrame(function(n){ frame(t,n); });
  }

  function mountBtn(){
    if(document.getElementById('iowThemeBtn')) return;
    LIGHT=detectLight();
    var css=document.createElement('style');
    css.textContent='#iowThemeBtn{position:fixed;left:12px;bottom:104px;z-index:2147483000;width:42px;height:42px;border-radius:50%;'
      +'display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;background:rgba(15,20,40,.92);color:#fff;'
      +'border:1px solid rgba(255,255,255,.28);box-shadow:0 6px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .12s ease;}'
      +'#iowThemeBtn:hover{border-color:#ffcc66;transform:scale(1.07);}#iowThemeBtn:active{transform:scale(.94);}';
    document.head.appendChild(css);
    var btn=document.createElement('button'); btn.id='iowThemeBtn'; btn.type='button'; btn.setAttribute('aria-label','Change background theme');
    btn.addEventListener('click', function(){ apply(idx+1); });
    document.body.appendChild(btn);
    var saved=ls('iow_theme'), si=0; for(var i=0;i<THEMES.length;i++){ if(THEMES[i].id===saved) si=i; }
    apply(si);
  }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
    else if(!LIGHT && THEMES[idx] && THEMES[idx].id!=='space' && !reduce){ t0=0; raf=requestAnimationFrame(function(n){ frame(THEMES[idx],n); }); }
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mountBtn);
  else mountBtn();
})();
