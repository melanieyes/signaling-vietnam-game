/*
  Signals of Compute Power
  One-scenario teaching slide: one signal, one belief update, one lesson.
*/

function SignalingScenario(config){

  var self = this;
  self.id = config.id || "signaling_scenario";
  self.signalId = config.signalId || "E";
  self.specPath = config.specPath || "signals_of_compute_power_copilot_spec_v2.json";
  self.width = config.width || 960;
  self.height = config.height || 540;

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_scenario";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = self.width + "px";
  self.dom.style.height = self.height + "px";

  self.spec = null;
  self.state = {
    usType: "H",
    priorHighResolve: 0.5,
    chinaBelief: 0.5,
    adaptationThreshold: 0.6,
    chinaResponse: null,
    outcomeType: null,
    interacted: false
  };

  var scenarioLessons = {
    E: {
      idea: "A credible signal can make waiting feel dangerous.",
      prompt: "Send the costly signal and watch whether belief crosses China's adaptation threshold.",
      shortOutcome: "Adapts faster",
      reveal: "The signal works as a signal. That is the twist: once China believes it, adaptation becomes the safer response.",
      kicker: "Lesson: costly signals can backfire.",
      outcome: "adaptation_paradox"
    },
    T: {
      idea: "A measurable threshold can still be a weak signal.",
      prompt: "Send the threshold signal and watch how little the belief moves.",
      shortOutcome: "Belief barely moves",
      reveal: "The policy is legible, but easy for both U.S. types to announce. China learns less from the announcement alone.",
      kicker: "Lesson: measurable is not always credible.",
      outcome: "pooling_or_weak_signal"
    },
    K: {
      idea: "Provider oversight becomes credible through repetition.",
      prompt: "Send the oversight signal and watch persistence do the signaling work.",
      shortOutcome: "Credibility accumulates",
      reveal: "Oversight is less dramatic than a chokepoint, but enforcement over time can reveal durable resolve.",
      kicker: "Lesson: institutions reveal resolve over time.",
      outcome: "institutional_persistence_signal"
    }
  };

  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function pct(value){
    return Math.round(value * 100) + "%";
  }

  function get(obj, path, fallback){
    var cursor = obj;
    for(var i=0; i<path.length; i++){
      if(!cursor || cursor[path[i]] === undefined) return fallback;
      cursor = cursor[path[i]];
    }
    return cursor;
  }

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, text, onClick){
    var node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function likelihoods(){
    var values = get(self.spec, ["suggested_logic", "computeSignalLikelihoods", self.signalId], {});
    var h = values.Pr_s_given_H || 0.5;
    var l = values.Pr_s_given_L || 0.5;
    var persistence = get(self.spec, ["initial_game_state", "enforcementPersistence"], 0.5);

    if(self.signalId === "K"){
      h += 0.18 * persistence;
      l -= 0.10 * persistence;
    }
    if(self.signalId === "T"){
      h += 0.08 * persistence;
    }

    return {
      H: clamp(h, 0.05, 0.95),
      L: clamp(l, 0.05, 0.95)
    };
  }

  function computeBelief(){
    var prior = self.state.priorHighResolve;
    var lik = likelihoods();
    var denominator = (lik.H * prior) + (lik.L * (1 - prior));
    var raw = denominator ? (lik.H * prior) / denominator : prior;
    var noise = get(self.spec, ["initial_game_state", "noise"], 0.2);
    return clamp(raw * (1 - noise) + prior * noise, 0, 1);
  }

  function computeThreshold(){
    var capacity = get(self.spec, ["initial_game_state", "adaptationCapacity"], 0.5);
    var loopholes = get(self.spec, ["initial_game_state", "loopholes"], 0.3);
    return clamp(0.65 - (0.35 * capacity) + (0.15 * loopholes), 0.15, 0.9);
  }

  function classify(response){
    if(self.signalId === "E" && response === "A") return "adaptation_paradox";
    if(self.signalId === "E" && response === "W") return "credible_deterrence_or_delay";
    if(self.signalId === "T") return "pooling_or_weak_signal";
    if(self.signalId === "K") return "institutional_persistence_signal";
    return "mixed_signal";
  }

  function signal(){
    return get(self.spec, ["game_model", "signals", self.signalId], {});
  }

  function outcome(){
    var preferred = scenarioLessons[self.signalId] && scenarioLessons[self.signalId].outcome;
    return get(self.spec, ["outcomes", self.state.outcomeType || preferred], {});
  }

  function step(){
    self.state.interacted = true;
    self.state.chinaBelief = computeBelief();
    self.state.adaptationThreshold = computeThreshold();
    self.state.chinaResponse = self.state.chinaBelief >= self.state.adaptationThreshold ? "A" : "W";
    self.state.outcomeType = classify(self.state.chinaResponse);
    self.render();
    publish("signalingScenario/stateChanged", [clone(self.state)]);
  }

  function reset(){
    self.state = {
      usType: "H",
      priorHighResolve: get(self.spec, ["initial_game_state", "priorHighResolve"], 0.5),
      chinaBelief: get(self.spec, ["initial_game_state", "priorHighResolve"], 0.5),
      adaptationThreshold: computeThreshold(),
      chinaResponse: null,
      outcomeType: null,
      interacted: false
    };
    self.render();
  }

  function renderFlow(){
    var flow = el("section", "scenario-flow");
    var names = get(self.spec, ["game_model", "players", "US", "hidden_type", "values"], {H:"High Resolve"});
    var sig = signal();
    var response = self.state.chinaResponse === "A" ? "Adapt" : (self.state.chinaResponse === "W" ? "Wait" : "?");
    var lesson = scenarioLessons[self.signalId] || {};
    var nodes = [
      ["Nature", names[self.state.usType] || "High Resolve"],
      ["U.S.", "sends signal"],
      ["Signal", sig.short_label || sig.label || self.signalId],
      ["China", response],
      ["Outcome", self.state.interacted ? (lesson.shortOutcome || "revealed") : "?"]
    ];

    for(var i=0; i<nodes.length; i++){
      var node = el("div", "scenario-node");
      node.appendChild(el("span", "", nodes[i][0]));
      node.appendChild(el("b", "", nodes[i][1]));
      flow.appendChild(node);
      if(i < nodes.length - 1) flow.appendChild(el("div", "scenario-arrow", "->"));
    }
    return flow;
  }

  function renderBeliefBar(){
    var wrap = el("div", "scenario-belief");
    var top = el("div", "scenario-belief-label");
    top.appendChild(el("span", "", "China's belief that U.S. resolve is durable"));
    top.appendChild(el("b", "", pct(self.state.chinaBelief)));
    wrap.appendChild(top);

    var track = el("div", "scenario-belief-track");
    var prior = el("div", "scenario-prior");
    prior.style.left = pct(self.state.priorHighResolve);
    track.appendChild(prior);

    var fill = el("div", "scenario-belief-fill");
    fill.style.width = pct(self.state.chinaBelief);
    track.appendChild(fill);

    var marker = el("div", "scenario-threshold");
    marker.style.left = pct(self.state.adaptationThreshold);
    track.appendChild(marker);
    wrap.appendChild(track);

    var legend = el("div", "scenario-belief-legend");
    legend.appendChild(el("span", "", "prior " + pct(self.state.priorHighResolve)));
    legend.appendChild(el("span", "", "adapt threshold " + pct(self.state.adaptationThreshold)));
    wrap.appendChild(legend);
    return wrap;
  }

  function renderInteraction(){
    var sig = signal();
    var lesson = scenarioLessons[self.signalId] || {};
    var center = el("section", "scenario-center");
    center.appendChild(el("p", "scenario-small-label", "click once"));
    center.appendChild(el("h3", "", sig.short_label || sig.label || self.signalId));
    center.appendChild(el("p", "scenario-copy", lesson.prompt || sig.ui_copy || ""));
    center.appendChild(renderBeliefBar());

    var actionText = self.state.interacted ? "Run it again" : "Send this signal";
    center.appendChild(button("scenario-main-button", actionText, step));

    if(!self.state.interacted){
      center.appendChild(el("p", "scenario-response muted", "Click once. Watch the belief move."));
    }

    return center;
  }

  function renderInterpretation(){
    var right = el("section", "scenario-right");
    if(!self.state.interacted){
      right.appendChild(el("div", "scenario-card-placeholder", "Interpretation appears here after you send the signal."));
      return right;
    }

    var sig = signal();
    var out = outcome();
    var lesson = scenarioLessons[self.signalId] || {};
    right.appendChild(el("p", "scenario-small-label", "interpretation"));
    right.appendChild(el("h3", "", out.title || sig.label));
    right.appendChild(el("p", "", lesson.reveal || out.copy || sig.belief_effect || ""));
    right.appendChild(el("p", "scenario-kicker", lesson.kicker || out.lesson || ""));
    return right;
  }

  self.render = function(){
    self.dom.innerHTML = "";

    if(!self.spec){
      self.dom.appendChild(el("div", "scenario-loading", "loading..."));
      return;
    }

    var sig = signal();
    var lesson = scenarioLessons[self.signalId] || {};
    var page = el("div", "scenario-page scenario-" + self.signalId);

    var header = el("header", "scenario-header");
    var title = el("div");
    title.appendChild(el("p", "scenario-eyebrow", "Signals of Compute Power"));
    title.appendChild(el("h2", "", sig.label || "Scenario"));
    title.appendChild(el("p", "", lesson.idea || sig.description || ""));
    header.appendChild(title);
    var headerButtons = el("div", "scenario-header-buttons");
    headerButtons.appendChild(button("scenario-reset", "reset", reset));
    headerButtons.appendChild(button("scenario-next", "next", function(){
      publish("slideshow/next");
    }));
    header.appendChild(headerButtons);
    page.appendChild(header);

    var grid = el("div", "scenario-grid");
    var left = el("div", "scenario-left");
    left.appendChild(renderFlow());
    left.appendChild(el("p", "scenario-left-note", lesson.kicker || ""));
    grid.appendChild(left);
    grid.appendChild(renderInteraction());
    grid.appendChild(renderInterpretation());
    page.appendChild(grid);

    self.dom.appendChild(page);
  };

  self.loadSpec = function(){
    fetch(self.specPath).then(function(response){
      if(!response.ok) throw new Error("Could not load " + self.specPath);
      return response.json();
    }).then(function(spec){
      self.spec = spec;
      reset();
    }).catch(function(err){
      console.error(err);
      self.dom.innerHTML = "";
      self.dom.appendChild(el("div", "scenario-loading", "Could not load scenario spec."));
    });
  };

  listen(self, "signalingScenario/step/" + self.signalId, step);
  listen(self, "signalingScenario/reset/" + self.signalId, reset);

  self.add = function(){ _add(self); };
  self.remove = function(){
    unlisten(self);
    _remove(self);
  };

  self.render();
  self.loadSpec();
}

