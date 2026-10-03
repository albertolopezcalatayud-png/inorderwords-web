/* Reusable "How to play" button + modal for In Order Words games.
   Each game defines window.IOW_HELP before loading this script:
   window.IOW_HELP = {
     title: "Verb Striker",
     goal: "Type the correct past and participle forms before time runs out.",
     steps: ["...", "..."],
     tip: "optional one-liner"
   };
*/
(function(){
  function start(){
    var H = window.IOW_HELP;
    if(!H || document.getElementById('iowHelpBtn')) return;

    var css = document.createElement('style');
    css.textContent =
      '#iowHelpBtn{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;'
      +'background:rgba(15,20,40,.92);color:#fff;border:1px solid rgba(255,255,255,.28);border-radius:999px;'
      +'padding:9px 15px;font:700 13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;'
      +'box-shadow:0 6px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}'
      +'#iowHelpBtn:hover{border-color:#4da6ff;color:#cfe8ff;}'
      +'#iowHelpOv{position:fixed;inset:0;z-index:2147483001;display:none;align-items:center;justify-content:center;'
      +'background:rgba(2,4,12,.72);padding:18px;}'
      +'#iowHelpOv.on{display:flex;}'
      +'#iowHelpCard{max-width:460px;width:100%;max-height:85vh;overflow:auto;background:#0e1328;color:#eef2ff;'
      +'border:1px solid rgba(120,160,255,.35);border-radius:18px;padding:22px 22px 18px;'
      +'box-shadow:0 24px 60px rgba(0,0,0,.6);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}'
      +'#iowHelpCard h2{margin:0 0 4px;font-size:20px;font-weight:800;color:#8ec5ff;}'
      +'#iowHelpCard .goal{margin:0 0 14px;color:#c7d2fe;font-weight:600;}'
      +'#iowHelpCard ol{margin:0 0 14px;padding-left:20px;}'
      +'#iowHelpCard li{margin:0 0 8px;}'
      +'#iowHelpCard .tip{background:rgba(78,166,255,.12);border:1px solid rgba(78,166,255,.3);border-radius:10px;'
      +'padding:10px 12px;margin:0 0 16px;color:#d6e6ff;}'
      +'#iowHelpClose{display:block;width:100%;border:none;border-radius:11px;padding:13px;cursor:pointer;'
      +'background:linear-gradient(120deg,#4da6ff,#2d7dff);color:#03122b;font-weight:800;font-size:15px;}';
    document.head.appendChild(css);

    var btn = document.createElement('button');
    btn.id = 'iowHelpBtn'; btn.type = 'button';
    btn.innerHTML = '❓ How to play';
    btn.setAttribute('aria-label','How to play');

    var ov = document.createElement('div');
    ov.id = 'iowHelpOv';
    var esc = function(t){ return String(t).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); };
    var steps = (H.steps||[]).map(function(s){ return '<li>'+esc(s)+'</li>'; }).join('');
    ov.innerHTML = '<div id="iowHelpCard" role="dialog" aria-modal="true">'
      + '<h2>🎮 '+esc(H.title||'How to play')+'</h2>'
      + (H.goal ? '<p class="goal">'+esc(H.goal)+'</p>' : '')
      + (steps ? '<ol>'+steps+'</ol>' : '')
      + (H.tip ? '<div class="tip">💡 '+esc(H.tip)+'</div>' : '')
      + '<button id="iowHelpClose" type="button">Got it!</button>'
      + '</div>';

    function open(){ ov.classList.add('on'); }
    function close(){ ov.classList.remove('on'); }
    btn.addEventListener('click', open);
    ov.addEventListener('click', function(e){ if(e.target === ov) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });

    document.body.appendChild(btn);
    document.body.appendChild(ov);
    ov.querySelector('#iowHelpClose').addEventListener('click', close);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
