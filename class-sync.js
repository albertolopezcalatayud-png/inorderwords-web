/* Inorderwords — shared class ranking (one board per game and grade).
   Scores go to the school's Google Sheets backend filed under "<Game> · <Grade>",
   e.g. "Verb Striker · 3º ESO", so every game keeps its own separate ranking. */
(function(){
  var BACKEND = 'https://script.google.com/macros/s/AKfycbxE10u2B5PrXLWXkYAZ31h_ZDVlVmPOmqzaDmGPmhZ2UBFg_-DhGFEYktwIa0o5ixB5/exec';
  var GRADES = ['1º ESO','2º ESO','3º ESO','4º ESO','1º Bach','2º Bach'];

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
    '.iow-id b{color:#f4f2ec;}.iow-id button{background:none;border:1px solid rgba(255,255,255,0.18);color:#ffcc66;border-radius:99px;padding:4px 10px;font:700 12px Manrope,system-ui,sans-serif;cursor:pointer;}';
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

  /* ---------- scores ---------- */
  // opts: {name, grade} to override the stored identity (arcade games ask for them every run), plus any extra fields
  function postScore(game, xp, opts){
    opts = opts || {};
    var id = getIdentity();
    var name = cleanName(opts.name || id.name), grade = opts.grade || id.grade;
    xp = Math.round(Number(xp) || 0);
    if(xp <= 0) return Promise.resolve({ok:false, reason:'zero'});
    if(!name || GRADES.indexOf(grade) === -1 || (window.__iowSkip && !opts.name)){
      toast('ℹ️ Score not sent to the class ranking — add your name and grade next time.', 'warn');
      return Promise.resolve({ok:false, reason:'noid'});
    }
    var params = {action:'score', student:name, course:boardName(game, grade), xp:xp, game:game};
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
    fillBoard:fillBoard, prefill:prefill, toast:toast, boardName:boardName, jsonp:jsonp, cleanName:cleanName
  };
})();