window.SignalingScenario = SignalingScenario;

function SignalingRoleChoice(config){

  var self = this;
  self.id = config.id || "signaling_role_choice";
  self.dom = document.createElement("div");
  self.dom.className = "object signaling_role_choice";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function choose(role){
    window.signalingRole = role;
    window.signalingSelectedSignal = null;
    window.signalingHasRunSignal = false;
    window.signalingLastState = null;
    window.signalingPhase = "choose-signal";
    publish("slideshow/next");
  }

  self.render = function(){
    self.dom.innerHTML = "";
    var page = el("div", "role-page");
    page.appendChild(el("p", "role-eyebrow", "Signals of Compute Power"));
    page.appendChild(el("h2", "", "Who do you want to play?"));

    var choices = el("div", "role-choices");
    var us = el("button", "role-card");
    us.type = "button";
    us.appendChild(el("b", "", "Play as the U.S. Sender"));
    us.appendChild(el("span", "", "See your type. Choose the signal. China responds automatically."));
    us.addEventListener("click", function(){ choose("US"); });

    var china = el("button", "role-card");
    china.type = "button";
    china.appendChild(el("b", "", "Play as China Receiver"));
    china.appendChild(el("span", "", "See only the signal and belief. Choose Adapt or Wait."));
    china.addEventListener("click", function(){ choose("China"); });

    choices.appendChild(us);
    choices.appendChild(china);
    page.appendChild(choices);
    page.appendChild(el("p", "role-note", "First play the U.S.-China signal game. Vietnam responds downstream later."));
    self.dom.appendChild(page);
  };

  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };

  self.render();
}

window.SignalingRoleChoice = SignalingRoleChoice;

function SignalingSignalSelection(config){

  var self = this;
  self.id = config.id || "signaling_signal_choice";
  self.dom = document.createElement("div");
  self.dom.className = "object signaling_signal_choice";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  var signals = [
    {
      id: "E",
      title: "Costly move",
      copy: "Pay a large, visible cost right now.",
      jump: "Hard to fake.",
      reveal: "real policy: ???"
    },
    {
      id: "T",
      title: "Cheap promise",
      copy: "Announce a rule. Easy to say, easy to walk back.",
      jump: "Easy to copy.",
      reveal: "real policy: ???"
    },
    {
      id: "K",
      title: "Slow burn",
      copy: "Start small, then keep enforcing over time.",
      jump: "Credibility builds through repetition.",
      reveal: "real policy: ???"
    }
  ];

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function choose(signalId){
    window.signalingSelectedSignal = signalId;
    window.signalingHasRunSignal = true;
    window.signalingPhase = "run-signal";
    publish("slideshow/next");
  }

  self.render = function(){
    self.dom.innerHTML = "";
    var page = el("div", "signal-choice-page");
    page.appendChild(el("p", "role-eyebrow", window.signalingRole === "China" ? "Play as China Receiver" : "Play as the U.S. Sender"));
    page.appendChild(el("h2", "", "Pick your move"));
    page.appendChild(el("p", "signal-choice-note", "Pick the kind of signal you want to send. The real compute policy is revealed after China responds."));

    // tiny first-run guide: where the player is in the wider game
    var guideSteps = ["choose signal", "China updates", "policy reveal", "Vietnam responds"];
    var strip = el("div", "play-steps");
    for(var g=0; g<guideSteps.length; g++){
      var st = el("div", "play-step" + (g === 0 ? " current" : ""));
      st.appendChild(el("span", "play-step-num", String(g+1)));
      st.appendChild(el("span", "play-step-label", guideSteps[g]));
      strip.appendChild(st);
      if(g < guideSteps.length - 1) strip.appendChild(el("span", "play-step-arrow", "→"));
    }
    page.appendChild(strip);
    page.appendChild(el("p", "signal-choice-hint", "Click one card to send this signal."));

    var grid = el("div", "signal-choice-grid");
    for(var i=0; i<signals.length; i++){
      (function(signal){
        var card = el("button", "signal-choice-card");
        card.type = "button";
        card.appendChild(el("b", "", signal.title));
        card.appendChild(el("span", "", signal.copy));
        card.appendChild(el("small", "", signal.jump));
        card.appendChild(el("small", "signal-choice-reveal", signal.reveal));
        card.addEventListener("click", function(){ choose(signal.id); });
        grid.appendChild(card);
      })(signals[i]);
    }
    page.appendChild(grid);
    self.dom.appendChild(page);
  };

  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };

  self.render();
}

window.SignalingSignalSelection = SignalingSignalSelection;

