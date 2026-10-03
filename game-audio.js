/* Reusable background music + sound effects for In Order Words games.
   - Adds a small music on/off button (bottom-left, above "How to play").
   - Background loop is OFF by default; the choice is remembered per device.
   - Everything is synthesised with the Web Audio API (no audio files).
   - Exposes window.IOWAudio = { win(), correct(), wrong(), toggle() } so
     games can play a reward jingle, e.g. IOWAudio.win() when you ace a round.
*/
(function(){
  var AC = window.AudioContext || window.webkitAudioContext;
  if(!AC){ window.IOWAudio = {win:function(){},correct:function(){},wrong:function(){},toggle:function(){}}; return; }

  var ctx = null, musicOn = false, loopTimer = null, master = null, musicGain = null;
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } }

  function ensure(){
    if(ctx) { if(ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
  }

  function note(freq, start, dur, type, gainVal, dest){
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gainVal||0.2, start+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start+dur);
    o.connect(g); g.connect(dest || master);
    o.start(start); o.stop(start+dur+0.05);
  }

  // ---- background loop: a gentle 8-step arpeggio in C major-ish ----
  var SCALE = {C4:261.63,D4:293.66,E4:329.63,G4:392.00,A4:440.00,C5:523.25,E5:659.25,G5:783.99};
  var MELODY = ['C4','E4','G4','C5','A4','G4','E4','D4'];
  var BASS   = ['C4','C4','G4','G4','A4','A4','G4','G4'];
  function scheduleBar(){
    if(!musicOn || !ctx) return;
    var t0 = ctx.currentTime + 0.05, step = 0.28;
    for(var i=0;i<MELODY.length;i++){
      note(SCALE[MELODY[i]], t0+i*step, step*0.9, 'triangle', 0.16, musicGain);
      if(i%2===0) note(SCALE[BASS[i]]/2, t0+i*step, step*1.6, 'sine', 0.18, musicGain);
    }
    loopTimer = setTimeout(scheduleBar, MELODY.length*step*1000);
  }

  function startMusic(){
    ensure(); musicOn = true;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime+0.4);
    scheduleBar();
  }
  function stopMusic(){
    musicOn = false;
    if(loopTimer){ clearTimeout(loopTimer); loopTimer = null; }
    if(musicGain && ctx) musicGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime+0.3);
  }

  // ---- sound effects ----
  function arp(freqs, dur, type){
    ensure(); var t = ctx.currentTime + 0.02;
    for(var i=0;i<freqs.length;i++) note(freqs[i], t+i*dur, dur*1.8, type||'square', 0.22, master);
  }
  var SFX = {
    win:   function(){ arp([523.25,659.25,783.99,1046.50], 0.11, 'square'); },
    correct: function(){ arp([659.25,988.00], 0.08, 'triangle'); },
    wrong: function(){ ensure(); var t=ctx.currentTime+0.02; note(196.00,t,0.18,'sawtooth',0.18,master); note(155.56,t+0.12,0.22,'sawtooth',0.18,master); }
  };

  // ---- UI button ----
  function mountBtn(){
    if(document.getElementById('iowMusicBtn')) return;
    var css = document.createElement('style');
    css.textContent =
      '#iowMusicBtn{position:fixed;left:12px;bottom:58px;z-index:2147483000;width:42px;height:42px;border-radius:50%;'
      +'display:flex;align-items:center;justify-content:center;font-size:19px;cursor:pointer;'
      +'background:rgba(15,20,40,.92);color:#fff;border:1px solid rgba(255,255,255,.28);'
      +'box-shadow:0 6px 18px rgba(0,0,0,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}'
      +'#iowMusicBtn:hover{border-color:#4da6ff;}';
    document.head.appendChild(css);
    var btn = document.createElement('button');
    btn.id = 'iowMusicBtn'; btn.type = 'button';
    function paint(){ btn.textContent = musicOn ? '🔊' : '🔇'; btn.title = musicOn ? 'Music on (tap to mute)' : 'Music off (tap to play)'; }
    paint();
    btn.addEventListener('click', function(){ if(musicOn){ stopMusic(); ls('iow_music','0'); } else { startMusic(); ls('iow_music','1'); } paint(); });
    document.body.appendChild(btn);
    // resume on first interaction if the user had it on
    if(ls('iow_music') === '1'){
      var kick = function(){ startMusic(); paint(); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
      window.addEventListener('pointerdown', kick); window.addEventListener('keydown', kick);
    }
  }

  window.IOWAudio = {
    win: function(){ SFX.win(); }, correct: function(){ SFX.correct(); }, wrong: function(){ SFX.wrong(); },
    toggle: function(){ if(musicOn){ stopMusic(); ls('iow_music','0'); } else { startMusic(); ls('iow_music','1'); } }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBtn);
  else mountBtn();
})();
