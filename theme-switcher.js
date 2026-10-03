/* Reusable background-theme switcher for In Order Words games.
   Adds a palette button (bottom-left, above the music button) that cycles
   the page background: Space (default) -> Forest -> Sea -> Sunset.
   Each non-default theme paints a full-screen gradient + themed particles
   behind the game UI and hides the game's own starfield. Remembered per device.
*/
(function(){
  var THEMES = [
    { id:'space',  emoji:'🌌', name:'Space'  },
    { id:'forest', emoji:'🌲', name:'Forest', grad:'radial-gradient(circle at 50% -10%, #12402a, #0a2419 55%, #05140d)', p:{color:['#6fcf97','#b7e778','#3fae5c'], dir:1, drift:true} },
    { id:'sea',    emoji:'🌊', name:'Sea',    grad:'radial-gradient(circle at 50% -10%, #0a4a70, #053049 55%, #02121f)', p:{color:['#9fe3ff','#5fb8e6','#c9f3ff'], dir:-1, drift:false} },
    { id:'sunset', emoji:'🌇', name:'Sunset', grad:'linear-gradient(180deg, #4a2550 0%, #7a2f4a 35%, #b5533a 70%, #2a1326 100%)', p:{color:['#ffd27f','#ff9e5e','#ffe8b0'], dir:-1, drift:true} }
  ];
  var idx = 0, canvas = null, cctx = null, parts = [], raf = null;

  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }

  function ensureLayers(){
    if(document.getElementById('iowThemeBg')) return;
    var bg = document.createElement('div'); bg.id = 'iowThemeBg';
    bg.style.cssText = 'position:fixed;inset:0;z-index:-2;pointer-events:none;display:none;';
    document.body.appendChild(bg);
    canvas = document.createElement('canvas'); canvas.id = 'iowThemeFx';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;display:none;';
    document.body.appendChild(canvas);
    cctx = canvas.getContext('2d');
    var st = document.createElement('style');
    st.textContent = 'html[data-iow-theme] #stars,html[data-iow-theme] #starfield,html[data-iow-theme] canvas#bg,html[data-iow-theme] #space{display:none!important;}';
    document.head.appendChild(st);
    window.addEventListener('resize', resize);
  }
  function resize(){ if(!canvas) return; canvas.width = innerWidth; canvas.height = innerHeight; }

  function makeParts(theme){
    parts = []; var n = 60;
    for(var i=0;i<n;i++){
      parts.push({ x:Math.random()*innerWidth, y:Math.random()*innerHeight,
        r:Math.random()*2.6+1.2, s:Math.random()*0.5+0.25,
        sway:Math.random()*0.6+0.2, ph:Math.random()*Math.PI*2,
        c: theme.p.color[Math.floor(Math.random()*theme.p.color.length)] });
    }
  }
  function loop(theme){
    if(!cctx) return;
    cctx.clearRect(0,0,canvas.width,canvas.height);
    var dir = theme.p.dir;
    for(var i=0;i<parts.length;i++){
      var p = parts[i];
      p.y += p.s * dir; p.ph += 0.02;
      if(theme.p.drift) p.x += Math.sin(p.ph)*p.sway;
      if(dir>0 && p.y>canvas.height+6){ p.y=-6; p.x=Math.random()*canvas.width; }
      if(dir<0 && p.y<-6){ p.y=canvas.height+6; p.x=Math.random()*canvas.width; }
      cctx.globalAlpha = 0.65; cctx.fillStyle = p.c;
      cctx.beginPath(); cctx.arc(p.x,p.y,p.r,0,Math.PI*2); cctx.fill();
    }
    cctx.globalAlpha = 1;
    raf = requestAnimationFrame(function(){ loop(theme); });
  }

  function apply(i){
    idx = ((i % THEMES.length) + THEMES.length) % THEMES.length;
    var t = THEMES[idx];
    ls('iow_theme', t.id);
    var btn = document.getElementById('iowThemeBtn'); if(btn){ btn.textContent = t.emoji; btn.title = 'Background: ' + t.name + ' (tap to change)'; }
    if(raf){ cancelAnimationFrame(raf); raf = null; }
    if(t.id === 'space'){
      document.documentElement.removeAttribute('data-iow-theme');
      var bg0 = document.getElementById('iowThemeBg'), fx0 = document.getElementById('iowThemeFx');
      if(bg0) bg0.style.display='none'; if(fx0) fx0.style.display='none';
      return;
    }
    ensureLayers(); resize();
    document.documentElement.setAttribute('data-iow-theme', t.id);
    var bg = document.getElementById('iowThemeBg'); bg.style.background = t.grad; bg.style.display='block';
    canvas.style.display='block';
    makeParts(t); loop(t);
  }

  function mountBtn(){
    if(document.getElementById('iowThemeBtn')) return;
    var css = document.createElement('style');
    css.textContent = '#iowThemeBtn{position:fixed;left:12px;bottom:104px;z-index:2147483000;width:42px;height:42px;border-radius:50%;'
      +'display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;'
      +'background:rgba(15,20,40,.92);color:#fff;border:1px solid rgba(255,255,255,.28);'
      +'box-shadow:0 6px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}'
      +'#iowThemeBtn:hover{border-color:#4da6ff;}';
    document.head.appendChild(css);
    var btn = document.createElement('button'); btn.id='iowThemeBtn'; btn.type='button';
    btn.addEventListener('click', function(){ apply(idx+1); });
    document.body.appendChild(btn);
    var saved = ls('iow_theme'); var si = 0;
    for(var i=0;i<THEMES.length;i++){ if(THEMES[i].id===saved) si=i; }
    apply(si);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBtn);
  else mountBtn();
})();
