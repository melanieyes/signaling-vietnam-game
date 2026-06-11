/*
  sound.js — tiny self-contained audio layer for the explorable.

  Wires the existing Nicky-Case sound pack in assets/sounds/ to the game's
  interactions, with a DIFFERENT sound for each kind of action so the piece
  feels alive instead of repetitive.

  Design:
    - One looping background track (bg_music), started on the first user
      gesture (browsers block autoplay before that).
    - Short SFX cloned per play() so overlapping clicks don't cut each other.
    - The #sound on/off toggle mutes everything and pauses the music.
    - SFX are chosen three ways:
        1. slideshow transitions  → page-turn whoosh / scratch
        2. game outcomes (reveal) → reward / backfire stings, via pub/sub
        3. button presses         → a delegated click map, varied by control

  Public API:
    Sound.play(name, {volume, rate})   — fire a one-shot effect
    Sound.setEnabled(bool)             — mute / unmute + music
    Sound.init()                       — boot (called from main.js)
*/

window.Sound = (function(){

  var DIR = "assets/sounds/";
  var NAMES = [
    "bg_music", "bonk", "button1", "button2", "button3",
    "coin_get", "coin_insert", "drumroll", "evil_laugh", "fart",
    "machine_start", "scratch_in", "scratch_out", "squeak", "thump", "whoosh"
  ];

  var bases = {};        // name -> base Audio element (cloned on play)
  var enabled = true;    // mirrors the #sound toggle
  var music = null;      // the looping bg track
  var musicStarted = false;
  var prevSlide = 0;     // to tell forward vs. back navigation
  var fallbackIdx = 0;   // cycles button1/2/3 for generic clicks
  var vietnamChimed = false;

  function preload(){
    for(var i = 0; i < NAMES.length; i++){
      var a = new Audio(DIR + NAMES[i] + ".mp3");
      a.preload = "auto";
      bases[NAMES[i]] = a;
    }
  }

  // Fire-and-forget. Clones the base node so the same effect can overlap.
  function play(name, opts){
    if(!enabled) return;
    var base = bases[name];
    if(!base) return;
    opts = opts || {};
    try{
      var node = base.cloneNode(true);
      node.volume = opts.volume != null ? opts.volume : 0.5;
      if(opts.rate) node.playbackRate = opts.rate;
      var p = node.play();
      if(p && p.catch) p.catch(function(){});   // ignore autoplay rejections
    }catch(e){ /* no-op */ }
  }

  function startMusic(){
    if(musicStarted || !enabled) return;
    musicStarted = true;
    music = bases.bg_music;
    if(!music) return;
    music.loop = true;
    music.volume = 0.16;
    var p = music.play();
    if(p && p.catch) p.catch(function(){ musicStarted = false; });
  }

  function setEnabled(on){
    enabled = !!on;
    if(!enabled){
      if(music){ try{ music.pause(); }catch(e){} }
    }else{
      if(musicStarted && music){ var p = music.play(); if(p && p.catch) p.catch(function(){}); }
      else startMusic();
    }
  }

  // ---- transition sounds: the "page turn" between slides ----------------
  function onSlideChange(index){
    vietnamChimed = false;                 // reset the Vietnam all-levers chime
    if(index > prevSlide)      play("whoosh", { volume: 0.4 });
    else if(index < prevSlide) play("scratch_out", { volume: 0.4 });
    prevSlide = index;
  }

  // ---- reveal stings: react to how a round actually resolved ------------
  // Tracks the revealed edge per channel so slider drags don't re-trigger.
  function watchReveal(channel){
    var wasRevealed = false;
    listen(null, channel, function(state){
      var st = (state && state[0]) || state || {};
      if(st.revealed && !wasRevealed){
        wasRevealed = true;
        playRevealSting(st);
      }else if(!st.revealed){
        wasRevealed = false;
      }
    });
  }

  function playRevealSting(st){
    // China receiver: did the player read the bluff correctly?
    if(st.role === "China"){
      var high = st.usType === "H";
      var adapted = st.chinaResponse === "A";
      var goodRead = (high && adapted) || (!high && !adapted);
      if(goodRead) play("coin_get", { volume: 0.55 });
      else         play("evil_laugh", { volume: 0.5 });
      return;
    }
    // U.S. sender (and the one-scenario teaching slide): sound the outcome.
    switch(st.outcomeType){
      case "adaptation_paradox":            // credible signal that backfires
        play("evil_laugh", { volume: 0.5 }); break;
      case "credible_deterrence_or_delay":  // the signal worked, China waits
        play("coin_get", { volume: 0.55 }); break;
      case "pooling_or_weak_signal":        // belief barely moved
        play("bonk", { volume: 0.45 }); break;
      case "institutional_persistence_signal":
        play("drumroll", { volume: 0.45, rate: 1.0 });
        setTimeout(function(){ play("coin_get", { volume: 0.5 }); }, 650);
        break;
      default:
        play("coin_get", { volume: 0.5 });
    }
  }

  // ---- button presses: a different click per kind of control ------------
  // First class that matches wins; nav buttons are intentionally absent so the
  // slide-transition whoosh carries them instead of doubling up.
  var CLICK_MAP = [
    [".role-world-button",    "machine_start", 0.4],   // 🎲 randomize the world
    [".role-oversight-button","coin_insert",   0.5],   // pay another enforcement installment
    [".role-try-button",      "whoosh",        0.4],   // try another move
    [".role-main-button",     "thump",         0.5],   // Adapt / Wait / Send
    [".scenario-main-button", "thump",         0.5],
    [".scenario-reset",       "squeak",        0.4],   // reset / "roles"
    [".role-switch-btn",      "button2",       0.45],  // swap signal
    [".role-card",            "coin_insert",   0.55],  // pick a role = insert a coin
    [".signal-choice-card",   "coin_insert",   0.55],  // pick a signal
    [".ending-tile",          "button3",       0.45],  // flip a takeaway
    [".vh-lever",             "thump",         0.45]    // pull a Vietnam lever
  ];

  function matches(node, selector){
    return node.matches ? node.matches(selector) : false;
  }

  function onClick(e){
    startMusic();   // first gesture unlocks audio

    // find the nearest button-ish ancestor
    var node = e.target;
    while(node && node !== document){
      if(node.tagName === "BUTTON" || (node.classList && node.classList.contains("button"))) break;
      node = node.parentNode;
    }
    if(!node || node === document) return;

    // Button.js hand-drawn buttons (.button) advance slides — let the
    // transition whoosh handle them so we don't stack two sounds.
    if(node.classList && node.classList.contains("button")) return;
    if(matches(node, ".scenario-next")) return;

    for(var i = 0; i < CLICK_MAP.length; i++){
      if(matches(node, CLICK_MAP[i][0])){
        play(CLICK_MAP[i][1], { volume: CLICK_MAP[i][2] });
        if(matches(node, ".vh-lever")) checkVietnamChime();
        return;
      }
    }
    // generic button → cycle the three UI clicks for variety
    var pick = ["button1", "button2", "button3"][fallbackIdx % 3];
    fallbackIdx++;
    play(pick, { volume: 0.4 });
  }

  // Vietnam: when the fourth lever opens (synthesis appears) reward it once.
  function checkVietnamChime(){
    if(vietnamChimed) return;
    setTimeout(function(){
      if(document.querySelector(".vh-synthesis")){
        vietnamChimed = true;
        play("coin_get", { volume: 0.5 });
      }
    }, 30);
  }

  // ---- toggle wiring ----------------------------------------------------
  function bindToggle(){
    var el = document.getElementById("sound");
    if(!el) return;
    enabled = el.getAttribute("sound") !== "off";
    el.addEventListener("click", function(){
      var next = el.getAttribute("sound") === "on" ? "off" : "on";
      el.setAttribute("sound", next);
      setEnabled(next === "on");
    });
  }

  function init(){
    preload();
    bindToggle();
    document.addEventListener("click", onClick, true);   // capture phase, catches everything
    listen(null, "slideshow/changed", function(index){ onSlideChange(index); });
    watchReveal("signalingRoleGame/stateChanged");
    watchReveal("signalingScenario/stateChanged");
  }

  return { init: init, play: play, setEnabled: setEnabled };

})();