function SignalingRoleGame(config){

  var self = this;
  self.id = config.id || "signaling_role_game";
  self.specPath = config.specPath || "signals_of_compute_power_copilot_spec_v2.json";
  self.role = window.signalingRole || "US";

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_role_game";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  self.spec = null;
  self.nextChinaSignalIndex = 0;
  self.state = {
    usType: "H",
    signal: null,
    priorHighResolve: 0.5,
    adaptationCapacity: 0.5,
    loopholes: 0.3,
    noise: 0.2,
    costKey: "medium",
    chinaBelief: 0.5,
    adaptationThreshold: 0.6,
    chinaResponse: null,
    outcomeType: null,
    oversightStep: 0,
    revealed: false
  };
  self._lastEq = null;

  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function pct(value){
    return Math.round(value * 100) + "%";
  }

  function get(obj, path, fallback){
    var cursor = obj;
    for(var i=0; i<path.length; i++){
      if(!cursor || cursor[path[i]] === undefined) return fallback;
      cursor = cursor[path[i]];
    }
    return cursor;
  }

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, text, onClick){
    var node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function signalIds(){
    return ["E", "T", "K"];
  }

  function signalInfo(signalId){
    return get(self.spec, ["game_model", "signals", signalId], {});
  }

  function likelihoods(signalId){
    var values = get(self.spec, ["suggested_logic", "computeSignalLikelihoods", signalId], {});
    var h = values.Pr_s_given_H || 0.5;
    var l = values.Pr_s_given_L || 0.5;
    var persistence = get(self.spec, ["initial_game_state", "enforcementPersistence"], 0.5);

    if(signalId === "K"){
      h += 0.18 * persistence;
      l -= 0.10 * persistence;
    }
    if(signalId === "T"){
      h += 0.08 * persistence;
    }

    // Cost environment widens (costly) or collapses (cheap) the gap between the
    // two U.S. types around their midpoint, that is what flips a signal between
    // separating and pooling when you hit "Try another world".
    var env = window.SignalingWorld && SignalingWorld.COST_ENVIRONMENTS[self.state.costKey];
    var f = env ? env.factor : 1;
    var mid = (h + l) / 2;
    h = mid + (h - mid) * f;
    l = mid + (l - mid) * f;

    return { H: clamp(h, 0.05, 0.95), L: clamp(l, 0.05, 0.95) };
  }

  function computeBelief(signalId){
    var prior = self.state.priorHighResolve;
    var lik = likelihoods(signalId);
    var denominator = (lik.H * prior) + (lik.L * (1 - prior));
    var raw = denominator ? (lik.H * prior) / denominator : prior;
    var noise = self.state.noise;
    return clamp(raw * (1 - noise) + prior * noise, 0, 1);
  }

  function computeThreshold(){
    var capacity = self.state.adaptationCapacity;
    var loopholes = self.state.loopholes;
    return clamp(0.65 - (0.35 * capacity) + (0.15 * loopholes), 0.15, 0.9);
  }

  function autoChinaResponse(){
    return self.state.chinaBelief >= self.state.adaptationThreshold ? "A" : "W";
  }

  function classify(signalId, response){
    if(signalId === "E" && self.state.chinaBelief >= self.state.adaptationThreshold && response === "A") return "adaptation_paradox";
    if(signalId === "E" && self.state.chinaBelief >= self.state.adaptationThreshold && response === "W") return "credible_deterrence_or_delay";
    if(signalId === "T" && Math.abs(self.state.chinaBelief - self.state.priorHighResolve) < 0.1) return "pooling_or_weak_signal";
    if(signalId === "K") return "institutional_persistence_signal";
    return "mixed_signal";
  }

  function sampleSignalForType(){
    var ids = signalIds();
    var total = 0;
    var weights = [];
    for(var i=0; i<ids.length; i++){
      var lik = likelihoods(ids[i]);
      var weight = self.state.usType === "H" ? lik.H : lik.L;
      weights.push(weight);
      total += weight;
    }
    var roll = Math.random() * total;
    for(var j=0; j<ids.length; j++){
      roll -= weights[j];
      if(roll <= 0) return ids[j];
    }
    return ids[0];
  }

  function vietnamImplication(){
    var implications = self.spec.vietnam_implications || {};
    return implications[self.state.signal] || implications.general || {};
  }

  function outcome(){
    return get(self.spec, ["outcomes", self.state.outcomeType], {});
  }

  function outcomeLine(){
    var lines = {
      adaptation_paradox: "Credible signal, but China adapts.",
      credible_deterrence_or_delay: "Credible signal, China waits.",
      pooling_or_weak_signal: "Belief stays close to the prior.",
      institutional_persistence_signal: "Credibility accumulates through enforcement.",
      mixed_signal: "The signal moves belief, but not cleanly."
    };
    return lines[self.state.outcomeType] || "The signal changes the next move.";
  }

  function vietnamLine(){
    var lines = {
      E: "Diversify compute access; avoid one chokepoint.",
      T: "Build capacity for standards, reporting, and risk tiers.",
      K: "Govern trusted cloud and data-center intermediaries."
    };
    return lines[self.state.signal] || "Preserve flexibility while building governance capacity.";
  }

  function oversightSteps(){
    return [
      { label: "Announce KYC", short: "Announce", copy: "A policy exists. Belief nudges upward." },
      { label: "Audit providers", short: "Audit", copy: "Implementation appears. Belief rises again." },
      { label: "Enforce penalty", short: "Enforce", copy: "Follow-through is costly. Credibility lands." }
    ];
  }

  function computeOversightBelief(step){
    var fullBelief = computeBelief("K");
    var fractions = [0, 0.3, 0.65, 1];
    var fraction = fractions[clamp(step, 0, 3)] || 0;
    return clamp(self.state.priorHighResolve + ((fullBelief - self.state.priorHighResolve) * fraction), 0, 1);
  }

  function advanceOversight(){
    if(self.state.signal !== "K" || self.state.oversightStep >= 3) return;
    self.state.oversightStep++;
    self.state.chinaBelief = computeOversightBelief(self.state.oversightStep);
    self.state.adaptationThreshold = computeThreshold();

    if(self.state.oversightStep === 3 && self.role === "US"){
      self.state.chinaResponse = autoChinaResponse();
      self.state.outcomeType = classify(self.state.signal, self.state.chinaResponse);
      self.state.revealed = true;
      window.signalingLastState = clone(self.state);
      commitRun();
    }

    self.render();
    publish("signalingRoleGame/stateChanged", [clone(self.state)]);
  }

  function chooseSignal(signalId){
    self.state.signal = signalId;
    self.state.chinaBelief = computeBelief(signalId);
    self.state.adaptationThreshold = computeThreshold();
    self.state.chinaResponse = autoChinaResponse();
    self.state.outcomeType = classify(signalId, self.state.chinaResponse);
    self.state.revealed = true;
    window.signalingLastState = clone(self.state);
    commitRun();
    self.render();
    publish("signalingRoleGame/stateChanged", [clone(self.state)]);
  }

  function chooseResponse(response){
    self.state.chinaResponse = response;
    self.state.outcomeType = classify(self.state.signal, response);
    self.state.revealed = true;
    window.signalingLastState = clone(self.state);
    commitRun();
    self.render();
    publish("signalingRoleGame/stateChanged", [clone(self.state)]);
  }

  function handleTryAnotherSignal(){
    window.signalingSelectedSignal = null;
    window.signalingHasRunSignal = false;
    window.signalingLastState = null;
    window.signalingPhase = "choose-signal";
    self.state.signal = null;
    self.state.chinaResponse = null;
    self.state.outcomeType = null;
    self.state.oversightStep = 0;
    self.state.revealed = false;
    self.state.chinaBelief = self.state.priorHighResolve;
    self.state.adaptationThreshold = computeThreshold();
    publish("signalingRoleGame/stateChanged", [clone(self.state)]);
    publish("slideshow/goto", ["signaling_signal_choice"]);
  }

  function prepareSelectedSignal(){
    var ids = signalIds();
    var selected = window.signalingSelectedSignal;
    if(ids.indexOf(selected) < 0) selected = "E";
    self.state.usType = Math.random() > 0.5 ? "H" : "L";
    self.state.signal = selected;
    self.state.oversightStep = 0;
    // U.S.+K starts at the prior and builds via the oversight steps; China (and
    // every other signal) reads the signal's full belief straight away.
    self.state.chinaBelief = (self.role === "US" && self.state.signal === "K") ? self.state.priorHighResolve : computeBelief(self.state.signal);
    self.state.adaptationThreshold = computeThreshold();
    self.state.chinaResponse = null;
    self.state.outcomeType = null;
    self.state.revealed = false;
    if(self.role === "US" && self.state.signal !== "K"){
      self.state.chinaResponse = autoChinaResponse();
      self.state.outcomeType = classify(self.state.signal, self.state.chinaResponse);
      self.state.revealed = true;
      window.signalingLastState = clone(self.state);
      commitRun();
    }
  }

  function reset(){
    var initial = get(self.spec, ["initial_game_state"], {});
    self.role = window.signalingRole || self.role || "US";
    self.role = self.role === "US" ? "US" : "China";
    self.state = {
      usType: Math.random() > 0.5 ? "H" : "L",
      signal: null,
      priorHighResolve: initial.priorHighResolve != null ? initial.priorHighResolve : 0.5,
      adaptationCapacity: initial.adaptationCapacity != null ? initial.adaptationCapacity : 0.5,
      loopholes: initial.loopholes != null ? initial.loopholes : 0.3,
      noise: initial.noise != null ? initial.noise : 0.2,
      costKey: initial.costKey || "medium",
      chinaBelief: initial.priorHighResolve != null ? initial.priorHighResolve : 0.5,
      adaptationThreshold: 0.6,
      chinaResponse: null,
      outcomeType: null,
      oversightStep: 0,
      revealed: false
    };
    self.state.adaptationThreshold = computeThreshold();
    prepareSelectedSignal();
    self.render();
  }

  // --- interactivity: inline signal switch + live "world" knobs ---

  function switchSignal(id){
    window.signalingSelectedSignal = id;
    self.state.signal = id;
    self.state.oversightStep = 0;
    self.state.adaptationThreshold = computeThreshold();
    if(id === "K"){
      self.state.chinaBelief = self.state.priorHighResolve;
      self.state.revealed = false;
      self.state.chinaResponse = null;
      self.state.outcomeType = null;
    }else{
      self.state.chinaBelief = computeBelief(id);
      if(self.role === "US"){
        self.state.chinaResponse = autoChinaResponse();
        self.state.outcomeType = classify(id, self.state.chinaResponse);
        self.state.revealed = true;
        window.signalingLastState = clone(self.state);
        commitRun();
      }else{
        self.state.revealed = false;
        self.state.chinaResponse = null;
        self.state.outcomeType = null;
      }
    }
    self.render();
    publish("signalingRoleGame/stateChanged", [clone(self.state)]);
  }

  // Recompute + patch only the live nodes, so dragging a slider never
  // rebuilds (and steals focus from) the slider being dragged.
  function liveUpdate(){
    self.state.adaptationThreshold = computeThreshold();
    if(self.state.signal){
      self.state.chinaBelief = (self.role === "US" && self.state.signal === "K")
        ? computeOversightBelief(self.state.oversightStep)
        : computeBelief(self.state.signal);
    }else{
      self.state.chinaBelief = self.state.priorHighResolve;
    }
    if(self.state.revealed){
      if(self.role === "US") self.state.chinaResponse = autoChinaResponse();
      self.state.outcomeType = classify(self.state.signal, self.state.chinaResponse);
      window.signalingLastState = clone(self.state);
      previewRun();
    }

    var fill = self.dom.querySelector(".role-belief-fill");
    if(fill) fill.style.width = pct(self.state.chinaBelief);
    var thr = self.dom.querySelector(".role-threshold");
    if(thr) thr.style.left = pct(self.state.adaptationThreshold);
    var bval = self.dom.querySelector(".role-belief-label b");
    if(bval) bval.textContent = pct(self.state.chinaBelief);
    self._shownBelief = self.state.chinaBelief;
    var explain = self.dom.querySelector(".role-belief-explain");
    if(explain && explain.parentNode) explain.parentNode.replaceChild(renderBeliefExplainer(), explain);
    var reveal = self.dom.querySelector(".role-reveal");
    if(reveal && reveal.parentNode) reveal.parentNode.replaceChild(renderReveal(), reveal);
    var flow = self.dom.querySelector(".role-game-flow");
    if(flow && flow.parentNode) flow.parentNode.replaceChild(renderFlow(), flow);
  }

  // Abstract face shown DURING play; real-world identity revealed only in the result.
  function signalFace(id){
    return ({
      E: { short: "Costly move", abstract: "A big upfront sacrifice", tag: "costly, hard to fake",
           real: "Export Controls",
           realBlurb: "an advanced-chip ban like the Oct 2022 BIS rules." },
      T: { short: "Cheap promise", abstract: "A cheap public promise", tag: "cheap, easy to copy",
           real: "Training-Compute Thresholds",
           realBlurb: "a 10^26 FLOP line that was easy to revise." },
      K: { short: "Slow burn", abstract: "Repeated enforcement", tag: "builds over time",
           real: "Provider Oversight",
           realBlurb: "cloud KYC and audits that must keep repeating." }
    })[id] || { short: id, abstract: id, tag: "", real: id, realBlurb: "" };
  }

  // --- Equilibrium Lab: classify the run + remember it across rounds ---

  function currentEquilibrium(){
    if(!window.SignalingWorld || !self.state.signal) return null;
    var lik = likelihoods(self.state.signal);
    return SignalingWorld.classifyEquilibrium(self.state.chinaBelief, self.state.adaptationThreshold, lik.H, lik.L);
  }

  function buildRun(){
    var face = signalFace(self.state.signal);
    return {
      signal: self.state.signal,
      signalReal: face.real,
      response: self.state.chinaResponse,
      usType: self.state.usType,
      belief: self.state.chinaBelief,
      threshold: self.state.adaptationThreshold,
      costKey: self.state.costKey,
      role: self.role,
      eq: currentEquilibrium()
    };
  }

  // previewRun: live recompute (slider drag), no new round.
  function previewRun(){
    if(!window.SignalingWorld || !self.state.signal || !self.state.revealed) return;
    self._lastEq = currentEquilibrium();
    SignalingWorld.setLastRun(buildRun());
  }

  // commitRun: an actual play resolved, bumps the round counter + log.
  function commitRun(){
    if(!window.SignalingWorld || !self.state.signal) return;
    self._lastEq = currentEquilibrium();
    SignalingWorld.commitRun(buildRun());
  }

  function tryAnotherWorld(){
    if(window.SignalingWorld){
      var w = SignalingWorld.randomize();
      self.state.priorHighResolve = w.prior;
      self.state.adaptationCapacity = w.adaptationCapacity;
      self.state.loopholes = w.loopholes;
      self.state.costKey = w.costKey;
      self.state.usType = w.usType;
    }
    self.state.adaptationThreshold = computeThreshold();

    if(self.role === "US" && self.state.signal === "K"){
      // restart the slow-burn sequence in the new world (U.S. sender only)
      self.state.oversightStep = 0;
      self.state.chinaBelief = self.state.priorHighResolve;
      self.state.revealed = false;
      self.state.chinaResponse = null;
      self.state.outcomeType = null;
    }else if(self.state.signal){
      self.state.chinaBelief = computeBelief(self.state.signal);
      if(self.role === "US"){
        self.state.chinaResponse = autoChinaResponse();
        self.state.outcomeType = classify(self.state.signal, self.state.chinaResponse);
        self.state.revealed = true;
        window.signalingLastState = clone(self.state);
        commitRun();
      }else{
        // China mode: keep the same signal, hide type again for a fresh decision
        self.state.revealed = false;
        self.state.chinaResponse = null;
        self.state.outcomeType = null;
      }
    }else{
      self.state.chinaBelief = self.state.priorHighResolve;
    }
    self.render();
    publish("signalingRoleGame/stateChanged", [clone(self.state)]);
  }

  function renderSignalSwitch(){
    var wrap = el("div", "role-signal-switch");
    var ids = signalIds();
    for(var i = 0; i < ids.length; i++){
      (function(id){
        var face = signalFace(id);
        var active = self.state.signal === id;
        var b = el("button", "role-switch-btn" + (active ? " active" : ""));
        b.type = "button";
        b.title = face.tag;
        b.appendChild(el("b", "", face.short));
        b.appendChild(el("small", "", face.tag));
        if(active) b.appendChild(el("span", "role-switch-badge", "chosen ✓"));
        b.addEventListener("click", function(){ switchSignal(id); });
        wrap.appendChild(b);
      })(ids[i]);
    }
    return wrap;
  }

  function renderKnobs(){
    var defs = [
      { key: "priorHighResolve", label: "Prior: China's hunch the U.S. is High" },
      { key: "adaptationCapacity", label: "China's adaptation capacity" },
      { key: "loopholes", label: "Loophole availability" }
    ];
    var knobs = el("div", "role-knobs");
    var knobsHead = el("div", "role-knobs-head");
    knobsHead.appendChild(el("p", "role-knobs-title", "drag to change the world"));
    knobsHead.appendChild(button("role-world-button", "🎲 randomize", tryAnotherWorld));
    knobs.appendChild(knobsHead);
    for(var i = 0; i < defs.length; i++){
      (function(def){
        var knob = el("label", "role-knob");
        var top = el("div", "role-knob-top");
        top.appendChild(el("span", "", def.label));
        var val = el("b", "", pct(self.state[def.key]));
        top.appendChild(val);
        knob.appendChild(top);
        var input = document.createElement("input");
        input.type = "range";
        input.min = 0; input.max = 1; input.step = 0.01;
        input.value = self.state[def.key];
        input.addEventListener("input", function(){
          self.state[def.key] = Number(input.value);
          val.textContent = pct(self.state[def.key]);
          liveUpdate();
        });
        knob.appendChild(input);
        knobs.appendChild(knob);
      })(defs[i]);
    }
    return knobs;
  }

  function tweenNumber(node, from, to){
    if(!node) return;
    var start = null, dur = 430;
    function step(ts){
      if(start == null) start = ts;
      var t = Math.min(1, (ts - start) / dur);
      node.textContent = pct(from + (to - from) * t);
      if(t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function chinaMood(){
    var b = self.state.chinaBelief;
    if(b < 0.40) return "skeptical 😐";
    if(b < 0.58) return "unsure 🤨";
    if(b < 0.78) return "fairly convinced 🤔";
    return "convinced you mean it 😮";
  }

  function beliefWhy(){
    return {
      E: "A big upfront sacrifice is expensive and hard to fake, a bluffer wouldn't pay it, so China's belief jumps.",
      T: "A cheap public promise is easy to copy; anyone can announce it, so China barely moves off its hunch.",
      K: "Repeated enforcement looks modest at first; its credibility only builds if it keeps happening."
    }[self.state.signal] || "Pick a move to see how China reads it.";
  }

  function verdictLine(){
    var b = self.state.chinaBelief, thr = self.state.adaptationThreshold;
    if(self.role === "China"){
      if(b >= thr) return "Belief " + pct(b) + " crossed the adapt line " + pct(thr) + " → adaptation looks safer.";
      return "Belief " + pct(b) + " stayed below the adapt line " + pct(thr) + " → waiting looks safer.";
    }
    if(b >= thr){
      return "Belief " + pct(b) + " crossed the adapt line " + pct(thr) + " → China adapts.";
    }
    return "Belief " + pct(b) + " stayed below the adapt line " + pct(thr) + " → China waits.";
  }

  function chinaVerdict(){
    var high = self.state.usType === "H";
    var adapted = self.state.chinaResponse === "A";
    if(high && adapted)   return "Good read. The U.S. really was High Resolve.";
    if(high && !adapted)  return "Risky. The U.S. really was High Resolve, waiting leaves you exposed.";
    if(!high && !adapted) return "Good read. It was a Low-Resolve bluff, waiting saved you the cost.";
    return "It was a Low-Resolve bluff. You adapted to a feint.";
  }

  function renderBeliefExplainer(){
    var box = el("div", "role-belief-explain");
    box.appendChild(el("p", "role-mood", "China looks " + chinaMood()));
    // China mode keeps the center sparse: mood + one threshold sentence only.
    // The "why this signal moves belief" paragraph stays in US sender mode.
    if(self.role !== "China") box.appendChild(el("p", "role-why", beliefWhy()));
    if(self.state.signal){
      var crossed = self.state.chinaBelief >= self.state.adaptationThreshold;
      box.appendChild(el("p", "role-verdict" + (crossed ? " crossed" : " below"), verdictLine()));
    }
    return box;
  }

  function renderFlow(){
    var flow = el("div", "role-game-flow");
    var names = get(self.spec, ["game_model", "players", "US", "hidden_type", "values"], {});
    var typeText = self.role === "US" || self.state.revealed ? (names[self.state.usType] || self.state.usType) : "secret";
    var sig = self.state.signal ? signalFace(self.state.signal).short : "?";
    var response = self.state.chinaResponse === "A" ? "Adapt" : (self.state.chinaResponse === "W" ? "Wait" : "?");
    var nodes = [
      ["Nature", typeText],
      ["U.S.", self.role === "China" ? "sent signal" : "you choose"],
      ["Signal", sig],
      ["China", self.role === "China" ? (self.state.chinaResponse ? response : "your move") : response],
      ["Outcome", self.state.revealed ? (outcome().title || "revealed") : "?"]
    ];
    for(var i=0; i<nodes.length; i++){
      var node = el("div", "role-flow-node");
      node.appendChild(el("span", "", nodes[i][0]));
      node.appendChild(el("b", "", nodes[i][1]));
      flow.appendChild(node);
      if(i < nodes.length - 1) flow.appendChild(el("div", "role-flow-arrow", "->"));
    }
    return flow;
  }

  function renderBeliefBar(){
    var from = (self._shownBelief == null) ? self.state.chinaBelief : self._shownBelief;
    var target = self.state.chinaBelief;

    var wrap = el("div", "role-belief");
    var label = el("div", "role-belief-label");
    label.appendChild(el("span", "", "China's belief the U.S. is serious"));
    var valNode = el("b", "", pct(from));
    label.appendChild(valNode);
    wrap.appendChild(label);

    var track = el("div", "role-belief-track");
    var fill = el("div", "role-belief-fill");
    fill.style.width = pct(from);
    track.appendChild(fill);
    var marker = el("div", "role-threshold");
    marker.style.left = pct(self.state.adaptationThreshold);
    track.appendChild(marker);
    wrap.appendChild(track);

    // labeled threshold tick so the "adapt line" is self-explanatory
    var tickRow = el("div", "role-adaptline");
    var tag = el("span", "role-adaptline-tag", "▲ adapt line " + pct(self.state.adaptationThreshold));
    tag.style.left = pct(self.state.adaptationThreshold);
    tickRow.appendChild(tag);
    wrap.appendChild(tickRow);

    var legend = el("div", "role-belief-legend");
    legend.appendChild(el("span", "", "← China waits"));
    legend.appendChild(el("span", "", "adapts →"));
    wrap.appendChild(legend);

    // animate the fill + count the number up from the previous value
    requestAnimationFrame(function(){ fill.style.width = pct(target); });
    tweenNumber(valNode, from, target);
    self._shownBelief = target;
    return wrap;
  }

  function renderDecision(){
    var building = self.role === "US" && self.state.signal === "K" && !self.state.revealed;
    var decision = el("section", "role-decision" + (building ? " role-decision-build" : ""));
    if(self.role === "US"){
      // US reaches the decision block only mid oversight sequence (signal K, not
      // yet revealed). No big heading here: the oversight strip carries its own
      // one-line instruction, keeping the advance button safely on screen.
      decision.appendChild(renderOversightSequence());
      return decision;
    }

    if(self.state.revealed){
      decision.appendChild(el("p", "role-small-label", "your decision"));
      decision.appendChild(el("h3", "", "You chose " + (self.state.chinaResponse === "A" ? "Adapt" : "Wait")));
      decision.appendChild(el("p", "role-observed", "Now Nature's card is revealed →"));
      return decision;
    }

    decision.appendChild(el("p", "role-small-label", "your call as China"));
    decision.appendChild(el("h3", "role-decision-q", "Adapt now, or wait?"));
    var responses = el("div", "role-response-buttons");
    responses.appendChild(button("role-main-button", "Adapt", function(){ chooseResponse("A"); }));
    responses.appendChild(button("role-main-button", "Wait", function(){ chooseResponse("W"); }));
    decision.appendChild(responses);
    return decision;
  }

  function renderOversightSequence(){
    var steps = oversightSteps();
    var wrap = el("div", "role-oversight-sequence");
    if(self.state.oversightStep < 3){
      wrap.appendChild(el("p", "role-hint role-oversight-hint", "Keep enforcing: complete all 3 steps to make slow burn credible."));
    }
    var row = el("div", "role-oversight-steps");
    for(var i=0; i<steps.length; i++){
      var stepClass = "role-oversight-step";
      if(self.state.oversightStep > i) stepClass += " done";
      if(self.state.oversightStep === i) stepClass += " current";
      var step = el("div", stepClass);
      step.appendChild(el("span", "", String(i + 1)));
      step.appendChild(el("b", "", steps[i].short || steps[i].label));
      row.appendChild(step);
    }
    wrap.appendChild(row);

    if(self.state.oversightStep < 3){
      var nextStep = steps[self.state.oversightStep];
      // the advance button is the action; the belief bar rises live as you click
      // through, so the per-step caption is dropped to keep the button on screen.
      wrap.appendChild(button("role-main-button role-oversight-button", nextStep.label, advanceOversight));
    }

    return wrap;
  }

  function renderWorldChips(){
    var row = el("div", "role-world-chips");
    var env = window.SignalingWorld && SignalingWorld.COST_ENVIRONMENTS[self.state.costKey];
    var round = (window.SignalingWorld && SignalingWorld.state.round) || 1;
    row.appendChild(el("span", "role-chip", "round " + round));
    row.appendChild(el("span", "role-chip", "world: " + (env ? env.label : self.state.costKey)));
    if(window.SignalingWorld){
      row.appendChild(el("span", "role-chip", "signal " + SignalingWorld.credibility(self.state.chinaBelief)));
    }
    return row;
  }

  function roomWhy(){
    return {
      E: "Room to move fell because export controls tightened compute access.",
      T: "Room to move held because a cheap promise barely changed access.",
      K: "Room to move narrowed slowly as oversight kept tightening."
    }[self.state.signal] || "Room to move reflects how much the signal squeezed Vietnam's access.";
  }

  function renderRoomMeter(room){
    var wrap = el("div", "role-room");
    var head = el("div", "role-room-head");
    head.appendChild(el("span", "", "Vietnam room to move"));
    head.appendChild(el("b", "", pct(room)));
    wrap.appendChild(head);
    var track = el("div", "role-room-track");
    var fill = el("div", "role-room-fill");
    fill.style.width = pct(room);
    track.appendChild(fill);
    wrap.appendChild(track);
    return wrap;
  }

  function renderTryButtons(){
    // single prominent retry; world-randomize is the small link by the knobs
    var row = el("div", "role-try-buttons");
    row.appendChild(button("role-try-button", "try another move", handleTryAnotherSignal));
    return row;
  }

  // Before the move resolves, the result panel shows a structured preview
  // (what's coming + a mini checklist) instead of one lonely centred line.
  function renderWaitingPreview(){
    var wrap = el("div", "role-preview");
    wrap.appendChild(el("p", "role-small-label", "up next"));

    if(self.role === "US"){
      wrap.appendChild(el("h3", "", "Waiting for China"));
      wrap.appendChild(el("p", "role-preview-body", "China's response will appear once the U.S. move becomes observable."));
      if(self.state.signal === "K"){
        var labels = ["Announce policy", "Audit providers", "Enforce repeatedly"];
        var list = el("div", "role-preview-steps");
        for(var i = 0; i < labels.length; i++){
          var cls = "role-preview-step";
          if(self.state.oversightStep > i) cls += " done";
          else if(self.state.oversightStep === i) cls += " current";
          var step = el("div", cls);
          step.appendChild(el("span", "role-preview-tick", self.state.oversightStep > i ? "✓" : String(i + 1)));
          step.appendChild(el("span", "", labels[i]));
          list.appendChild(step);
        }
        wrap.appendChild(list);
      }
      return wrap;
    }

    // China receiver: hidden type, decide to reveal
    wrap.appendChild(el("h3", "", "Reading the signal"));
    wrap.appendChild(el("p", "role-preview-body", "You see the move, not the U.S. type. Choose Adapt or Wait to reveal it."));
    var steps = [["Signal observed", "done"], ["Your call: Adapt or Wait", "current"], ["U.S. type revealed", "todo"]];
    var clist = el("div", "role-preview-steps");
    for(var j = 0; j < steps.length; j++){
      var cs = el("div", "role-preview-step " + steps[j][1]);
      cs.appendChild(el("span", "role-preview-tick", steps[j][1] === "done" ? "✓" : String(j + 1)));
      cs.appendChild(el("span", "", steps[j][0]));
      clist.appendChild(cs);
    }
    wrap.appendChild(clist);
    return wrap;
  }

  function renderReveal(){
    var reveal = el("section", "role-reveal");
    if(!self.state.revealed){
      reveal.appendChild(renderWaitingPreview());
      return reveal;
    }

    var names = get(self.spec, ["game_model", "players", "US", "hidden_type", "values"], {});
    var face = signalFace(self.state.signal);
    var eq = currentEquilibrium();

    reveal.appendChild(el("p", "role-small-label", self.role === "China" ? "reveal" : "result"));
    if(self.role === "China"){
      reveal.appendChild(el("h3", "", "U.S. was " + (names[self.state.usType] || self.state.usType)));
    }else{
      reveal.appendChild(el("h3", "", "China " + (self.state.chinaResponse === "A" ? "adapts" : "waits")));
    }
    reveal.appendChild(el("p", "role-outcome-line", self.role === "China" ? chinaVerdict() : outcomeLine()));

    // Equilibrium Lab verdict: separating / pooling / ambiguous.
    if(eq){
      var verdict = el("p", "role-eq-verdict role-eq-" + eq.key);
      verdict.appendChild(el("b", "", eq.title + ": "));
      verdict.appendChild(document.createTextNode(eq.text.replace(/^[^:]+:\s*/, "")));
      reveal.appendChild(verdict);
    }

    // The payoff: name the real-world policy they just played.
    var policy = el("div", "role-policy-reveal");
    policy.appendChild(el("span", "role-policy-kicker", "your move, in the real world →"));
    policy.appendChild(el("b", "", face.real));
    policy.appendChild(el("p", "", face.realBlurb));
    reveal.appendChild(policy);

    // Downstream readout: world chips + Vietnam's room to move.
    if(window.SignalingWorld){
      reveal.appendChild(renderWorldChips());
      var meters = SignalingWorld.downstreamMeters(buildRun(), SignalingWorld.vietnamLeverCount());
      reveal.appendChild(renderRoomMeter(meters.roomToMove));
      reveal.appendChild(el("p", "role-room-why", roomWhy()));
    }else{
      reveal.appendChild(el("p", "role-vietnam", "Vietnam: " + vietnamLine()));
    }

    reveal.appendChild(renderTryButtons());
    return reveal;
  }

  self.render = function(){
    self.dom.innerHTML = "";
    if(!self.spec){
      self.dom.appendChild(el("div", "scenario-loading", "loading..."));
      return;
    }

    var page = el("div", "role-game-page");
    var header = el("header", "role-game-header");
    var title = el("div");
    title.appendChild(el("p", "role-eyebrow", self.role === "US" ? "Play as the U.S. Sender" : "Play as China Receiver"));
    title.appendChild(el("h2", "", self.role === "US" ? "Choose a compute signal" : "Respond under uncertainty"));
    title.appendChild(el("p", "", self.role === "US" ? "You see the U.S. type. China updates and responds automatically." : "Nature hides the U.S. type. You see only the signal and belief."));
    header.appendChild(title);
    var actions = el("div", "scenario-header-buttons");
    actions.appendChild(button("scenario-reset", "roles", function(){ publish("slideshow/goto", ["signaling_role_choice"]); }));
    actions.appendChild(button("scenario-next", "next", function(){ publish("slideshow/next"); }));
    header.appendChild(actions);
    page.appendChild(header);

    var grid = el("div", "role-game-grid");

    var left = el("div", "role-left");
    left.appendChild(renderFlow());
    left.appendChild(renderKnobs());
    grid.appendChild(left);

    var center = el("div", "role-game-center");
    var building = (self.role === "US" && self.state.signal === "K" && !self.state.revealed); // oversight mini-game (U.S. sender only)
    if(self.role === "US"){
      // the "China updates instantly" hint is wrong during the slow-burn build,
      // where credibility accrues step by step, so hide it then to save space too.
      if(!building) center.appendChild(el("p", "role-hint", "Click a signal. China updates instantly."));
      center.appendChild(renderSignalSwitch());
    }
    // China's instruction lives in the decision block ("Adapt now, or wait?")
    // and the right-side "Reading the signal" checklist, so no top hint here.
    if(self.state.signal){
      center.appendChild(renderBeliefBar());
      if(!building) center.appendChild(renderBeliefExplainer());
    }
    // US: the switch + belief + reveal already report the move, so the decision block
    // only appears for the K oversight sequence. China always decides here (Adapt/Wait).
    if(self.role === "China" || building){
      center.appendChild(renderDecision());
    }
    grid.appendChild(center);

    grid.appendChild(renderReveal());
    page.appendChild(grid);
    self.dom.appendChild(page);
  };

  self.loadSpec = function(){
    fetch(self.specPath).then(function(response){
      if(!response.ok) throw new Error("Could not load " + self.specPath);
      return response.json();
    }).then(function(spec){
      self.spec = spec;
      reset();
    }).catch(function(err){
      console.error(err);
      self.dom.innerHTML = "";
      self.dom.appendChild(el("div", "scenario-loading", "Could not load role game spec."));
    });
  };

  listen(self, "signalingRoleGame/reset", reset);

  self.add = function(){ _add(self); };
  self.remove = function(){
    unlisten(self);
    _remove(self);
  };

  self.render();
  self.loadSpec();
}

window.SignalingRoleGame = SignalingRoleGame;

function SignalingGovernanceEnding(config){

  var self = this;
  self.id = config.id || "signaling_governance_ending";
  self.selected = 0;

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_governance_ending";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  var takeaways = [
    {
      title: "More than technical rules", symbol: "1",
      inRun: "Your compute policy did more than set a rule. It told China how serious the U.S. was.",
      why: "Compute governance also communicates resolve, risk, and commitment, not only technical limits."
    },
    {
      title: "Policies are signals", symbol: "2",
      inRun: "China read your move as information about U.S. resolve, then updated its belief.",
      why: "Export controls, thresholds, and provider oversight change what others believe, not just what they can do."
    },
    {
      title: "Credibility can bite back", symbol: "3",
      inRun: "China interpreted the signal as durable enough that waiting became risky.",
      why: "A credible policy can accelerate substitution rather than deter it."
    },
    {
      title: "Vietnam keeps room to move", symbol: "4",
      inRun: "Vietnam could not choose the U.S. signal or China's response. It inherited the shock, then looked for room to maneuver.",
      why: "Flexible commitment is not neutrality. It means staying credible while avoiding lock-in to one supplier, one standard, or one model ecosystem."
    }
  ];

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, text, onClick){
    var node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function signalName(signalId){
    var names = {
      E: "export controls",
      T: "thresholds",
      K: "provider oversight"
    };
    return names[signalId] || "a compute signal";
  }

  function responseName(response){
    return response === "A" ? "adapted" : (response === "W" ? "waited" : "responded");
  }

  // one-line summary of the player's previous run, for the debrief strip
  function runSummary(){
    var last = window.signalingLastState;
    if(last && last.signal){
      return "In your run: China " + responseName(last.chinaResponse) + " after " + signalName(last.signal) + ".";
    }
    return "Play a round first, then this debrief reads through your own outcome.";
  }

  self.render = function(){
    self.dom.innerHTML = "";
    var t = takeaways[self.selected];
    var page = el("div", "ending-page");

    // ---- top: eyebrow, title, debrief subtitle, run-summary strip ----
    var header = el("header", "ending-header");
    var title = el("div", "ending-title");
    title.appendChild(el("p", "role-eyebrow", "What this means for compute governance today"));
    title.appendChild(el("h2", "", "Signals shape the game"));
    title.appendChild(el("p", "ending-sub", "The round is over. Read each lesson through what just happened in your game."));
    header.appendChild(title);
    var actions = el("div", "ending-actions");
    actions.appendChild(button("ending-back", "roles", function(){ publish("slideshow/goto", ["signaling_role_choice"]); }));
    actions.appendChild(button("ending-next", "next →", function(){ publish("slideshow/next"); }));
    header.appendChild(actions);
    page.appendChild(header);

    page.appendChild(el("p", "ending-run", runSummary()));

    // ---- body: lesson tabs (left) + explanation panel (right) ----
    var body = el("div", "ending-body");

    var tabs = el("div", "ending-tabs");
    for(var i=0; i<takeaways.length; i++){
      (function(index){
        var item = takeaways[index];
        var tab = button("ending-tab" + (self.selected === index ? " selected" : ""), "", function(){
          self.selected = index;
          self.render();
        });
        tab.appendChild(el("span", "ending-tab-num", item.symbol));
        var tx = el("div", "ending-tab-text");
        tx.appendChild(el("b", "", item.title));
        tab.appendChild(tx);
        if(self.selected === index) tab.appendChild(el("span", "ending-tab-flag", "selected lesson"));
        tabs.appendChild(tab);
      })(i);
    }
    body.appendChild(tabs);

    var panel = el("section", "ending-panel");
    panel.appendChild(el("p", "role-small-label", "takeaway"));
    panel.appendChild(el("h3", "", t.title));

    var s1 = el("div", "ending-section");
    s1.appendChild(el("p", "ending-section-label", "In this run"));
    s1.appendChild(el("p", "ending-section-text", t.inRun));
    panel.appendChild(s1);

    var s2 = el("div", "ending-section");
    s2.appendChild(el("p", "ending-section-label", "Why it matters"));
    s2.appendChild(el("p", "ending-section-text", t.why));
    panel.appendChild(s2);

    body.appendChild(panel);
    page.appendChild(body);

    self.dom.appendChild(page);
  };

  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };

  self.render();
}

window.SignalingGovernanceEnding = SignalingGovernanceEnding;

/*
  SignalingTypology - the cost taxonomy as a game-explanation scene.
  Same 2x2 theory (Quek), but as hand-drawn cards plus a "how your next moves
  map" chip strip that primes the upcoming "Pick your move" choice.
*/
function SignalingTypology(config){

  var self = this;
  self.id = config.id || "signaling_typology";

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_typology";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  var COLS = ["Non-contingent cost", "Contingent cost"];
  var ROWS = ["Ex ante", "Ex post"];
  // order: ex ante / non-contingent, ex ante / contingent, ex post / non-contingent, ex post / contingent
  var cards = [
    { title: "Sunk costs",        desc: "Paid upfront and not recovered, whatever the receiver does." },
    { title: "Reducible costs",   desc: "Paid upfront, but partly offset if the sender follows through." },
    { title: "Installment costs", desc: "Future costs paid over time, whatever the receiver does." },
    { title: "Tied-hands costs",  desc: "Future costs paid only if the sender backs down." }
  ];
  // how the next slide's three moves map onto these cost types
  var mappings = [
    { move: "Big upfront sacrifice", tags: ["sunk", "tied-hands"] },
    { move: "Cheap public promise",  tags: ["weak tied-hands"] },
    { move: "Repeated enforcement",  tags: ["installment", "reducible"] }
  ];

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }
  function button(className, text, onClick){
    var node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function card(i){
    var c = el("div", "ty-card");
    c.appendChild(el("b", "ty-card-title", cards[i].title));
    c.appendChild(el("p", "ty-card-desc", cards[i].desc));
    return c;
  }

  function chip(m){
    var c = el("div", "ty-chip");
    c.appendChild(el("span", "ty-chip-move", m.move));
    c.appendChild(el("span", "ty-chip-arrow", "→"));
    var tags = el("span", "ty-chip-tags");
    for(var i = 0; i < m.tags.length; i++){
      tags.appendChild(el("span", "ty-tag", m.tags[i]));
    }
    c.appendChild(tags);
    return c;
  }

  self.render = function(){
    self.dom.innerHTML = "";
    var page = el("div", "ty-page");

    var head = el("div", "ty-head");
    head.appendChild(el("h2", "ty-title", "Why some signals are harder to fake"));
    head.appendChild(el("p", "ty-sub", "China cannot see resolve directly. It sees what the U.S. is willing to pay."));
    page.appendChild(head);

    var matrix = el("div", "ty-matrix");
    matrix.appendChild(el("div", "ty-corner", "cost timing"));
    matrix.appendChild(el("div", "ty-colhead", COLS[0]));
    matrix.appendChild(el("div", "ty-colhead", COLS[1]));
    matrix.appendChild(el("div", "ty-rowhead", ROWS[0]));
    matrix.appendChild(card(0));
    matrix.appendChild(card(1));
    matrix.appendChild(el("div", "ty-rowhead", ROWS[1]));
    matrix.appendChild(card(2));
    matrix.appendChild(card(3));
    page.appendChild(matrix);

    var map = el("div", "ty-map");
    map.appendChild(el("p", "ty-map-label", "how your next moves map"));
    var chips = el("div", "ty-chips");
    for(var i = 0; i < mappings.length; i++){ chips.appendChild(chip(mappings[i])); }
    map.appendChild(chips);
    page.appendChild(map);

    var cta = el("div", "ty-cta-row");
    cta.appendChild(button("ty-cta", "play it out →", function(){ publish("slideshow/next"); }));
    page.appendChild(cta);

    self.dom.appendChild(page);
  };

  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };

  self.render();
}

