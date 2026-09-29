/* Inorderwords — shared class ranking (one board per game and grade).
   Scores go to the school's Google Sheets backend filed under "<Game> · <Grade>",
   e.g. "Verb Striker · 3º ESO", so every game keeps its own separate ranking. */
(function(){
  var BACKEND = 'https://script.google.com/macros/s/AKfycbxE10u2B5PrXLWXkYAZ31h_ZDVlVmPOmqzaDmGPmhZ2UBFg_-DhGFEYktwIa0o5ixB5/exec';
  var GRADES = ['1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach'];

  /* ---- class code: scores only count for players who know the teacher's code ----
     CODE_ON=false disables the gate. To change the code, replace CODE_HASH with the
     hash of the new code (ask Claude, or run hashCode() in the console). */
  var CODE_ON = true;
  var CODE_HASH = '2t36ti';           // hash of the current class code
  function hashCode(x){ x = String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); var h = 5381; for(var i = 0; i < x.length; i++){ h = ((h << 5) + h) ^ x.charCodeAt(i); } return (h >>> 0).toString(36); }
  function codeOk(x){ return !CODE_ON || hashCode(x) === CODE_HASH; }
  function savedCode(){ return (window.IOW_ACCESS_CODE || ls('iow_class_code') || ''); }
  function hasCode(){ return codeOk(savedCode()); }

  function ls(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function cleanName(n){ return String(n || '').replace(/\s+/g, ' ').trim().slice(0, 40).toUpperCase(); }
  function boardName(game, grade){ return game + ' · ' + grade; }

  function getIdentity(){
    var name = ls('iow_student_name') || ls('iow_vocabrush_name') || '';
    var grade = ls('iow_student_course') || '';
    try{ var p = JSON.parse(ls('missionLogPilot') || '{}'); if(!name) name = p.name || ''; if(!grade) grade = p.course || ''; }catch(e){}
    return { name: cleanName(name), grade: GRADES.indexOf(grade) > -1 ? grade : '' };
  }
  function setIdentity(name, grade){
    name = cleanName(name);
    if(name){ lsSet('iow_student_name', name); lsSet('iow_vocabrush_name', name); }
    if(GRADES.indexOf(grade) > -1) lsSet('iow_student_course', grade);
    try{
      var p = JSON.parse(ls('missionLogPilot') || '{}');
      if(name) p.name = name;
      if(GRADES.indexOf(grade) > -1) p.course = grade;
      lsSet('missionLogPilot', JSON.stringify(p));
    }catch(e){}
    document.querySelectorAll('[data-iow-identity]').forEach(renderIdentity);
  }

  function jsonp(params, timeoutMs){
    return new Promise(function(resolve){
      var cb = '__iow' + Date.now() + '_' + Math.floor(Math.random() * 1e6), done = false;
      var s = document.createElement('script');
      function finish(v){ if(done) return; done = true; try{ delete window[cb]; }catch(e){ window[cb] = undefined; } if(s.parentNode) s.parentNode.removeChild(s); resolve(v); }
      window[cb] = function(d){ finish(d); };
      s.onerror = function(){ finish(null); };
      var q = new URLSearchParams(params); q.set('callback', cb);
      s.src = BACKEND + '?' + q.toString();
      setTimeout(function(){ finish(null); }, timeoutMs || 8000);
      document.head.appendChild(s);
    });
  }

  /* ---------- toast ---------- */
  var css = '' +
    '.iow-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%) translateY(20px);z-index:100000;max-width:min(92vw,520px);background:#12172c;color:#f4f2ec;border:1px solid rgba(255,255,255,0.18);border-radius:14px;padding:12px 16px;font:600 14px/1.45 Manrope,system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,0.5);opacity:0;transition:opacity .25s ease,transform .25s ease;pointer-events:none;text-align:center;}' +
    '.iow-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}' +
    '.iow-toast.ok{border-color:rgba(45,212,191,0.6);}.iow-toast.warn{border-color:rgba(255,183,3,0.6);}' +
    '.iow-modal-bg{position:fixed;inset:0;z-index:100001;background:rgba(5,6,18,0.82);display:flex;align-items:center;justify-content:center;padding:16px;}' +
    '.iow-modal{width:min(420px,100%);background:#12172c;color:#f4f2ec;border:1px solid rgba(255,255,255,0.14);border-radius:18px;padding:22px 20px;font:500 14px/1.5 Manrope,system-ui,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,0.6);}' +
    '.iow-modal h3{font:800 18px/1.3 Unbounded,Manrope,system-ui,sans-serif;margin:0 0 6px;}' +
    '.iow-modal p{color:#9aa1ba;font-size:13px;margin:0 0 14px;}' +
    '.iow-modal label{display:block;font:700 11px/1 "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#9aa1ba;margin:10px 0 6px;}' +
    '.iow-modal input,.iow-modal select{width:100%;box-sizing:border-box;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.14);color:#f4f2ec;border-radius:10px;padding:11px 12px;font:600 15px Manrope,system-ui,sans-serif;}' +
    '.iow-modal input:focus,.iow-modal select:focus{outline:none;border-color:#ffcc66;}' +
    '.iow-modal .row{display:flex;gap:10px;margin-top:16px;}' +
    '.iow-modal button{flex:1;border:none;border-radius:11px;padding:12px;font:800 14px Manrope,system-ui,sans-serif;cursor:pointer;}' +
    '.iow-modal .go{background:#ffcc66;color:#1a1300;}.iow-modal .skip{background:rgba(255,255,255,0.07);color:#f4f2ec;border:1px solid rgba(255,255,255,0.14);}' +
    '.iow-modal .err{color:#ff8fa3;font-size:12.5px;min-height:18px;margin-top:8px;}' +
    '.iow-id{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font:600 13px/1.4 Manrope,system-ui,sans-serif;color:#9aa1ba;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:9px 12px;margin:0 0 16px;}' +
    '.iow-id b{color:#f4f2ec;}.iow-id button{background:none;border:1px solid rgba(255,255,255,0.18);color:#ffcc66;border-radius:99px;padding:4px 10px;font:700 12px Manrope,system-ui,sans-serif;cursor:pointer;}' +
    '.iow-cbanner{position:fixed;inset:0;z-index:100005;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(4,5,16,0.86);backdrop-filter:blur(3px);opacity:0;transition:opacity .2s ease;}' +
    '.iow-cbanner.show{opacity:1;}' +
    '.iow-cbanner-card{width:min(540px,100%);box-sizing:border-box;text-align:center;background:linear-gradient(160deg,#1c2650,#11162b);color:#f4f2ec;border:3px solid #ffcc66;border-radius:26px;padding:38px 30px 32px;box-shadow:0 26px 70px rgba(0,0,0,0.65),0 0 0 6px rgba(255,204,102,0.12);font-family:Manrope,system-ui,sans-serif;transform:scale(0.9);transition:transform .22s cubic-bezier(.2,1.2,.35,1);}' +
    '.iow-cbanner.show .iow-cbanner-card{transform:scale(1);}' +
    '.iow-cbanner .cb-key{font-size:72px;line-height:1;margin-bottom:8px;}' +
    '.iow-cbanner h2{font:800 30px/1.15 Unbounded,Manrope,system-ui,sans-serif;margin:0 0 12px;color:#ffcc66;text-wrap:balance;}' +
    '.iow-cbanner .cb-sub{display:block;color:#cfd4e6;font-size:16.5px;line-height:1.5;margin:0 auto 26px;max-width:400px;}' +
    '.iow-cbanner .cb-btns{display:flex;gap:14px;}' +
    '.iow-cbanner button{flex:1;border:none;border-radius:16px;padding:18px 10px;font:800 19px Manrope,system-ui,sans-serif;cursor:pointer;transition:transform .1s ease;}' +
    '.iow-cbanner button:active{transform:scale(0.97);}' +
    '.iow-cbanner .yes{background:#ffcc66;color:#1a1300;box-shadow:0 8px 20px rgba(255,204,102,0.35);}' +
    '.iow-cbanner .no{background:rgba(255,255,255,0.1);color:#f4f2ec;border:2px solid rgba(255,255,255,0.22);}' +
    '@media (max-width:420px){.iow-cbanner .cb-key{font-size:60px;}.iow-cbanner h2{font-size:25px;}.iow-cbanner .cb-sub{font-size:15px;}.iow-cbanner button{font-size:18px;padding:16px 8px;}}' +
    '@media (prefers-reduced-motion:reduce){.iow-cbanner,.iow-cbanner-card{transition:none;}}' +
    '.iow-cchip{position:fixed;left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top,0px));z-index:100004;background:linear-gradient(135deg,#1a2346,#12172c);color:#f4f2ec;border:2px solid rgba(255,204,102,0.6);border-radius:99px;padding:11px 18px;font:800 14.5px Manrope,system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,0.5);}' +
    '.iow-cchip b{color:#ffcc66;}';
  function injectCss(){ if(document.getElementById('iow-css')) return; var st = document.createElement('style'); st.id = 'iow-css'; st.textContent = css; document.head.appendChild(st); }

  var toastTimer = null;
  function toast(msg, kind){
    injectCss();
    var t = document.getElementById('iow-toast');
    if(!t){ t = document.createElement('div'); t.id = 'iow-toast'; t.className = 'iow-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.className = 'iow-toast show ' + (kind || '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.className = 'iow-toast ' + (kind || ''); }, 4200);
  }

  /* ---------- identity modal ---------- */
  function openModal(cb, allowSkip){
    injectCss();
    var id = getIdentity();
    var bg = document.createElement('div'); bg.className = 'iow-modal-bg';
    bg.innerHTML = '<div class="iow-modal" role="dialog" aria-modal="true" aria-labelledby="iowT">' +
      '<h3 id="iowT">Who\'s playing?</h3>' +
      '<p>Your score goes to your class ranking for this game. Write your full name the same way every time.</p>' +
      '<label for="iowName">Name and surname</label><input id="iowName" type="text" autocomplete="off" maxlength="40" placeholder="e.g. Lucía García">' +
      '<label for="iowGrade">Grade</label><select id="iowGrade"><option value="">Choose your grade…</option>' +
      GRADES.map(function(g){ return '<option>' + g + '</option>'; }).join('') + '</select>' +
      '<div class="err" id="iowErr"></div>' +
      '<div class="row">' + (allowSkip ? '<button type="button" class="skip" id="iowSkip">Play without saving</button>' : '') +
      '<button type="button" class="go" id="iowGo">Let\'s go</button></div></div>';
    document.body.appendChild(bg);
    var nameEl = bg.querySelector('#iowName'), gradeEl = bg.querySelector('#iowGrade');
    nameEl.value = id.name ? id.name : ''; gradeEl.value = id.grade;
    nameEl.focus();
    function close(){ if(bg.parentNode) bg.parentNode.removeChild(bg); }
    bg.querySelector('#iowGo').addEventListener('click', function(){
      var n = cleanName(nameEl.value), g = gradeEl.value;
      if(n.length < 2){ bg.querySelector('#iowErr').textContent = 'Write your name so your teacher can find you.'; nameEl.focus(); return; }
      if(!g){ bg.querySelector('#iowErr').textContent = 'Choose your grade.'; gradeEl.focus(); return; }
      setIdentity(n, g); close(); if(cb) cb(getIdentity());
    });
    nameEl.addEventListener('keydown', function(e){ if(e.key === 'Enter') bg.querySelector('#iowGo').click(); });
    var skip = bg.querySelector('#iowSkip');
    if(skip) skip.addEventListener('click', function(){ close(); window.__iowSkip = true; if(cb) cb(null); });
  }

  function needsCode(){ return CODE_ON && !hasCode(); }
  function promptCode(cb){
    if(!needsCode()){ if(cb) cb(true); return; }
    injectCss();
    var bg = document.createElement('div'); bg.className = 'iow-modal-bg';
    bg.innerHTML = '<div class="iow-modal" role="dialog" aria-modal="true" aria-labelledby="iowCT">' +
      '<h3 id="iowCT">Class code</h3>' +
      '<p>Ask your teacher for the class code so your scores count in the ranking.</p>' +
      '<label for="iowCodeOnly">Class code</label><input id="iowCodeOnly" type="text" autocomplete="off" maxlength="24" placeholder="e.g. ABCD00">' +
      '<div class="err" id="iowCErr"></div>' +
      '<div class="row"><button type="button" class="skip" id="iowCSkip">Play without saving</button>' +
      '<button type="button" class="go" id="iowCGo">Save code</button></div></div>';
    document.body.appendChild(bg);
    var codeEl = bg.querySelector('#iowCodeOnly'); codeEl.value = savedCode(); codeEl.focus();
    function close(){ if(bg.parentNode) bg.parentNode.removeChild(bg); }
    bg.querySelector('#iowCGo').addEventListener('click', function(){
      var v = codeEl.value.trim();
      if(!codeOk(v)){ bg.querySelector('#iowCErr').textContent = v ? 'That class code isn\'t right. Ask your teacher.' : 'Enter your class code.'; codeEl.focus(); return; }
      lsSet('iow_class_code', v); close(); if(cb) cb(true);
    });
    codeEl.addEventListener('keydown', function(e){ if(e.key === 'Enter') bg.querySelector('#iowCGo').click(); });
    bg.querySelector('#iowCSkip').addEventListener('click', function(){ close(); window.__iowSkip = true; if(cb) cb(false); });
  }

  function ensureIdentity(cb){
    var id = getIdentity();
    if(id.name && id.grade){ cb(id); return; }
    openModal(cb, true);
  }

  function renderIdentity(el){
    injectCss();
    var id = getIdentity();
    el.className = 'iow-id';
    el.innerHTML = id.name && id.grade
      ? '👤 Playing as <b>' + esc(id.name) + '</b> · ' + esc(id.grade) + ' <button type="button">Not you? Change</button>'
      : '🏫 Add your name and grade so your score reaches your class ranking. <button type="button">Set up</button>';
    el.querySelector('button').onclick = function(){ window.__iowSkip = false; openModal(null, false); };
  }
  function mountIdentity(el){ if(!el) return; el.setAttribute('data-iow-identity', ''); renderIdentity(el); }

  /* ---------- "Got a code?" banner (shown when a scoring game opens) ---------- */
  var CHOICE_KEY = 'iow_code_choice';   // 'no' = chose to play without saving this session
  function removeBanner(){ var b = document.getElementById('iow-cbanner'); if(b && b.parentNode) b.parentNode.removeChild(b); }
  function showChip(){
    if(document.getElementById('iow-cchip')) return;
    injectCss();
    var c = document.createElement('button'); c.id = 'iow-cchip'; c.className = 'iow-cchip'; c.type = 'button';
    c.innerHTML = '🔑 <b>Enter class code to score</b>';
    c.setAttribute('aria-label', 'Enter class code to score');
    c.addEventListener('click', function(){ promptCode(function(ok){ if(ok){ if(c.parentNode) c.parentNode.removeChild(c); window.__iowSkip = false; try{ sessionStorage.removeItem(CHOICE_KEY); }catch(e){} toast('✅ Code OK — your scores now count.', 'ok'); } }); });
    document.body.appendChild(c);
  }
  function codeBanner(){
    if(!CODE_ON) return;
    injectCss();
    if(hasCode()) return;                                  // already has a valid code: nothing to ask
    var chose = ''; try{ chose = sessionStorage.getItem(CHOICE_KEY) || ''; }catch(e){}
    if(chose === 'no'){ window.__iowSkip = true; showChip(); return; }   // already said no this session
    removeBanner();
    var b = document.createElement('div'); b.id = 'iow-cbanner'; b.className = 'iow-cbanner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true'); b.setAttribute('aria-label', 'Class code');
    b.innerHTML = '<div class="iow-cbanner-card">' +
      '<div class="cb-key" aria-hidden="true">🔑</div>' +
      '<h2>Got a class code?</h2>' +
      '<span class="cb-sub">Enter it so your scores count on your class ranking. No code? You can still play — you just won\'t appear in the ranking.</span>' +
      '<div class="cb-btns"><button type="button" class="yes">Yes, I have a code</button><button type="button" class="no">No, just play</button></div>' +
      '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function(){ b.classList.add('show'); });
    b.querySelector('.yes').addEventListener('click', function(){
      removeBanner();   // take the full-screen banner away so the code box is on top
      promptCode(function(ok){
        if(ok){ window.__iowSkip = false; try{ sessionStorage.removeItem(CHOICE_KEY); }catch(e){} toast('✅ Code OK — your scores now count.', 'ok'); }
        else { window.__iowSkip = true; showChip(); }   // cancelled → play without scoring, keep a way back
      });
    });
    b.querySelector('.no').addEventListener('click', function(){
      window.__iowSkip = true; try{ sessionStorage.setItem(CHOICE_KEY, 'no'); }catch(e){}
      removeBanner(); showChip();
    });
  }
  function autoBanner(){
    var page = (location.pathname.split('/').pop() || '').toLowerCase();
    var SCORING = ['verb-striker.html','phrasal-command.html','preposition-blaster.html','collocation-match.html','question-control.html','docking-sequence.html','idiom-detective.html','debug-transmission.html','missing-signal.html','boss-checkpoint.html','vocab-rush.html'];
    /* access now handled by the full-screen access gate embedded in each page */ if(false && SCORING.indexOf(page) > -1) codeBanner();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoBanner); else autoBanner();

  /* ---------- scores ---------- */
  // opts: {name, grade} to override the stored identity (arcade games ask for them every run), plus any extra fields
  function postScore(game, xp, opts){
    opts = opts || {};
    var id = getIdentity();
    var name = cleanName(opts.name || id.name), grade = opts.grade || id.grade;
    xp = Math.round(Number(xp) || 0);
    if(xp <= 0) return Promise.resolve({ok:false, reason:'zero'});
    if(CODE_ON && !hasCode()){
      // no valid class code → play without scoring (banner/chip lets them add one)
      if(window.__iowSkip) showChip();
      return Promise.resolve({ok:false, reason:'nocode'});
    }
    if(!name || GRADES.indexOf(grade) === -1 || (window.__iowSkip && !opts.name)){
      toast('ℹ️ Score not sent to the class ranking — add your name and grade next time.', 'warn');
      return Promise.resolve({ok:false, reason:'noid'});
    }
    var params = {action:'score', student:name, course:boardName(game, grade), xp:xp, game:game};
    if(CODE_ON) params.code = savedCode();
    Object.keys(opts).forEach(function(k){ if(k !== 'name' && k !== 'grade' && opts[k] !== undefined && opts[k] !== null) params[k] = opts[k]; });
    toast('📡 Sending to the class ranking…');
    return jsonp(params, 9000).then(function(r){
      if(r && r.ok){ toast('✅ +' + xp + ' XP · ' + name + ' · ' + game + ' · ' + grade, 'ok'); return {ok:true, xp:xp}; }
      toast('⚠️ Couldn\'t reach the class ranking. Your score is still saved on this device.', 'warn');
      return {ok:false, reason:'offline'};
    });
  }

  function leaderboard(game, grade){
    return jsonp({action:'leaderboard', course:boardName(game, grade)}, 9000).then(function(d){
      if(!d || !d.ok || !Array.isArray(d.leaderboard)) return null;
      return d.leaderboard.filter(function(r){ return r && r.student && (r.xp || 0) > 0; })
        .map(function(r){ return {student:r.student, xp:r.xp || 0, grade:grade}; })
        .sort(function(a, b){ return b.xp - a.xp; });
    });
  }
  // grade = one grade, or null / 'TODOS' for every grade (one ranking per grade, shown together)
  function leaderboardAll(game, grade){
    if(grade && grade !== 'TODOS') return leaderboard(game, grade);
    return Promise.all(GRADES.map(function(g){ return leaderboard(game, g); })).then(function(parts){
      if(parts.every(function(p){ return p === null; })) return null;
      var rows = []; parts.forEach(function(p){ if(p) rows = rows.concat(p); });
      return rows.sort(function(a, b){ return b.xp - a.xp; });
    });
  }

  // Replace a game's Hall of Fame list with its class ranking (keeps the local list if the backend can't be reached)
  var fillToken = 0;
  function fillBoard(listEl, game, grade, me){
    if(!listEl) return;
    var token = ++fillToken;
    leaderboardAll(game, grade).then(function(rows){
      if(token !== fillToken || rows === null) return;
      var meName = cleanName(me || getIdentity().name);
      var all = !grade || grade === 'TODOS';
      if(rows.length === 0){
        listEl.innerHTML = '<li class="ranking-item"><span>🏫 No class scores yet for ' + esc(all ? game : game + ' · ' + grade) + ' — be the first!</span></li>';
        return;
      }
      listEl.innerHTML = rows.slice(0, 50).map(function(r, i){
        var mine = meName && r.student.toUpperCase() === meName;
        return '<li class="ranking-item' + (mine ? ' me' : '') + '"><span>' + (i + 1) + '. ' + esc(r.student) + (all ? ' (' + esc(r.grade) + ')' : '') + '</span><strong>' + r.xp + ' XP</strong></li>';
      }).join('');
    });
  }

  function prefill(nameId, gradeId){
    var id = getIdentity();
    var n = document.getElementById(nameId), g = document.getElementById(gradeId);
    if(n && !n.value && id.name) n.value = id.name;
    if(g && id.grade && Array.prototype.some.call(g.options, function(o){ return o.value === id.grade; })) g.value = id.grade;
  }

  window.IOW = {
    GRADES:GRADES, getIdentity:getIdentity, setIdentity:setIdentity, ensureIdentity:ensureIdentity,
    mountIdentity:mountIdentity, postScore:postScore, leaderboard:leaderboard, leaderboardAll:leaderboardAll,
    fillBoard:fillBoard, prefill:prefill, toast:toast, boardName:boardName, jsonp:jsonp, cleanName:cleanName, needsCode:needsCode, promptCode:promptCode, hasCode:hasCode, codeBanner:codeBanner, code:savedCode
  };
})();
