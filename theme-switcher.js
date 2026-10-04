/* Background-theme switcher for In Order Words — v3 "scenes".
   A palette button (bottom-left) cycles the page background through full
   animated SCENES (not just a colour): a setting sun over layered hills,
   a pine forest with glowing fireflies, an underwater world with light
   shafts and bubbles, cherry blossom on the wind, and northern lights with
   shooting stars over a mountain range. Remembered per device.
   Dark pages get the full scene behind the UI; light study pages get a soft
   readable pale wash of the same theme (no particles over the text).
   Everything is plain canvas 2D, tuned to stay smooth on phones.
*/
(function(){
  var THEMES = [
    { id:'space',  emoji:'🌌', name:'Space' },
    { id:'forest', emoji:'🌲', name:'Forest',
      grad:'linear-gradient(180deg, #123a22 0%, #0c3a24 30%, #0a2e1d 60%, #041a0f 100%)',
      litegrad:'linear-gradient(165deg, #eef7ea 0%, #dceee1 100%)' },
    { id:'sea',    emoji:'🌊', name:'Sea',
      grad:'linear-gradient(180deg, #2aa7d8 0%, #1484b4 22%, #0a5277 55%, #052c42 100%)',
      litegrad:'linear-gradient(165deg, #ecf6fb 0%, #d6ebf6 100%)' },
    { id:'sunset', emoji:'🌅', name:'Sunset',
      grad:'linear-gradient(180deg, #241a52 0%, #5a2a6e 26%, #9e3d66 48%, #e06a47 70%, #ffb061 86%, #ffd08a 100%)',
      litegrad:'linear-gradient(165deg, #fdf2e8 0%, #f8e4ee 100%)' },
    { id:'sakura', emoji:'🌸', name:'Blossom',
      grad:'linear-gradient(180deg, #512e74 0%, #8a4a86 40%, #b96a9a 72%, #efc6dd 100%)',
      litegrad:'linear-gradient(165deg, #fcf0f7 0%, #f0e7fb 100%)' },
    { id:'aurora', emoji:'🌠', name:'Aurora',
      grad:'linear-gradient(180deg, #030616 0%, #061a2e 45%, #0a2b40 78%, #0d3a4e 100%)',
      litegrad:'linear-gradient(165deg, #e9f5f1 0%, #e2ecfb 100%)' }
  ];

  var idx=0, canvas=null, cx=null, raf=null, t0=0, DPR=1, reduce=false, LIGHT=false;
  var parts=[], stars=[], shoots=[], scene={};
  try{ reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches; }catch(e){}

  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }
  function rnd(a,b){ return a + Math.random()*(b-a); }
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

  function ensureFx(){
    if(canvas) return;
    canvas=document.createElement('canvas'); canvas.id='iowThemeFx';
    canvas.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;display:none;';
    document.body.appendChild(canvas);
    cx=canvas.getContext('2d');
    var st=document.createElement('style');
    st.textContent='html[data-iow-theme] #stars,html[data-iow-theme] #starfield,html[data-iow-theme] canvas#bg,html[data-iow-theme] #space,html[data-iow-theme] #bgCanvas,html[data-iow-theme] #bg-canvas,html[data-iow-theme] .starfield,html[data-iow-theme] #particles{display:none!important;}';
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

  // ---------- scene geometry (precomputed on build) ----------
  function ridge(baseY, amp, n){ var pts=[]; for(var i=0;i<=n;i++) pts.push({fx:i/n, fy: baseY + (Math.random()-0.5)*amp}); return pts; }
  function drawRidge(pts, color, a){
    var w=W(), h=H(); cx.globalAlpha=a; cx.fillStyle=color;
    cx.beginPath(); cx.moveTo(0,h); cx.lineTo(0, pts[0].fy*h);
    for(var i=1;i<pts.length;i++){ var x0=pts[i-1].fx*w,y0=pts[i-1].fy*h,x1=pts[i].fx*w,y1=pts[i].fy*h,mx=(x0+x1)/2;
      cx.bezierCurveTo(mx,y0,mx,y1,x1,y1); }
    cx.lineTo(w,h); cx.closePath(); cx.fill();
  }

  function build(theme){
    var w=W(), h=H(); parts=[]; stars=[]; shoots=[]; scene={};
    var P=null;
    if(theme.id==='forest') P={n:46, size:[1.6,3.6], colors:['#d6ff8a','#ecff9c','#bdf06a','#f3ffb0']};
    else if(theme.id==='sea') P={n:40, size:[2,8], colors:['#cdefff','#9fdcf2','#eafaff']};
    else if(theme.id==='sunset') P={n:60, size:[1.5,4.2], colors:['#ffe3a0','#ffb060','#ffd08a','#ff8a4a']};
    else if(theme.id==='sakura') P={n:58, size:[6,13], colors:['#ffc2dd','#ffd9ea','#ff9ec4','#ffb3e6']};
    else if(theme.id==='aurora') P={n:26, size:[0.9,2.0], colors:['#bfffe0','#cfe6ff','#ffffff']};
    scene.P=P;
    if(P){ for(var i=0;i<P.n;i++) parts.push({ x:rnd(0,w), y:rnd(0,h), r:rnd(P.size[0],P.size[1]),
        sp:rnd(0.3,1.0), sway:rnd(0.4,1.6), ph:rnd(0,6.28), ang:rnd(0,6.28), spin:rnd(-0.03,0.03),
        tw:rnd(0.004,0.02), tph:rnd(0,6.28), c:pick(P.colors) }); }

    if(theme.id==='sunset'){
      scene.hills=[ {pts:ridge(0.78,0.06,7), c:'#8a3f66', a:0.55},
                    {pts:ridge(0.85,0.07,6), c:'#5f2a52', a:0.8},
                    {pts:ridge(0.93,0.05,8), c:'#331430', a:0.97} ];
      scene.birds=[]; for(var b=0;b<5;b++) scene.birds.push({x:rnd(0,w), y:rnd(0.15,0.45)*h, sp:rnd(6,12), sc:rnd(8,16), ph:rnd(0,6.28)});
    }
    if(theme.id==='forest'){
      scene.pinesFar=[]; var nf=14; for(var i2=0;i2<nf;i2++) scene.pinesFar.push({x:(i2+rnd(-0.2,0.2))/nf*w, sc:rnd(0.6,0.95)});
      scene.pinesNear=[]; var nn=9; for(var i3=0;i3<nn;i3++) scene.pinesNear.push({x:(i3+rnd(-0.25,0.25))/nn*w, sc:rnd(1.0,1.5)});
    }
    if(theme.id==='sea'){
      scene.weeds=[]; var nw=10; for(var i4=0;i4<nw;i4++) scene.weeds.push({x:(i4+rnd(-0.3,0.3))/nw*w, hh:rnd(0.12,0.28), sway:rnd(0.5,1.3), ph:rnd(0,6.28), seg:5});
      scene.fish=[]; for(var f=0;f<5;f++) scene.fish.push({x:rnd(0,w), y:rnd(0.3,0.75)*h, sp:rnd(4,9)*(Math.random()<0.5?1:-1), sc:rnd(8,18), ph:rnd(0,6.28)});
    }
    if(theme.id==='sakura'){
      scene.bokeh=[]; for(var k=0;k<10;k++) scene.bokeh.push({x:rnd(0,w), y:rnd(0,h), r:rnd(30,90), c:pick(['rgba(255,190,225,0.10)','rgba(230,170,255,0.08)']), dx:rnd(-0.05,0.05), dy:rnd(-0.03,0.03)});
      scene.blossoms=[]; for(var bl=0;bl<16;bl++){ var tt=bl/15; scene.blossoms.push({ x:w*(0.62+0.42*tt)+rnd(-18,18), y:h*(0.02+0.30*tt*tt)+rnd(-14,14), r:rnd(4,8)}); }
    }
    if(theme.id==='aurora'){
      var ns=130; for(var s=0;s<ns;s++) stars.push({x:rnd(0,w), y:rnd(0,h*0.82), r:rnd(0.4,1.6), tw:rnd(0.004,0.02), tph:rnd(0,6.28)});
      scene.moon={x:0.82*w, y:0.20*h, r:Math.min(w,h)*0.06};
      scene.mtnFar=ridge(0.82,0.05,7); scene.mtnNear=ridge(0.90,0.07,6);
      scene.bands=[ {y:0.34,amp:0.07,h:0.30,c:'80,255,180',sp:0.00030,fr:1.5,ph:0},
                    {y:0.44,amp:0.08,h:0.34,c:'110,170,255',sp:0.00022,fr:1.0,ph:2},
                    {y:0.30,amp:0.06,h:0.26,c:'200,120,255',sp:0.00038,fr:2.0,ph:4} ];
    }
  }

  // ---------- draw helpers ----------
  function glow(x,y,r,color,a){
    cx.globalAlpha=a*0.22; cx.fillStyle=color; cx.beginPath(); cx.arc(x,y,r*3.0,0,6.2832); cx.fill();
    cx.globalAlpha=a*0.5;  cx.beginPath(); cx.arc(x,y,r*1.7,0,6.2832); cx.fill();
    cx.globalAlpha=a;      cx.beginPath(); cx.arc(x,y,r,0,6.2832); cx.fill();
  }
  function petalShape(x,y,r,ang,color,a){
    cx.save(); cx.translate(x,y); cx.rotate(ang); cx.globalAlpha=a; cx.fillStyle=color;
    cx.beginPath(); cx.moveTo(0,-r); cx.quadraticCurveTo(r*0.95,-r*0.2,0,r); cx.quadraticCurveTo(-r*0.95,-r*0.2,0,-r); cx.fill();
    // little notch
    cx.globalAlpha=a*0.5; cx.fillStyle='rgba(255,255,255,0.5)'; cx.beginPath(); cx.ellipse(0,-r*0.2,r*0.14,r*0.4,0,0,6.28); cx.fill();
    cx.restore();
  }
  function pine(x,baseY,sc,color,a){
    var h=H(), th=70*sc, tw=26*sc, y=baseY;
    cx.globalAlpha=a; cx.fillStyle=color;
    // trunk
    cx.fillRect(x-2*sc, y-6*sc, 4*sc, 8*sc);
    // 3 stacked triangles
    for(var t=0;t<3;t++){ var ty=y-6*sc - t*(tw*0.72); var twid=tw*(1-t*0.22); var th=tw*1.0;
      cx.beginPath(); cx.moveTo(x, ty-th); cx.lineTo(x-twid, ty); cx.lineTo(x+twid, ty); cx.closePath(); cx.fill(); }
  }
  function shafts(colorTop, n, now, speed, skew){
    var w=W(), h=H(); cx.save(); cx.globalCompositeOperation='screen';
    for(var i=0;i<n;i++){
      var x=((i/n + (now*speed)) % 1.2 - 0.1)*w; var wd=w/n*0.42;
      var g=cx.createLinearGradient(x,0,x+skew,h*0.75); g.addColorStop(0,colorTop); g.addColorStop(1,'rgba(0,0,0,0)');
      cx.globalAlpha=0.5; cx.fillStyle=g;
      cx.beginPath(); cx.moveTo(x,0); cx.lineTo(x+wd,0); cx.lineTo(x+wd+skew,h*0.78); cx.lineTo(x+skew,h*0.78); cx.closePath(); cx.fill();
    }
    cx.restore();
  }

  function drawParticles(theme, now, dt){
    var w=W(), h=H(), P=scene.P; if(!P) return;
    var up = (theme.id!=='sakura'); // petals fall, others rise
    parts.forEach(function(d){
      d.ph += 0.02*dt*0.06; d.tph += d.tw*dt; d.ang += d.spin*dt*0.06;
      d.y += (up? -1:1) * d.sp*dt*0.05;
      d.x += Math.sin(d.ph)*d.sway*dt*0.03;
      if(up && d.y < -14){ d.y=h+14; d.x=rnd(0,w); }
      if(!up && d.y > h+14){ d.y=-14; d.x=rnd(0,w); }
      if(d.x<-14) d.x=w+14; if(d.x>w+14) d.x=-14;
      var tw=0.55+0.45*(0.5+0.5*Math.sin(d.tph));
      if(theme.id==='sakura'){ petalShape(d.x,d.y,d.r,d.ang+Math.sin(d.ph)*0.6,d.c,0.9*tw); }
      else if(theme.id==='sea'){
        cx.globalAlpha=0.45*tw; cx.strokeStyle=d.c; cx.lineWidth=1.3; cx.beginPath(); cx.arc(d.x,d.y,d.r,0,6.2832); cx.stroke();
        cx.globalAlpha=0.95*tw; cx.fillStyle=d.c; cx.beginPath(); cx.arc(d.x-d.r*0.3,d.y-d.r*0.3,Math.max(0.9,d.r*0.3),0,6.2832); cx.fill();
      } else { glow(d.x,d.y,d.r,d.c,0.8*tw); }
    });
  }

  function spawnShoot(){
    var w=W(),h=H();
    shoots.push({x:rnd(0.1,0.8)*w, y:rnd(0.03,0.3)*h, vx:rnd(7,11), vy:rnd(3,5), life:0, max:rnd(40,70)});
  }

  // ---------- per-theme scenes ----------
  function drawSunset(now,w,h,dt){
    // sun
    var sx=0.5*w, sy=0.70*h, sr=Math.min(w,h)*0.17, puls=1+0.012*Math.sin(now*0.002);
    var g=cx.createRadialGradient(sx,sy,0,sx,sy,sr*4.2);
    g.addColorStop(0,'rgba(255,228,150,0.55)'); g.addColorStop(0.3,'rgba(255,150,80,0.30)'); g.addColorStop(1,'rgba(255,120,60,0)');
    cx.globalAlpha=1; cx.fillStyle=g; cx.fillRect(0,0,w,h);
    var gd=cx.createRadialGradient(sx,sy,0,sx,sy,sr*puls);
    gd.addColorStop(0,'#fff3cf'); gd.addColorStop(0.6,'#ffd27a'); gd.addColorStop(1,'#ff9e48');
    cx.globalAlpha=0.96; cx.fillStyle=gd; cx.beginPath(); cx.arc(sx,sy,sr*puls,0,6.2832); cx.fill();
    // birds
    scene.birds.forEach(function(bd){ bd.x+=bd.sp*dt*0.02; if(bd.x>w+20) bd.x=-20; var yy=bd.y+Math.sin(now*0.001+bd.ph)*6;
      cx.globalAlpha=0.55; cx.strokeStyle='#2a1230'; cx.lineWidth=2; var s=bd.sc;
      cx.beginPath(); cx.moveTo(bd.x-s,yy); cx.quadraticCurveTo(bd.x-s*0.3,yy-s*0.5,bd.x,yy); cx.quadraticCurveTo(bd.x+s*0.3,yy-s*0.5,bd.x+s,yy); cx.stroke(); });
    // embers
    drawParticles(THEMES[idx],now,dt);
    // hills (front)
    scene.hills.forEach(function(L){ drawRidge(L.pts,L.c,L.a); });
  }

  function drawForest(now,w,h,dt){
    shafts('rgba(150,240,170,0.10)', 5, now, 0.000018, w*0.10);
    // mist band
    var mg=cx.createLinearGradient(0,h*0.72,0,h); mg.addColorStop(0,'rgba(180,255,200,0)'); mg.addColorStop(1,'rgba(120,230,160,0.10)');
    cx.globalAlpha=1; cx.fillStyle=mg; cx.fillRect(0,h*0.72,w,h*0.28);
    scene.pinesFar.forEach(function(p){ pine(p.x, h*0.86, p.sc, '#0c3d22', 0.75); });
    drawParticles(THEMES[idx],now,dt);
    scene.pinesNear.forEach(function(p){ pine(p.x, h*1.0, p.sc, '#05200f', 0.97); });
  }

  function drawSea(now,w,h,dt){
    // surface light
    var tg=cx.createLinearGradient(0,0,0,h*0.5); tg.addColorStop(0,'rgba(200,245,255,0.22)'); tg.addColorStop(1,'rgba(200,245,255,0)');
    cx.globalAlpha=1; cx.fillStyle=tg; cx.fillRect(0,0,w,h*0.5);
    shafts('rgba(190,240,255,0.12)', 6, now, 0.000022, w*0.16);
    // fish
    scene.fish.forEach(function(fs){ fs.x+=fs.sp*dt*0.02; if(fs.x>w+30) fs.x=-30; if(fs.x<-30) fs.x=w+30; var yy=fs.y+Math.sin(now*0.0012+fs.ph)*8, s=fs.sc, dir=fs.sp>0?1:-1;
      cx.globalAlpha=0.32; cx.fillStyle='#04354a'; cx.save(); cx.translate(fs.x,yy); cx.scale(dir,1);
      cx.beginPath(); cx.ellipse(0,0,s,s*0.45,0,0,6.28); cx.fill();
      cx.beginPath(); cx.moveTo(-s,0); cx.lineTo(-s-s*0.6,-s*0.4); cx.lineTo(-s-s*0.6,s*0.4); cx.closePath(); cx.fill(); cx.restore(); });
    drawParticles(THEMES[idx],now,dt);
    // seaweed (front)
    scene.weeds.forEach(function(wd){ var baseY=h, topY=h*(1-wd.hh); cx.globalAlpha=0.5; cx.strokeStyle='#063a46'; cx.lineWidth=5*(wd.hh*6);
      cx.beginPath(); cx.moveTo(wd.x,baseY);
      for(var s=1;s<=wd.seg;s++){ var ty=baseY+(topY-baseY)*(s/wd.seg); var off=Math.sin(now*0.002*wd.sway+wd.ph+s*0.6)*14*(s/wd.seg); cx.lineTo(wd.x+off,ty); }
      cx.stroke(); });
  }

  function drawSakura(now,w,h,dt){
    scene.bokeh.forEach(function(o){ o.x+=o.dx*dt*0.05; o.y+=o.dy*dt*0.05; if(o.x<-o.r)o.x=w+o.r; if(o.x>w+o.r)o.x=-o.r; if(o.y<-o.r)o.y=h+o.r; if(o.y>h+o.r)o.y=-o.r;
      var g=cx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r); g.addColorStop(0,o.c); g.addColorStop(1,'rgba(0,0,0,0)'); cx.globalAlpha=1; cx.fillStyle=g; cx.fillRect(0,0,w,h); });
    drawParticles(THEMES[idx],now,dt);
    // branch top-right (front)
    cx.globalAlpha=0.9; cx.strokeStyle='#3a2140'; cx.lineWidth=7; cx.lineCap='round';
    cx.beginPath(); cx.moveTo(w+10,-10); cx.quadraticCurveTo(w*0.78,h*0.06, w*0.5,h*0.12); cx.stroke();
    cx.lineWidth=4; cx.beginPath(); cx.moveTo(w*0.72,h*0.055); cx.quadraticCurveTo(w*0.70,h*0.14,w*0.60,h*0.20); cx.stroke();
    scene.blossoms.forEach(function(bm){ var sway=Math.sin(now*0.0015+bm.x)*2;
      // 5-petal flower
      for(var pt=0;pt<5;pt++){ var a=pt/5*6.2832; petalShape(bm.x+Math.cos(a)*bm.r*0.6+sway, bm.y+Math.sin(a)*bm.r*0.6, bm.r*0.7, a+1.57, '#ffd0e6', 0.92); }
      cx.globalAlpha=0.95; cx.fillStyle='#fff2b0'; cx.beginPath(); cx.arc(bm.x+sway,bm.y,bm.r*0.3,0,6.28); cx.fill(); });
  }

  function drawAurora(now,w,h,dt){
    // stars
    cx.fillStyle='#fff'; stars.forEach(function(s){ s.tph+=s.tw*dt; var a=0.3+0.5*(0.5+0.5*Math.sin(s.tph)); cx.globalAlpha=a; cx.beginPath(); cx.arc(s.x,s.y,s.r,0,6.2832); cx.fill(); });
    // moon
    var mo=scene.moon; var mg=cx.createRadialGradient(mo.x,mo.y,0,mo.x,mo.y,mo.r*3.2); mg.addColorStop(0,'rgba(220,235,255,0.35)'); mg.addColorStop(1,'rgba(220,235,255,0)');
    cx.globalAlpha=1; cx.fillStyle=mg; cx.fillRect(0,0,w,h);
    cx.globalAlpha=0.95; cx.fillStyle='#eaf2ff'; cx.beginPath(); cx.arc(mo.x,mo.y,mo.r,0,6.2832); cx.fill();
    // aurora curtains
    cx.save(); cx.globalCompositeOperation='screen';
    scene.bands.forEach(function(a){
      var baseY=a.y*h, amp=a.amp*h, bh=a.h*h, phase=now*a.sp+a.ph;
      // vertical curtain striations
      for(var x=0;x<=w;x+=10){
        var y=baseY + Math.sin(x/w*Math.PI*a.fr+phase)*amp + Math.sin(x/w*Math.PI*a.fr*2.3+phase*1.7)*amp*0.35;
        var flick=0.5+0.5*Math.sin(x*0.05+now*0.004+a.ph);
        var g=cx.createLinearGradient(0,y,0,y+bh);
        g.addColorStop(0,'rgba('+a.c+',0)'); g.addColorStop(0.45,'rgba('+a.c+','+(0.18*flick+0.05).toFixed(3)+')'); g.addColorStop(1,'rgba('+a.c+',0)');
        cx.globalAlpha=1; cx.fillStyle=g; cx.fillRect(x,y,11,bh);
      }
    });
    cx.restore();
    // shooting stars
    if(Math.random()<0.012 && shoots.length<3) spawnShoot();
    shoots.forEach(function(sh){ sh.x+=sh.vx*dt*0.06; sh.y+=sh.vy*dt*0.06; sh.life+=dt*0.06;
      var al=Math.max(0,1-sh.life/sh.max); cx.globalAlpha=al; cx.strokeStyle='#ffffff'; cx.lineWidth=2; cx.lineCap='round';
      cx.beginPath(); cx.moveTo(sh.x,sh.y); cx.lineTo(sh.x-sh.vx*4,sh.y-sh.vy*4); cx.stroke(); });
    shoots=shoots.filter(function(sh){ return sh.life<sh.max; });
    // faint drifting motes
    drawParticles(THEMES[idx],now,dt);
    // mountains (front)
    drawRidge(scene.mtnFar,'#071624',0.9); drawRidge(scene.mtnNear,'#030a12',0.98);
  }

  var SCENES={ forest:drawForest, sea:drawSea, sunset:drawSunset, sakura:drawSakura, aurora:drawAurora };

  function frame(theme, now){
    if(!cx) return;
    var w=W(), h=H(), dt=Math.min(40, now-(t0||now)); t0=now;
    cx.clearRect(0,0,w,h);
    var fn=SCENES[theme.id]; if(fn) fn(now,w,h,dt);
    cx.globalAlpha=1; cx.globalCompositeOperation='source-over';
    raf=requestAnimationFrame(function(n){ frame(theme,n); });
  }

  function clearTheme(){
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    document.documentElement.removeAttribute('data-iow-theme');
    document.body.style.removeProperty('background'); document.body.style.removeProperty('background-attachment');
    if(canvas) canvas.style.display='none';
  }

  function apply(i){
    idx=((i%THEMES.length)+THEMES.length)%THEMES.length; var t=THEMES[idx];
    ls('iow_theme', t.id);
    var btn=document.getElementById('iowThemeBtn'); if(btn){ btn.textContent=t.emoji; btn.title='Background: '+t.name+' (tap to change)'; }
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    if(t.id==='space'){ clearTheme(); return; }
    document.documentElement.setAttribute('data-iow-theme', t.id);
    if(LIGHT){
      document.body.style.setProperty('background', t.litegrad||t.grad, 'important');
      document.body.style.setProperty('background-attachment','fixed','important');
      if(canvas) canvas.style.display='none'; return;
    }
    document.body.style.setProperty('background', t.grad, 'important');
    document.body.style.setProperty('background-attachment','fixed','important');
    ensureFx(); resize(); canvas.style.display='block';
    build(t);
    t0=0;
    if(reduce){ frame(t,0); if(raf){ cancelAnimationFrame(raf); raf=null; } }
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