window.SignalingTypology = SignalingTypology;

/*
  SignalingActors - orientation scene introducing the three players as cards,
  with a flow strip and the "credibility != control" twist. Replaces the old
  paragraph-heavy model slide.
*/
function SignalingActors(config){

  var self = this;
  self.id = config.id || "signaling_game";

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_actors";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  var actors = [
    { name: "U.S.",    role: "The sender",             copy: "Knows its resolve, chooses a visible compute signal, and bears the cost of sending it." },
    { name: "China",   role: "The receiver",           copy: "Cannot observe U.S. resolve directly. It reads the signal, updates μ(H|s), then adapts or waits." },
    { name: "Vietnam", role: "The downstream audience", copy: "Does not choose the U.S. signal or China's response. It inherits the shock and looks for room to maneuver." }
  ];
  var flow = ["U.S. sends signal", "China updates", "Vietnam keeps room to move"];

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }
  function button(className, text, onClick){
    var node = el("button", className, text);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  self.render = function(){
    self.dom.innerHTML = "";
    var page = el("div", "ac-page");

    var head = el("div", "ac-head");
    head.appendChild(el("h2", "ac-title", "Three actors, one compute game"));
    head.appendChild(el("p", "ac-sub", "Compute controls target China, but their effects travel through chips, cloud access, and standards."));
    page.appendChild(head);

    var cards = el("div", "ac-cards");
    for(var i = 0; i < actors.length; i++){
      var c = el("div", "ac-card");
      c.appendChild(el("p", "ac-card-name", actors[i].name));
      c.appendChild(el("p", "ac-card-role", actors[i].role));
      c.appendChild(el("p", "ac-card-copy", actors[i].copy));
      cards.appendChild(c);
    }
    page.appendChild(cards);

    var flowRow = el("div", "ac-flow");
    for(var f = 0; f < flow.length; f++){
      flowRow.appendChild(el("span", "ac-flow-node", flow[f]));
      if(f < flow.length - 1) flowRow.appendChild(el("span", "ac-flow-arrow", "→"));
    }
    page.appendChild(flowRow);

    var twist = el("div", "ac-twist");
    twist.appendChild(el("p", "ac-twist-main", "The twist: credibility ≠ control."));
    twist.appendChild(el("p", "ac-twist-sub", "A signal can be credible to China while narrowing Vietnam's options."));
    page.appendChild(twist);

    var cta = el("div", "ac-cta-row");
    cta.appendChild(button("ac-cta", "next →", function(){ publish("slideshow/next"); }));
    page.appendChild(cta);

    self.dom.appendChild(page);
  };

  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };

  self.render();
}

