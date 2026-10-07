/* In Order Words — global audio quality + reliability fix.
   Loaded early (in <head>) on every page that speaks or makes sounds.

   1) SPEECH: ranks the browser's installed voices and transparently upgrades
      every utterance to the best-sounding natural voice for its language.
      RELIABILITY: network voices (e.g. "Google UK English (network)") fail
      silently on school networks / offline. If one errors or never starts,
      the same text is retried automatically with a local voice, and the
      device remembers to prefer local voices from then on. If the device has
      no usable English voice at all, a small notice explains it.

   2) WEB AUDIO: remaps harsh square/sawtooth to triangle + gentle low-pass.
      RELIABILITY: every AudioContext is tracked and resumed on the first
      tap / click / key press (browsers keep audio suspended until then), and
      iOS is asked to play audio even with the silent switch on.
*/
(function(){
  "use strict";
  if(window.__IOW_AUDIO_FIX__) return; window.__IOW_AUDIO_FIX__ = true;

  /* ---------------- tiny helpers ---------------- */
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  var toastShown = {};
  function toast(key, msg){
    if(toastShown[key]) return; toastShown[key] = true;
    function show(){
      try{
        var d = document.createElement('div');
        d.setAttribute('role','status');
        d.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;'
          + 'max-width:min(92vw,520px);background:#1b2433;color:#fff;border:1px solid #4c6fff;border-radius:12px;'
          + 'padding:12px 16px;font:600 14px/1.4 system-ui,Segoe UI,Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.5);'
          + 'text-align:center;cursor:pointer';
        d.textContent = msg;
        d.onclick = function(){ if(d.parentNode) d.parentNode.removeChild(d); };
        document.body.appendChild(d);
        setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, 12000);
      }catch(e){}
    }
    if(document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  /* ---------------- 1) SPEECH VOICE UPGRADE ---------------- */
  if('speechSynthesis' in window && window.SpeechSynthesisUtterance){
    var ranked = { en: [], es: [] };
    var preferLocal = lsGet('iow_voice_local') === '1';
    function score(v){
      var n = (v.name || '').toLowerCase(); var s = 0;
      if(/natural|neural|online/.test(n)) s += 100;
      if(/google/.test(n)) s += 90;
      if(/siri/.test(n)) s += 85;
      if(/premium|enhanced|plus/.test(n)) s += 70;
      if(/samantha|alex|ava|nicky|evan|tom|zoe|daniel|kate|serena|stephanie|arthur|rocko|moira|karen|fiona|tessa|oliver|aaron|allison|emma|libby|sonia|ryan|jenny|aria|guy/.test(n)) s += 55;
      if(/microsoft/.test(n) && !/david|mark|zira|hazel|george/.test(n)) s += 35;
      if(v.localService === false) s += 15;
      if(/david|mark|hazel|george/.test(n)) s -= 40;
      if(/compact|eloquence/.test(n)) s -= 60;
      if(/espeak|festival|pico|robot/.test(n)) s -= 120;
      // this device already failed with a network voice: always prefer on-device ones
      if(preferLocal && v.localService === false) s -= 400;
      return s;
    }
    function keyFor(lang){ lang = (lang||'').toLowerCase(); return lang.indexOf('es') === 0 ? 'es' : 'en'; }
    function build(){
      var vs; try{ vs = speechSynthesis.getVoices() || []; }catch(e){ vs = []; }
      ['en','es'].forEach(function(k){
        var re = k === 'es' ? /^es/i : /^en/i;
        ranked[k] = vs.filter(function(v){ return re.test(v.lang || ''); })
                      .sort(function(a,b){ return score(b) - score(a); });
      });
    }
    build();
    try{ speechSynthesis.addEventListener('voiceschanged', build); }catch(e){}
    function best(lang){
      var k = keyFor(lang); var list = ranked[k] || [];
      if(!list.length) return null;
      if(k === 'en'){
        var region = (lang||'').toLowerCase().indexOf('en-us') === 0 ? /en[-_]?us/i : /en[-_]?gb/i;
        var rm = list.filter(function(v){ return region.test(v.lang || ''); });
        if(rm.length && score(rm[0]) >= 40) return rm[0];
      }
      return list[0];
    }
    function bestLocal(lang){
      var k = keyFor(lang);
      var list = (ranked[k] || []).filter(function(v){ return v.localService !== false; });
      return list.length ? list[0] : null;
    }
    window.IOWSpeech = { best: best, score: score, rebuild: build };

    var origSpeak = speechSynthesis.speak.bind(speechSynthesis);

    // Retry the same text with a local voice (or the browser default). Returns true if retried.
    function retryLocal(u){
      if(u.__iowRetried) return false;
      var lang = u.lang || (u.voice && u.voice.lang) || 'en-GB';
      var loc = bestLocal(lang);
      var wasNetwork = !!(u.voice && u.voice.localService === false);
      if(wasNetwork){ preferLocal = true; lsSet('iow_voice_local','1'); build(); }
      // nothing different to try (already a local voice, or no local voice exists and no voice was forced)
      if(!wasNetwork && !(loc && loc !== u.voice)) return false;
      var u2 = new SpeechSynthesisUtterance(u.text);
      u2.lang = lang; u2.rate = u.rate; u2.pitch = u.pitch; u2.volume = u.volume;
      if(loc) u2.voice = loc;                    // else: leave voice unset → browser default
      u2.onstart = u.onstart; u2.onend = u.onend; u2.onboundary = u.onboundary;
      u2.onpause = u.onpause; u2.onresume = u.onresume;
      u2.__iowRetried = true; u2.__iowFinal = true;
      watch(u2, function(){ giveUp(u2); });
      u2.addEventListener('error', function(e){
        if(e && (e.error === 'canceled' || e.error === 'interrupted')) return;
        if(typeof u.onerror === 'function'){ try{ u.onerror(e); }catch(_){} }
        giveUp(u2);
      });
      setTimeout(function(){ try{ origSpeak(u2); }catch(e){} }, 60);   // no cancel(): never kill the rest of the queue
      return true;
    }
    function giveUp(u){
      var lang = u.lang || 'en-GB';
      var noVoices = !(ranked[keyFor(lang)] || []).length;
      toast('speech',
        noVoices
          ? '🔇 This device has no English voice installed. Try Chrome or Edge, or add an English voice in your system language settings.'
          : '🔇 The voice could not play. Check your volume and internet connection, then tap the sound again.');
    }

    // Watchdog: if the utterance never starts (and nothing else is speaking), treat as failure.
    function watch(u, onFail){
      var started = false, tries = 0, timer = null, keep = null;
      function stop(){ clearTimeout(timer); clearInterval(keep); }
      function check(){
        if(started) return;
        var busy = false; try{ busy = speechSynthesis.speaking; }catch(e){}
        if(busy && tries < 12){ tries++; timer = setTimeout(check, 5000); return; } // still queued behind earlier sentences: never judge it as failed
        onFail();
      }
      u.addEventListener('start', function(){
        started = true; clearTimeout(timer);
        // Chrome stalls long network-voice speech after ~15s; a pause/resume nudge keeps it going
        if(u.voice && u.voice.localService === false){
          keep = setInterval(function(){
            try{ if(speechSynthesis.speaking && !speechSynthesis.paused){ speechSynthesis.pause(); speechSynthesis.resume(); } }catch(e){}
          }, 10000);
        }
      });
      u.addEventListener('end', stop);
      u.addEventListener('error', stop);
      timer = setTimeout(check, 4000);
    }

    speechSynthesis.speak = function(u){
      try{
        if(u && window.SpeechSynthesisUtterance && u instanceof SpeechSynthesisUtterance && !u.__iowFinal){
          var cur = u.voice;
          var b = best(u.lang || (cur && cur.lang) || 'en-GB');
          // upgrade whenever a clearly better (more natural) voice is available
          if(b && (!cur || score(cur) < score(b) - 20)){
            u.voice = b; if(!u.lang) u.lang = b.lang;
          }
          // gentle, natural clamps (keep intentional A/B pitch differences)
          if(typeof u.rate === 'number'){ if(u.rate > 1.05) u.rate = 1.0; if(u.rate < 0.7) u.rate = 0.8; }
          if(typeof u.pitch === 'number'){ if(u.pitch > 1.35) u.pitch = 1.1; if(u.pitch < 0.72) u.pitch = 0.82; }
          // reliability: retry with a local voice on error or if it never starts
          var failed = false;
          function fail(){ if(failed) return; failed = true; if(!retryLocal(u)) giveUp(u); }
          watch(u, fail);
          u.addEventListener('error', function(e){
            if(e && (e.error === 'canceled' || e.error === 'interrupted')) return;
            fail();
          });
        }
      }catch(e){}
      return origSpeak(u);
    };
  }

  /* ---------------- 2) WEB AUDIO SOFTENING ---------------- */
  try{
    // 2a) remap harsh oscillator waveforms (square/sawtooth) to a softer triangle
    var OP = window.OscillatorNode && OscillatorNode.prototype;
    if(OP){
      var d = Object.getOwnPropertyDescriptor(OP, 'type');
      if(d && d.set && d.get && !OP.__iowType){
        OP.__iowType = true;
        Object.defineProperty(OP, 'type', {
          configurable: true, enumerable: d.enumerable,
          get: function(){ return d.get.call(this); },
          set: function(val){
            if(val === 'square' || val === 'sawtooth') val = 'triangle';
            try{ d.set.call(this, val); }catch(e){}
          }
        });
      }
    }
    // 2b) route every context's output through one gentle low-pass (warms the sound)
    var AN = window.AudioNode && AudioNode.prototype;
    if(AN && AN.connect && !AN.__iowConnect){
      var origConnect = AN.connect;
      AN.__iowConnect = true;
      AN.connect = function(dest){
        try{
          if(dest && dest.context && dest.context.destination === dest && dest.context.createBiquadFilter){
            var ctx = dest.context;
            if(!ctx.__iowSoft){
              var lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
              lp.frequency.value = 4600; lp.Q.value = 0.25;
              var hp = ctx.createBiquadFilter(); hp.type = 'highshelf';
              hp.frequency.value = 3800; hp.gain.value = -6; // tame shrill highs
              lp.connect(hp); origConnect.call(hp, ctx.destination);
              ctx.__iowSoft = lp;
            }
            return origConnect.call(this, ctx.__iowSoft);
          }
        }catch(e){}
        return origConnect.apply(this, arguments);
      };
    }
  }catch(e){}

  /* ---------------- 3) AUDIO UNLOCK (autoplay policy + iOS silent switch) ---------------- */
  try{
    // iOS 16.4+/Safari: play audio even when the ring/silent switch is on
    try{ if(navigator.audioSession) navigator.audioSession.type = 'playback'; }catch(e){}

    var ctxs = [];
    var Orig = window.AudioContext || window.webkitAudioContext;
    if(Orig && !Orig.__iowWrapped){
      var Wrapped = function(opts){
        var c = opts === undefined ? new Orig() : new Orig(opts);
        ctxs.push(c); return c;           // returning an object from `new` yields that object
      };
      Wrapped.prototype = Orig.prototype; Wrapped.__iowWrapped = true;
      window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped;
    }
    var unlocked = false;
    function unlock(){
      ctxs.forEach(function(c){
        try{
          if(c.state === 'suspended' || c.state === 'interrupted'){ c.resume(); }
          if(!c.__iowPinged){                // silent 1-sample buffer: fully unlocks iOS
            c.__iowPinged = true;
            var b = c.createBuffer(1,1,22050), s = c.createBufferSource();
            s.buffer = b; s.connect(c.destination); s.start(0);
          }
        }catch(e){}
      });
      // wake the speech engine too (some mobile browsers need a gesture-time touch)
      if(!unlocked && 'speechSynthesis' in window){
        try{ speechSynthesis.getVoices(); if(speechSynthesis.paused) speechSynthesis.resume(); }catch(e){}
      }
      unlocked = true;
    }
    ['pointerdown','touchstart','touchend','mousedown','click','keydown'].forEach(function(ev){
      window.addEventListener(ev, unlock, {capture:true, passive:true});
    });
    // coming back to the tab (or a call/other app releasing audio) can leave contexts suspended
    document.addEventListener('visibilitychange', function(){ if(!document.hidden) unlock(); });
  }catch(e){}
})();
