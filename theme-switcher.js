/* Reusable background-theme switcher for In Order Words.
   A palette button (bottom-left) cycles the page background through richer,
   animated scenes. Space is the page's own background (no override); the other
   themes paint an atmospheric gradient + a layered particle scene on a canvas
   behind the UI, and hide the page's own starfield. Remembered per device.
   Cheap "fake glow" (stacked translucent circles) keeps it smooth on phones.
*/
(function(){
  var THEMES = [
    { id:'space',  emoji:'🌌', name:'Space' },   // default: the page's own background
    { id:'forest', emoji:'🌲', name:'Forest',
      grad:'radial-gradient(ellipse at 50% -15%, #1f6b3c 0%, #0e3f23 48%, #05170d 100%)',
      sky:[['#1f6b3c',0],['#0e3f23',0.5],['#05170d',1]],
      orbs:[{c:'rgba(150,235,140,0.10)',r:0.55},{c:'rgba(90,200,120,0.08)',r:0.7}],
      part:{kind:'mote', n:64, colors:['#bff09a','#e8f58a','#7fd98f','#d4ff9e'], dir:-1, rise:0.22, sway:0.9, size:[1.2,3.2]} },
    { id:'sea',    emoji:'🌊', name:'Sea',
      grad:'radial-gradient(ellipse at 50% -15%, #1189c0 0%, #0a5277 45%, #042234 100%)',
      sky:[['#1189c0',0],['#0a5277',0.5],['#042234',1]],
      orbs:[{c:'rgba(150,230,255,0.10)',r:0.5},{c:'rgba(90,200,240,0.08)',r:0.65}],
      caustic:true,
      part:{kind:'bubble', n:46, colors:['#bfefff','#8fd4ef','#e6faff'], dir:-1, rise:0.30, sway:1.4, size:[1.6,5.5]} },
    { id:'sunset', emoji:'🌅', name:'Sunset',
      grad:'linear-gradient(180deg, #2a1950 0%, #6e2b63 30%, #b24a4e 56%, #e98a4c 78%, #2a1526 100%)',
      sky:[['#2a1950',0],['#6e2b63',0.3],['#b24a4e',0.56],['#e98a4c',0.80],['#2a1526',1]],
      sun:{x:0.5,y:0.74,c:'rgba(255,190,120,0.35)'},
      orbs:[{c:'rgba(255,170,110,0.10)',r:0.6}],
      part:{kind:'ember', n:42, colors:['#ffd89e','#ff9e5e','#ffe8b0','#ff7e5f'], dir:-1, rise:0.26, sway:1.0, size:[1.2,3.0]} },
    { id:'sakura', emoji:'🌸', name:'Blossom',
      grad:'radial-gradient(ellipse at 50% -15%, #4a2c66 0%, #7a3f7e 45%, #2a1840 100%)',
      sky:[['#4a2c66',0],['#7a3f7e',0.45],['#2a1840',1]],
      orbs:[{c:'rgba(255,180,220,0.12)',r:0.55},{c:'rgba(210,150,255,0.09)',r:0.7}],
      part:{kind:'petal', n:40, colors:['#ffc2dd','#ffd6ea','#ff9ec4','#f7b3ff'], dir:1, rise:0.5, sway:2.0, size:[4,8]} },
    { id:'aurora', emoji:'🌠', name:'Aurora',
      grad:'radial-gradient(ellipse at 50% 120%, #0c2e40 0%, #07192a 50%, #03060f 100%)',
      sky:[['#0c2e40',0],['#07192a',0.5],['#03060f',1]],
      aurora:[{y:0.30,amp:0.05,h:0.22,c1:'rgba(80,255,170,0)',c2:'rgba(80,255,170,0.22)',sp:0.00035,fr:1.6,ph:0},
              {y:0.40,amp:0.06,h:0.26,c1:'rgba(120,150,255,0)',c2:'rgba(120,150,255,0.18)',sp:0.00026,fr:1.1,ph:2},
              {y:0.34,amp:0.045,h:0.20,c1:'rgba(190,120,255,0)',c2:'rgba(190,120,255,0.14)',sp:0.00042,fr:2.1,ph:4}],
      stars:70,
      part:{kind:'mote', n:28, colors:['#bfffe0','#cfe0ff','#ffffff'], dir:-1, rise:0.1, sway:0.5, size:[0.8,1.8]} }
  ];

  var idx = 0, canvas = null, cx = null, parts = [], orbs = [], stars = [], raf = null, t0 = 0, DPR = 1, reduce = false;
  try{ reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}

  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function W(){ return canvas ? canvas.width/DPR : innerWidth; }
  function H(){ return canvas ? canvas.height/DPR : innerHeight; }

  function ensureFx(){
    if(canvas) return;
    canvas = document.createElement('canvas'); canvas.id = 'iowThemeFx';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;display:none;';
    document.body.appendChild(canvas);
    cx = canvas.getContext('2d');
    var st = document.createElement('style');
    st.textContent = 'html[data-iow-theme] #stars,html[data-iow-theme] #starfield,html[data-iow-theme] canvas#bg,html[data-iow-theme] #space,html[data-iow-theme] #bgCanvas,html[data-iow-theme] #bg-canvas,html[data-iow-theme] .starfield{display:none!important;}';
    document.head.appendChild(st);
    window.addEventListener('resize', resize);
  }
  function resize(){
    if(!canvas) return;
    DPR = Math.min(window.devicePixelRatio||1, 2);
    canvas.width = Math.floor(innerWidth*DPR); canvas.height = Math.floor(innerHeight*DPR);
    canvas.style.width = innerWidth+'px'; canvas.style.height = innerHeight+'px';
    cx.setTransform(DPR,0,0,DPR,0,0);
  }

  function build(theme){
    var w = W(), h = H();
    parts = []; orbs = []; stars = [];
    var p = theme.part;
    if(p){
      for(var i=0;i<p.n;i++){
        parts.push({
          x: rnd(0,w), y: rnd(0,h),
          r: rnd(p.size[0], p.size[1]),
          sp: rnd(p.rise*0.5, p.rise*1.6),
          sway: rnd(p.sway*0.4, p.sway),
          ph: rnd(0, Math.PI*2),
          spin: rnd(-0.02,0.02), ang: rnd(0,Math.PI*2),
          tw: rnd(0.004,0.02), tph: rnd(0,Math.PI*2),
          c: p.colors[(Math.random()*p.colors.length)|0]
        });
      }
    }
    (theme.orbs||[]).forEach(function(o){
      orbs.push({ x: rnd(0.15,0.85)*w, y: rnd(0.1,0.6)*h, r: o.r*Math.max(w,h), c:o.c,
        dx: rnd(-0.06,0.06), dy: rnd(-0.04,0.04) });
    });
    var ns = theme.stars||0;
    for(var s=0;s<ns;s++) stars.push({ x:rnd(0,w), y:rnd(0,h*0.8), r:rnd(0.4,1.4), tw:rnd(0.004,0.02), tph:rnd(0,7) });
  }

  function glowDot(x,y,r,color,alpha){
    // cheap fake glow: 3 stacked translucent discs
    cx.globalAlpha = alpha*0.25; cx.fillStyle = color;
    cx.beginPath(); cx.arc(x,y,r*2.6,0,6.2832); cx.fill();
    cx.globalAlpha = alpha*0.55;
    cx.beginPath(); cx.arc(x,y,r*1.5,0,6.2832); cx.fill();
    cx.globalAlpha = alpha;
    cx.beginPath(); cx.arc(x,y,r,0,6.2832); cx.fill();
  }

  function petal(x,y,r,ang,color,alpha){
    cx.save(); cx.translate(x,y); cx.rotate(ang);
    cx.globalAlpha = alpha; cx.fillStyle = color;
    cx.beginPath();
    cx.moveTo(0,-r);
    cx.quadraticCurveTo(r*0.9,-r*0.2, 0,r);
    cx.quadraticCurveTo(-r*0.9,-r*0.2, 0,-r);
    cx.fill();
    cx.restore();
  }

  function frame(theme, now){
    if(!cx) return;
    var w = W(), h = H(), dt = Math.min(40, now - (t0||now)); t0 = now;
    cx.clearRect(0,0,w,h);

    // glow orbs (drift)
    orbs.forEach(function(o){
      o.x += o.dx*dt*0.05; o.y += o.dy*dt*0.05;
      if(o.x< -o.r) o.x = w+o.r; if(o.x>w+o.r) o.x=-o.r;
      if(o.y< -o.r) o.y = h+o.r; if(o.y>h+o.r) o.y=-o.r;
      var g = cx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r);
      g.addColorStop(0,o.c); g.addColorStop(1,'rgba(0,0,0,0)');
      cx.globalAlpha = 1; cx.fillStyle = g;
      cx.fillRect(0,0,w,h);
    });

    // sunset sun glow
    if(theme.sun){
      var sx=theme.sun.x*w, sy=theme.sun.y*h, sr=Math.max(w,h)*0.5;
      var sg = cx.createRadialGradient(sx,sy,0,sx,sy,sr);
      sg.addColorStop(0,theme.sun.c); sg.addColorStop(1,'rgba(0,0,0,0)');
      cx.fillStyle=sg; cx.fillRect(0,0,w,h);
    }

    // aurora ribbons
    if(theme.aurora){
      theme.aurora.forEach(function(a){
        var baseY = a.y*h, amp = a.amp*h, bh = a.h*h, phase = now*a.sp + a.ph;
        var grd = cx.createLinearGradient(0, baseY-amp, 0, baseY+bh);
        grd.addColorStop(0, a.c1); grd.addColorStop(0.5, a.c2); grd.addColorStop(1, a.c1);
        cx.fillStyle = grd; cx.globalAlpha = 1;
        cx.beginPath(); cx.moveTo(0,h);
        for(var x=0;x<=w;x+=14){ var y = baseY + Math.sin(x/w*Math.PI*a.fr + phase)*amp + Math.sin(x/w*Math.PI*a.fr*2.3 + phase*1.7)*amp*0.35; cx.lineTo(x,y); }
        for(var x2=w;x2>=0;x2-=14){ var y2 = baseY+bh + Math.sin(x2/w*Math.PI*a.fr + phase)*amp*0.7; cx.lineTo(x2,y2); }
        cx.closePath(); cx.fill();
      });
    }

    // background stars (aurora/space-lite)
    if(stars.length){
      cx.fillStyle = '#ffffff';
      stars.forEach(function(s){ s.tph += s.tw*dt; var a = 0.35 + 0.45*(0.5+0.5*Math.sin(s.tph)); cx.globalAlpha=a; cx.beginPath(); cx.arc(s.x,s.y,s.r,0,6.2832); cx.fill(); });
    }

    // particles
    var p = theme.part;
    if(p){
      parts.forEach(function(d){
        d.ph += 0.02*dt*0.06; d.y += p.dir>0 ? d.sp*dt*0.06 : -d.sp*dt*0.06;
        d.x += Math.sin(d.ph)*d.sway*dt*0.03;
        d.ang += d.spin*dt*0.06; d.tph += d.tw*dt;
        // wrap
        if(p.dir<0 && d.y < -8){ d.y = h+8; d.x = rnd(0,w); }
        if(p.dir>0 && d.y > h+8){ d.y = -8; d.x = rnd(0,w); }
        if(d.x< -8) d.x=w+8; if(d.x>w+8) d.x=-8;
        var tw = 0.6 + 0.4*(0.5+0.5*Math.sin(d.tph));
        if(p.kind==='petal'){ petal(d.x,d.y,d.r,d.ang,d.c,0.85*tw); }
        else if(p.kind==='bubble'){
          cx.globalAlpha = 0.5*tw; cx.strokeStyle = d.c; cx.lineWidth = 1.2;
          cx.beginPath(); cx.arc(d.x,d.y,d.r,0,6.2832); cx.stroke();
          cx.globalAlpha = 0.9*tw; cx.fillStyle = d.c;
          cx.beginPath(); cx.arc(d.x-d.r*0.3,d.y-d.r*0.3,Math.max(0.8,d.r*0.28),0,6.2832); cx.fill();
        }
        else { glowDot(d.x,d.y,d.r,d.c,0.7*tw); }
      });
    }

    // occasional shooting star on aurora
    cx.globalAlpha = 1;
    raf = requestAnimationFrame(function(n){ frame(theme, n); });
  }

  function apply(i){
    idx = ((i % THEMES.length) + THEMES.length) % THEMES.length;
    var t = THEMES[idx];
    ls('iow_theme', t.id);
    var btn = document.getElementById('iowThemeBtn'); if(btn){ btn.textContent = t.emoji; btn.title = 'Background: ' + t.name + ' (tap to change)'; }
    if(raf){ cancelAnimationFrame(raf); raf = null; }
    if(t.id === 'space'){
      document.documentElement.removeAttribute('data-iow-theme');
      document.body.style.removeProperty('background');
      document.body.style.removeProperty('background-attachment');
      if(canvas) canvas.style.display='none';
      return;
    }
    document.documentElement.setAttribute('data-iow-theme', t.id);
    document.body.style.setProperty('background', t.grad, 'important');
    document.body.style.setProperty('background-attachment', 'fixed', 'important');
    ensureFx(); resize(); canvas.style.display='block';
    build(t);
    if(reduce){ // draw one still frame, no animation
      t0 = 0; frame(t, 0); if(raf){ cancelAnimationFrame(raf); raf=null; }
    } else {
      t0 = 0; raf = requestAnimationFrame(function(n){ frame(t, n); });
    }
  }

  function mountBtn(){
    if(document.getElementById('iowThemeBtn')) return;
    var css = document.createElement('style');
    css.textContent = '#iowThemeBtn{position:fixed;left:12px;bottom:104px;z-index:2147483000;width:42px;height:42px;border-radius:50%;'
      +'display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;'
      +'background:rgba(15,20,40,.92);color:#fff;border:1px solid rgba(255,255,255,.28);'
      +'box-shadow:0 6px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .12s ease;}'
      +'#iowThemeBtn:hover{border-color:#ffcc66;transform:scale(1.07);}#iowThemeBtn:active{transform:scale(.94);}';
    document.head.appendChild(css);
    var btn = document.createElement('button'); btn.id='iowThemeBtn'; btn.type='button';
    btn.setAttribute('aria-label','Change background theme');
    btn.addEventListener('click', function(){ apply(idx+1); });
    document.body.appendChild(btn);
    var saved = ls('iow_theme'); var si = 0;
    for(var i=0;i<THEMES.length;i++){ if(THEMES[i].id===saved) si=i; }
    apply(si);
  }

  // pause animation when tab hidden (save battery)
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
    else if(THEMES[idx] && THEMES[idx].id!=='space' && !reduce){ t0=0; raf=requestAnimationFrame(function(n){ frame(THEMES[idx], n); }); }
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBtn);
  else mountBtn();
})();