window.SignalingActors = SignalingActors;

function SignalingVietnam(config){

  var self = this;
  self.id = config.id || "signaling_vietnam";
  self.scene = config.scene || 1;          // 1 observe · 2 build · 3 consequence
  self.warn = false;                        // transient "max 2 / pick one" hint

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_vietnam signaling_vietnam_s" + self.scene;
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = (config.width || 960) + "px";
  self.dom.style.height = (config.height || 540) + "px";

  // Strategic pressure on Vietnam. Each lever (below) pushes these up or down.
  var pressures = [
    { label: "Compute dependence",  base: 0.82 },
    { label: "Energy strain",       base: 0.70 },
    { label: "Standards lock-in",   base: 0.60 },
    { label: "Governance overload", base: 0.76 }
  ];

  // Vietnam's flexible-commitment levers, now a playable choice with tradeoffs.
  //   effects: pressure index -> delta (negative eases, positive strains)
  //   consequence: one-line "what this costs you" feedback
  //   chips: {t: label, k: good|cost} tradeoff tags shown when selected
  //   short:   one-line card description (scene 2)
  //   cost:    policy capacity spent if chosen
  //   effects: pressure index -> delta (negative eases, positive strains)
  //   chips:   {t, k:good|cost} tradeoff tags
  var levers = [
    {
      title: "Diversify compute access", relieves: 0, cost: 0.34,
      short: "Spread procurement, cloud & infrastructure across suppliers.",
      effects: { 0: -0.40, 3: +0.10 },
      chips: [ {t:"dependence ↓", k:"good"}, {t:"overload ↑", k:"cost"} ]
    },
    {
      title: "Build modular infrastructure", relieves: 1, cost: 0.30,
      short: "Smaller sector-specific clusters, not frontier-scale compute.",
      effects: { 1: -0.34, 0: -0.06 },
      chips: [ {t:"energy ↓", k:"good"}, {t:"resilience ↑", k:"good"} ]
    },
    {
      title: "Keep model options open", relieves: 2, cost: 0.26,
      short: "Mix proprietary, open-weight & domestic models.",
      effects: { 2: -0.32, 3: +0.08 },
      chips: [ {t:"lock-in ↓", k:"good"}, {t:"coordination ↑", k:"cost"} ]
    },
    {
      title: "Regulate in stages", relieves: 3, cost: 0.28,
      short: "Enforceable rules first, expand with institutional capacity.",
      effects: { 3: -0.40, 0: -0.05 },
      chips: [ {t:"overload ↓", k:"good"}, {t:"compute relief slow", k:"cost"} ]
    }
  ];

  var SYNTHESIS = "Flexible commitment is not neutrality. Vietnam stays credible, but avoids locking itself into one supplier, one standard, or one model ecosystem.";

  // Faint river-delta / grid + server-node / cable motif behind the board.
  var BG_SVG =
    '<svg viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      '<g fill="none" stroke="#315f7c" stroke-width="1.4" opacity="0.45">' +
        '<path d="M-20 150 C 220 120 360 230 540 220 C 720 210 860 300 1000 280"/>' +
        '<path d="M-20 150 C 200 200 320 320 470 360 C 600 396 760 430 1000 430"/>' +
        '<path d="M540 220 C 600 280 640 360 700 540"/>' +
        '<path d="M470 360 C 520 420 540 480 560 540"/>' +
      '</g>' +
      '<g fill="#315f7c" opacity="0.45">' +
        '<circle cx="120" cy="150" r="4"/><circle cx="360" cy="220" r="4"/>' +
        '<circle cx="540" cy="220" r="4"/><circle cx="600" cy="360" r="4"/>' +
        '<circle cx="470" cy="360" r="4"/><circle cx="840" cy="280" r="4"/>' +
      '</g>' +
    '</svg>';

  function el(tag, className, text){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, onClick){
    var node = el("button", className);
    node.type = "button";
    node.addEventListener("click", onClick);
    return node;
  }

  function zoneLabel(text){
    return el("p", "vh-zone-label", text);
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function pct(v){ return Math.round(v * 100) + "%"; }

  // ---- selection: shared with SignalingWorld, capped at 2 moves ----
  function selStore(){
    if(window.SignalingWorld) return SignalingWorld.state.vietnamLevers;
    if(!window._vietSel) window._vietSel = {};
    return window._vietSel;
  }
  function isSel(i){ return !!selStore()[i]; }
  function selCount(){ var s = selStore(), n = 0; for(var k = 0; k < levers.length; k++){ if(s[k]) n++; } return n; }
  function selIndices(){ var s = selStore(), a = []; for(var i = 0; i < levers.length; i++){ if(s[i]) a.push(i); } return a; }
  function toggle(i){ var s = selStore(); if(s[i]){ delete s[i]; } else if(selCount() < 2){ s[i] = true; } }

  // each chosen move spends policy capacity (you cannot do everything at once)
  function capacityLeft(){
    var cap = 1, idx = selIndices();
    for(var j = 0; j < idx.length; j++){ cap -= levers[idx[j]].cost; }
    return clamp(cap, 0, 1);
  }
  // a pressure after the chosen moves apply their effects
  function pressureAfter(pi){
    var lvl = pressures[pi].base, idx = selIndices();
    for(var j = 0; j < idx.length; j++){
      var e = levers[idx[j]].effects[pi]; if(e != null) lvl += e;
    }
    return clamp(lvl, 0.05, 0.98);
  }
  function roomToMove(){
    if(window.SignalingWorld) return SignalingWorld.downstreamMeters(SignalingWorld.state.lastRun, selCount()).roomToMove;
    return clamp(0.45 + selCount() * 0.09, 0.10, 0.95);
  }

  // ---- shared UI bits ----
  function miniMeter(label, value, extraClass){
    var wrap = el("div", "vh-mini " + extraClass);
    var head = el("div", "vh-mini-head");
    head.appendChild(el("span", "", label));
    head.appendChild(el("b", "", pct(value)));
    wrap.appendChild(head);
    var track = el("div", "vh-mini-track");
    var fill = el("div", "vh-mini-fill");
    fill.style.width = pct(value);
    track.appendChild(fill);
    wrap.appendChild(track);
    return wrap;
  }
  // strategic-pressure meters (base, or after the chosen moves)
  function buildMeters(showAfter){
    var wrap = el("div", "vo-meters");
    for(var p = 0; p < pressures.length; p++){
      (function(pi){
        var base = pressures[pi].base;
        var level = showAfter ? pressureAfter(pi) : base;
        var managed = level < base - 0.02, raised = level > base + 0.02;
        var cls = "vh-meter" + (managed ? " eased" : "") + (raised ? " raised" : "");
        var row = el("div", cls);
        var head = el("div", "vh-meter-head");
        head.appendChild(el("span", "vh-meter-name", pressures[pi].label));
        head.appendChild(el("span", "vh-meter-tag", showAfter ? (managed ? "managed" : (raised ? "strained" : "")) : ""));
        row.appendChild(head);
        var track = el("div", "vh-meter-track");
        var fill = el("div", "vh-meter-fill"); fill.style.width = pct(level);
        track.appendChild(fill); row.appendChild(track);
        wrap.appendChild(row);
      })(p);
    }
    return wrap;
  }
  function ctaButton(label, fn){ var b = button("vh-cta", fn); b.textContent = label; return b; }
  function navButtons(opts){
    var a = el("div", "scenario-header-buttons");
    if(opts.backLabel){ var bk = button("scenario-reset", opts.back); bk.textContent = opts.backLabel; a.appendChild(bk); }
    if(opts.nextLabel){ var nx = button("scenario-next", opts.next); nx.textContent = opts.nextLabel; a.appendChild(nx); }
    return a;
  }
  // page scaffold: parchment bg + header (eyebrow / title / sub) shared by all scenes
  function shell(eyebrow, h2text, subtext, headerButtons){
    self.dom.innerHTML = "";
    var page = el("div", "vh-page");
    var bg = el("div", "vh-bg"); bg.innerHTML = BG_SVG; page.appendChild(bg);
    var inner = el("div", "vh-inner");
    var header = el("header", "vh-header");
    var title = el("div", "vh-title");
    title.appendChild(el("p", "role-eyebrow", eyebrow));
    title.appendChild(el("h2", "", h2text));
    if(subtext) title.appendChild(el("p", "vh-sub", subtext));
    header.appendChild(title);
    if(headerButtons) header.appendChild(headerButtons);
    inner.appendChild(header);
    page.appendChild(inner);
    self.dom.appendChild(page);
    return inner;
  }

  // ---- scene 1: observe the shock ----
  function obItem(label, val){
    var d = el("div", "vo-ob");
    d.appendChild(el("span", "vo-ob-label", label));
    d.appendChild(el("b", "", val));
    return d;
  }
  // highlighted event line: ties the run above to the spillover below
  function runEventLine(run){
    if(!run || !run.signalReal) return "Play a U.S.-China round first, then Vietnam inherits the spillover here.";
    var sig = run.signalReal;
    if(run.response === "A") return "In your run: " + sig + " made China adapt. Vietnam now faces the spillover.";
    if(run.response === "W") return "In your run: " + sig + " left China waiting. Vietnam still inherits the pressure.";
    return "In your run: " + sig + " went out. Vietnam now faces the spillover.";
  }

  function renderObserve(){
    var inner = shell("Play as Vietnam · scene 1 of 3", "Vietnam inherits the shock",
      "A middle power cannot choose the great-power signal. It can choose how much room to preserve.", null);

    var run = window.SignalingWorld && SignalingWorld.state.lastRun;
    var strip = el("div", "vo-observed");
    strip.appendChild(obItem("U.S. signal", run && run.signalReal ? run.signalReal : "play a round first"));
    strip.appendChild(el("div", "vo-arrow", "→"));
    strip.appendChild(obItem("China's response", run ? (run.response === "A" ? "Adapts" : (run.response === "W" ? "Waits" : "not yet")) : "not yet"));
    inner.appendChild(strip);

    inner.appendChild(el("p", "vo-runline vo-event", runEventLine(run)));

    // spillover cue: the pressure bars below are downstream consequences of the run
    var spill = el("div", "vo-spillover");
    spill.appendChild(el("span", "vo-spillover-line"));
    spill.appendChild(el("span", "vo-spillover-tag", "↓ spillover"));
    spill.appendChild(el("span", "vo-spillover-line"));
    inner.appendChild(spill);

    inner.appendChild(el("p", "vh-zone-label", "What changed for Vietnam?"));
    inner.appendChild(buildMeters(false));

    inner.appendChild(el("p", "vo-bridge", "Vietnam's move is not to control the signal.\nIt is to preserve room to move."));

    var row = el("div", "vh-cta-row");
    row.appendChild(ctaButton("Build Vietnam's strategy  →", function(){ publish("slideshow/next"); }));
    inner.appendChild(row);
  }

  // ---- scene 2: build the strategy (up to 2 moves) ----
  function renderBuild(){
    var inner = shell("Play as Vietnam · scene 2 of 3", "Build Vietnam's AI strategy",
      "Pick up to 2 moves. Each eases some pressures, strains others, and spends policy capacity.",
      navButtons({ backLabel: "back", back: function(){ publish("slideshow/previous"); } }));

    inner.appendChild(el("p", "vh-hint", "Click a card to add it to your strategy, then simulate."));

    var grid = el("div", "vb-grid");
    var cards = el("div", "vb-cards");
    for(var i = 0; i < levers.length; i++){
      (function(idx){
        var lv = levers[idx];
        var card = button("vb-card" + (isSel(idx) ? " selected" : ""), function(){
          if(!isSel(idx) && selCount() >= 2){ self.warn = true; }
          else { self.warn = false; toggle(idx); }
          self.render();
        });
        card.appendChild(el("b", "vb-card-title", lv.title));
        card.appendChild(el("p", "vb-card-desc", lv.short));
        var foot = el("div", "vb-card-foot");
        var chips = el("div", "vb-card-chips");
        for(var c = 0; c < lv.chips.length; c++){
          chips.appendChild(el("span", "vh-chip vh-chip-" + lv.chips[c].k, lv.chips[c].t));
        }
        foot.appendChild(chips);
        foot.appendChild(el("span", "vb-card-cost", "capacity −" + Math.round(lv.cost * 100) + "%"));
        card.appendChild(foot);
        cards.appendChild(card);
      })(i);
    }
    grid.appendChild(cards);

    var rail = el("div", "vb-rail");
    rail.appendChild(el("p", "vh-zone-label", "Selected strategy"));
    var tray = el("div", "vb-tray");
    var idx = selIndices();
    if(idx.length === 0){
      tray.appendChild(el("p", "vb-tray-empty", "No move chosen yet."));
    }else{
      for(var t = 0; t < idx.length; t++){
        tray.appendChild(el("span", "vb-tray-chip", levers[idx[t]].title));
      }
    }
    rail.appendChild(tray);
    if(self.warn) rail.appendChild(el("p", "vb-warn", "Pick another card, or click a selected move to swap."));
    rail.appendChild(miniMeter("Policy capacity left", capacityLeft(), "vh-capacity"));
    if(selCount() > 0) rail.appendChild(el("p", "vb-feedback", "Capacity dropped because each move spends policy resources."));
    var sim = ctaButton("Simulate strategy  →", function(){
      if(selCount() > 0){ publish("slideshow/next"); }
      else { self.warn = true; self.render(); }
    });
    if(selCount() === 0) sim.className += " disabled";
    rail.appendChild(sim);
    grid.appendChild(rail);

    inner.appendChild(grid);
  }

  // ---- scene 3: consequence / flexible commitment ----
  function narrative(gainIdx){
    var idx = selIndices();
    if(idx.length === 0) return "No move was chosen, so Vietnam stays maximally exposed. " + SYNTHESIS;
    var parts = [];
    for(var i = 0; i < idx.length; i++){ parts.push(levers[idx[i]].title.toLowerCase()); }
    var gain = gainIdx >= 0 ? pressures[gainIdx].label.toLowerCase() : "its biggest pressure";
    return "By choosing " + parts.join(" + ") + ", Vietnam eases " + gain +
      " without locking itself into one supplier, one standard, or one model ecosystem. " + SYNTHESIS;
  }
  function renderConsequence(){
    var inner = shell("Play as Vietnam · scene 3 of 3", "Flexible commitment is not neutrality", null,
      navButtons({
        backLabel: "adjust", back: function(){ publish("slideshow/previous"); },
        nextLabel: "next", next: function(){ publish("slideshow/next"); }
      }));

    var stats = el("div", "vc-stats");
    stats.appendChild(miniMeter("Vietnam room to move", roomToMove(), "vh-room"));
    stats.appendChild(miniMeter("Policy capacity left", capacityLeft(), "vh-capacity"));
    inner.appendChild(stats);

    inner.appendChild(el("p", "vh-zone-label", "Strategic pressure · before → after"));
    var bars = el("div", "vc-bars");
    var gainIdx = -1, gainAmt = 0, costIdx = -1, costAmt = 0;
    for(var p = 0; p < pressures.length; p++){
      var base = pressures[p].base, after = pressureAfter(p), d = base - after;
      if(d > gainAmt){ gainAmt = d; gainIdx = p; }
      if(-d > costAmt){ costAmt = -d; costIdx = p; }
      (function(pi, b, a){
        var row = el("div", "vc-bar");
        var lab = el("div", "vc-bar-label");
        lab.appendChild(el("span", "", pressures[pi].label));
        lab.appendChild(el("b", "", Math.round(b * 100) + "% → " + Math.round(a * 100) + "%"));
        row.appendChild(lab);
        var track = el("div", "vc-track");
        var ghost = el("div", "vc-ghost"); ghost.style.width = pct(b);
        var fill = el("div", "vc-fill" + (a > b + 0.02 ? " up" : "")); fill.style.width = pct(a);
        track.appendChild(ghost); track.appendChild(fill);
        row.appendChild(track);
        bars.appendChild(row);
      })(p, base, after);
    }
    inner.appendChild(bars);

    var sum = el("div", "vc-summary-chips");
    if(gainIdx >= 0 && gainAmt > 0.01){
      sum.appendChild(el("span", "vh-chip vh-chip-good", "strongest gain: " + pressures[gainIdx].label + " ↓" + Math.round(gainAmt * 100) + "%"));
    }
    if(costIdx >= 0 && costAmt > 0.02){
      sum.appendChild(el("span", "vh-chip vh-chip-cost", "key tradeoff: " + pressures[costIdx].label + " ↑" + Math.round(costAmt * 100) + "%"));
    }else{
      sum.appendChild(el("span", "vh-chip vh-chip-cost", "key tradeoff: policy capacity spent " + Math.round((1 - capacityLeft()) * 100) + "%"));
    }
    inner.appendChild(sum);

    inner.appendChild(el("p", "vc-narrative", narrative(gainIdx)));
  }

  self.render = function(){
    if(self.scene === 2){ renderBuild(); }
    else if(self.scene === 3){ renderConsequence(); }
    else { renderObserve(); }
  };

  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };

  self.render();
}

window.SignalingVietnam = SignalingVietnam;
// alias: earlier slides referenced the single-scene hedge component
window.SignalingVietnamHedge = SignalingVietnam;
