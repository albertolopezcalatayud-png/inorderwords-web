/* In Order Words — global audio quality fix.
   Loaded early (in <head>) on every page that speaks or makes sounds.

   1) SPEECH: ranks the browser's installed voices and transparently upgrades
      every utterance to the best-sounding natural voice for its language, so
      no page is left on a robotic/metallic eSpeak/compact voice. It only
      upgrades when the page hasn't already chosen a good voice, and never
      flattens intentional pitch shifts (two-speaker dialogues keep working).

   2) WEB AUDIO: the games synthesise all SFX/music with oscillators; square
      and sawtooth waves sound harsh/metallic. This remaps those to a softer
      triangle wave and routes every context's output through a gentle
      low-pass filter, removing the shrill/metallic edge everywhere at once.
*/
(function(){
  "use strict";
  if(window.__IOW_AUDIO_FIX__) return; window.__IOW_AUDIO_FIX__ = true;

  /* ---------------- 1) SPEECH VOICE UPGRADE ---------------- */
  if('speechSynthesis' in window && window.SpeechSynthesisUtterance){
    var ranked = { en: [], es: [] };
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
    window.IOWSpeech = { best: best, score: score, rebuild: build };
    var origSpeak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function(u){
      try{
        if(u && window.SpeechSynthesisUtterance && u instanceof SpeechSynthesisUtterance){
          var cur = u.voice;
          if(!cur || score(cur) < 45){
            var b = best(u.lang || (cur && cur.lang) || 'en-GB');
            if(b){ u.voice = b; if(!u.lang) u.lang = b.lang; }
          }
          // gentle, natural clamps (keep intentional A/B pitch differences)
          if(typeof u.rate === 'number'){ if(u.rate > 1.05) u.rate = 1.0; if(u.rate < 0.7) u.rate = 0.8; }
          if(typeof u.pitch === 'number'){ if(u.pitch > 1.35) u.pitch = 1.1; if(u.pitch < 0.72) u.pitch = 0.82; }
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
})();
