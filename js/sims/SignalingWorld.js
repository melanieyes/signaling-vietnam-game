/*
  SignalingWorld.js — shared "Equilibrium Lab" state + helpers.

  The slides are independent vanilla components, so cross-round memory and the
  equilibrium / Vietnam logic live here in ONE place. Everything teaching-facing
  (cost environments, the three equilibrium blurbs, Vietnam meter labels) is a
  plain object/array so the text can be edited without touching the components.

  No framework. window.SignalingWorld is a singleton: data + small pure helpers.
*/
(function(){

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function pct(v){ return Math.round(v * 100) + "%"; }

  // ---- editable data -------------------------------------------------------

  // Cost environment scales the gap between Pr(signal|High) and Pr(signal|Low).
  // factor > 1 pushes the types apart (signals separate); < 1 collapses them
  // together (signals pool). This is the knob "Try another world" rolls.
  var COST_ENVIRONMENTS = {
    cheap:  { key: "cheap",  label: "cheap",  factor: 0.50, blurb: "Signals are easy and reversible." },
    medium: { key: "medium", label: "medium", factor: 1.00, blurb: "Costs are moderate." },
    costly: { key: "costly", label: "costly", factor: 1.55, blurb: "Signals are expensive and hard to fake." }
  };
  var COST_KEYS = ["cheap", "medium", "costly"];

  var EQUILIBRIA = {
    separating: {
      key: "separating", title: "Separating",
      text: "Separating pattern: the signal reveals type. China can update strongly."
    },
    pooling: {
      key: "pooling", title: "Pooling",
      text: "Pooling pattern: both types send the same signal. China remains uncertain."
    },
    semi: {
      key: "semi", title: "Ambiguous",
      text: "Ambiguous pattern: the signal moves belief, but not enough to fully resolve uncertainty."
    }
  };

  // Downstream observer meters shown throughout the game.
  var DOWNSTREAM_METERS = [
    { key: "roomToMove",        label: "Vietnam room to move", good: true  },
    { key: "computeDependence", label: "Compute dependence",   good: false },
    { key: "standardsFlex",     label: "Standards flexibility", good: true }
  ];

  // ---- equilibrium classification -----------------------------------------
  // A signal "separates" when the two U.S. types would behave very differently
  // (big gap in likelihoods); it "pools" when they behave alike. When belief
  // lands right on the adaptation threshold, the read is ambiguous regardless.
  function classifyEquilibrium(belief, threshold, likH, likL){
    var gap = Math.abs(likH - likL);
    var nearThreshold = Math.abs(belief - threshold) < 0.07;
    if(nearThreshold) return EQUILIBRIA.semi;
    if(gap >= 0.28) return EQUILIBRIA.separating;
    if(gap <= 0.12) return EQUILIBRIA.pooling;
    return EQUILIBRIA.semi;
  }

  function credibility(belief){
    if(belief >= 0.70) return "credible";
    if(belief >= 0.50) return "mixed";
    return "looks like a bluff";
  }

  // ---- "Try another world" randomization ----------------------------------
  function randomize(){
    return {
      prior: 0.30 + Math.random() * 0.40,              // 30%–70%
      adaptationCapacity: 0.20 + Math.random() * 0.60, // 20%–80%
      loopholes: 0.10 + Math.random() * 0.50,          // 10%–60%
      costKey: COST_KEYS[Math.floor(Math.random() * COST_KEYS.length)],
      usType: Math.random() > 0.5 ? "H" : "L"
    };
  }

  // ---- downstream (Vietnam) meters -----------------------------------------
  // Credible + costly + China adapts → pressure up, room down. Pooling /
  // ambiguous → uncertainty, middling room (Vietnam should hedge). Each Vietnam
  // lever the player commits raises room to move.
  function downstreamMeters(run, leverCount){
    leverCount = leverCount || 0;
    var room = 0.45, dep = 0.55, flex = 0.50;

    if(run && run.eq){
      var eq = run.eq.key;
      var adapt = run.response === "A";
      var costly = run.costKey === "costly";
      var cheap = run.costKey === "cheap";

      if(eq === "separating"){ room = 0.34; dep = 0.66; flex = 0.40; }
      else if(eq === "pooling"){ room = 0.44; dep = 0.52; flex = 0.62; }
      else { room = 0.40; dep = 0.58; flex = 0.50; }

      if(adapt){ room -= 0.07; dep += 0.10; }
      if(costly){ room -= 0.06; dep += 0.08; flex -= 0.05; }
      if(cheap){ room += 0.05; flex += 0.06; }
    }

    room = clamp(room + leverCount * 0.09, 0.10, 0.95);
    return {
      roomToMove: room,
      computeDependence: clamp(dep, 0.10, 0.95),
      standardsFlex: clamp(flex + leverCount * 0.03, 0.10, 0.95)
    };
  }

  // ---- run memory ----------------------------------------------------------
  var state = {
    round: 0,
    lastRun: null,      // last committed/previewed run (see fields in commitRun)
    runLog: [],         // [{round, signal, response, usType, eq}]
    vietnamLevers: {}   // index -> true (set from the Vietnam screen)
  };

  // A previewed run (live slider drag / world panel) — updates lastRun, no round bump.
  function setLastRun(run){ state.lastRun = run; }

  // A committed play — bumps the round counter and appends to the log.
  function commitRun(run){
    state.lastRun = run;
    state.round += 1;
    run.round = state.round;
    state.runLog.push({
      round: state.round,
      signal: run.signal,
      response: run.response,
      usType: run.usType,
      eq: run.eq ? run.eq.key : null
    });
    if(state.runLog.length > 12) state.runLog.shift();
    return run;
  }

  function vietnamLeverCount(){
    var n = 0;
    for(var k in state.vietnamLevers){ if(state.vietnamLevers[k]) n++; }
    return n;
  }

  // Human sentence describing the last run, for the Vietnam screen.
  function lastRunSentence(){
    var r = state.lastRun;
    if(!r || !r.signal) return "Play a round first — then Vietnam reacts to what it saw.";
    var sig = r.signalReal || r.signal;
    if(r.response === "A") return "In your run, China adapted after seeing " + sig + ".";
    if(r.response === "W") return "In your run, China chose Wait after seeing " + sig + ".";
    return "In your run, China observed " + sig + ".";
  }

  window.SignalingWorld = {
    COST_ENVIRONMENTS: COST_ENVIRONMENTS,
    COST_KEYS: COST_KEYS,
    EQUILIBRIA: EQUILIBRIA,
    DOWNSTREAM_METERS: DOWNSTREAM_METERS,
    state: state,
    pct: pct,
    clamp: clamp,
    classifyEquilibrium: classifyEquilibrium,
    credibility: credibility,
    randomize: randomize,
    downstreamMeters: downstreamMeters,
    setLastRun: setLastRun,
    commitRun: commitRun,
    vietnamLeverCount: vietnamLeverCount,
    lastRunSentence: lastRunSentence
  };

})();
