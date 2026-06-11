/*
  Signals of Compute Power
  Round-based explorable signaling game driven by the JSON spec.
*/

function Signaling(config){

  var self = this;
  self.id = config.id || "signaling";

  var WIDTH = config.width || 900;
  var HEIGHT = config.height || 500;
  var SPEC_PATH = config.specPath || "signals_of_compute_power_copilot_spec_v2.json";

  self.dom = document.createElement("div");
  self.dom.className = "object signaling_explorable";
  self.dom.style.left = (config.x || 0) + "px";
  self.dom.style.top = (config.y || 0) + "px";
  self.dom.style.width = WIDTH + "px";
  self.dom.style.height = HEIGHT + "px";

  var fallbackSpec = {
    project: {
      title: "Signals of Compute Power",
      subtitle: "An interactive signaling game of U.S.-China compute governance and Vietnam's policy path"
    },
    game_model: {
      players: {
        US: {
          hidden_type: {
            values: { H: "High Resolve", L: "Low Resolve" },
            teaching_copy: {
              H: "A High Resolve United States is willing to sustain significant economic, diplomatic, and administrative costs.",
              L: "A Low Resolve United States prefers lower-cost or more temporary restrictions."
            }
          }
        },
        China: {
          responses: {
            A: { label: "Adapt", description: "Domestic substitution, sovereign compute expansion, efficiency gains, or alternative procurement." },
            W: { label: "Wait", description: "Delay adjustment while observing whether U.S. policy persists, enforcement tightens, or loopholes remain." }
          },
          adaptation_threshold_copy: "China adapts when belief in durable U.S. resolve is high enough."
        }
      },
      signals: {
        E: {
          label: "Export Controls", short_label: "Controls", cost_level: "High", visibility: "High",
          reversibility: "Low to moderate", type_gap: "Largest",
          dominant_cost_mechanism: ["Sunk cost", "Tying hands"],
          description: "Restricts advanced AI chips, semiconductor equipment, and related technologies.",
          belief_effect: "Strong upward update that the U.S. is High Resolve.",
          risk: "May provoke faster Chinese adaptation if the signal looks durable.",
          ui_copy: "A costly and visible restriction. Harder for Low Resolve types to imitate."
        },
        T: {
          label: "Training Compute Thresholds", short_label: "Thresholds", cost_level: "Low to moderate", visibility: "Medium",
          reversibility: "Moderate", type_gap: "Smallest",
          dominant_cost_mechanism: ["Tying hands", "Recalibration cost"],
          description: "Creates measurable compute triggers for reporting, evaluation, or oversight.",
          belief_effect: "Weak to moderate update. Both High and Low Resolve types can announce thresholds.",
          risk: "May become a pooling signal if it is easy to announce but weakly enforced.",
          ui_copy: "A measurable benchmark, but easier for both types to adopt."
        },
        K: {
          label: "Provider Oversight", short_label: "Oversight", cost_level: "Moderate", visibility: "Medium",
          reversibility: "Moderate", type_gap: "Intermediate",
          dominant_cost_mechanism: ["Installment cost", "Reducible cost"],
          description: "Applies KYC, audits, cloud enforcement, and data-center monitoring to compute providers.",
          belief_effect: "Moderate update at first. Credibility grows if enforcement persists over time.",
          risk: "May look weak initially unless repeated compliance and enforcement are visible.",
          ui_copy: "An institutional signal whose credibility accumulates through repeated enforcement."
        }
      },
      belief_update: {
        posterior_symbol: "mu(H|s)",
        bayes_formula: "mu(H|s) = [Pr(s|H) * p] / [Pr(s|H) * p + Pr(s|L) * (1-p)]",
        plain_language: "China updates its belief that the U.S. is High Resolve after seeing the signal."
      },
      adaptation_threshold: {
        condition: "China adapts if mu(H|s) >= mu_star",
        advanced_formula: "mu_star_s = (q_s + l_s) / (g_s + d_s + l_s)",
        plain_language: "China adapts when belief in durable U.S. resolve is high enough, adaptation is affordable enough, or waiting becomes too risky."
      }
    },
    initial_game_state: {
      usType: "H",
      teachingMode: false,
      priorHighResolve: 0.5,
      signal: null,
      chinaBelief: 0.5,
      chinaResponse: null,
      adaptationThreshold: 0.6,
      adaptationCapacity: 0.5,
      loopholes: 0.3,
      noise: 0.2,
      enforcementPersistence: 0.5,
      vietnamDependency: 0.6,
      vietnamGovernanceCapacity: 0.4,
      advancedMode: false,
      outcomeType: null,
      currentRound: 1,
      roundHistory: [],
      autoResponse: true
    },
    sliders: [
      { id:"priorHighResolve", label:"Prior belief that U.S. is High Resolve", min:0, max:1, step:0.01, default:0.5 },
      { id:"adaptationCapacity", label:"China adaptation capacity", min:0, max:1, step:0.01, default:0.5 },
      { id:"loopholes", label:"Loophole availability", min:0, max:1, step:0.01, default:0.3 },
      { id:"noise", label:"Signal noise", min:0, max:1, step:0.01, default:0.2 },
      { id:"enforcementPersistence", label:"Enforcement persistence", min:0, max:1, step:0.01, default:0.5 },
      { id:"vietnamDependency", label:"Vietnam dependency on one supplier", min:0, max:1, step:0.01, default:0.6 },
      { id:"vietnamGovernanceCapacity", label:"Vietnam governance capacity", min:0, max:1, step:0.01, default:0.4 }
    ],
    suggested_logic: {
      computeSignalLikelihoods: {
        E: { Pr_s_given_H: 0.8, Pr_s_given_L: 0.2 },
        K: { Pr_s_given_H: 0.6, Pr_s_given_L: 0.4 },
        T: { Pr_s_given_H: 0.5, Pr_s_given_L: 0.45 }
      }
    },
    outcomes: {
      adaptation_paradox: {
        title: "Credible signal, accelerated adaptation",
        copy: "The signal successfully convinces China that the U.S. is likely High Resolve. But because waiting now looks risky, China adapts faster.",
        lesson: "Credibility and coercive effectiveness are different."
      },
      credible_deterrence_or_delay: {
        title: "Credible signal, China waits",
        copy: "China sees the U.S. signal as credible, but adaptation is still too costly or the option value of waiting remains high.",
        lesson: "A credible signal can preserve lead time when adaptation capacity is low."
      },
      pooling_or_weak_signal: {
        title: "Pooling or weak signal",
        copy: "The signal is easy for both High and Low Resolve types to send. China remains uncertain and belief stays near the prior.",
        lesson: "A cheap or reversible policy may regulate activity without strongly revealing resolve."
      },
      institutional_persistence_signal: {
        title: "Institutional persistence signal",
        copy: "Provider oversight may not look dramatic at first, but repeated KYC, audits, and enforcement can reveal resolve over time.",
        lesson: "Some credibility accumulates through persistence rather than one-time sacrifice."
      },
      mixed_signal: {
        title: "Mixed signal",
        copy: "The signal changes beliefs, but not enough to generate a clean separating or pooling result.",
        lesson: "Real compute governance often combines material restriction, symbolic communication, loopholes, and noise."
      }
    },
    vietnam_implications: {
      E: {
        title: "If export controls dominate",
        interpretation: "Frontier compute access is politically conditional and can be restricted through chokepoints.",
        recommendation: "Diversify compute access, avoid single-supplier dependence, and preserve strategic room for maneuver."
      },
      T: {
        title: "If threshold governance dominates",
        interpretation: "AI governance increasingly depends on measurable indicators such as compute scale, reporting triggers, and evaluation thresholds.",
        recommendation: "Build domestic capacity for compute classification, standards alignment, and risk-tiered reporting."
      },
      K: {
        title: "If provider oversight dominates",
        interpretation: "Cloud and data-center access becomes compliance-mediated through providers, audits, KYC, and logs.",
        recommendation: "Develop trusted intermediary governance through licensed cloud providers, data centers, and sectoral service providers."
      },
      general: {
        title: "Flexible commitment",
        interpretation: "Vietnam should commit to credible AI governance while preserving flexibility across suppliers, standards, and model ecosystems.",
        recommendation: "Sequence reforms according to domestic institutional capacity instead of trying to copy frontier-power governance wholesale."
      }
    },
    copy_blocks: {
      intro_hook: "Can a policy be too credible? In compute governance, a costly signal may reveal resolve. But once the receiver believes the signal, waiting may become dangerous.",
      core_model: "The U.S. sends a signal. China updates its belief. China adapts or waits. Vietnam watches the constraints ripple downstream.",
      reset_button: "Try another world",
      randomize_button: "Let Nature choose",
      teaching_mode_button: "Teaching mode"
    },
    simulation_round_loop: {
      rounds: [
        { round_id:1, title:"Round 1: The Basic Signal", learning_goal:"Signals change beliefs.", teaching_reveal:"The signal matters because China cannot observe U.S. resolve directly. It updates from what the U.S. is willing to do." },
        { round_id:2, title:"Round 2: Cheap Signals Pool", learning_goal:"Thresholds can be visible but still weak as signals.", forced_or_suggested_signal:"T", teaching_reveal:"Because both High and Low Resolve types can announce thresholds cheaply, China learns less from the announcement alone." },
        { round_id:3, title:"Round 3: Cost Type Reveal", learning_goal:"Different policies become credible through different cost mechanisms.", enable_cost_typology_card:true, teaching_reveal:"Different policies become credible through different cost mechanisms." },
        { round_id:4, title:"Round 4: Repetition Changes Meaning", learning_goal:"Provider oversight becomes credible through persistence.", forced_or_suggested_signal:"K", teaching_reveal:"Provider oversight separates types gradually if the state keeps enforcing." },
        { round_id:5, title:"Round 5: Vietnam Watches", learning_goal:"Vietnam should preserve room for maneuver.", force_vietnam_panel_open:true, teaching_reveal:"Vietnam observes constraints and responds through flexible commitment." }
      ]
    },
    cost_typology_card: {
      title: "Four Ways Signals Become Costly",
      matrix: {
        ex_ante_non_contingent: { label:"Sunk costs", plain_language:"Paid upfront and not recovered, whatever China does.", example_signal:"Export controls" },
        ex_ante_contingent: { label:"Reducible costs", plain_language:"Paid upfront, but partly offset if the sender follows through.", example_signal:"Provider oversight capacity or domestic compute investment" },
        ex_post_non_contingent: { label:"Installment costs", plain_language:"Future costs paid over time, whatever China does.", example_signal:"Recurring KYC, audits, enforcement staff, reporting systems" },
        ex_post_contingent: { label:"Tied-hands costs", plain_language:"Future costs paid if the sender backs down.", example_signal:"Thresholds or export controls that create reversal expectations" }
      }
    }
  };

  self.spec = fallbackSpec;
  self.state = clone(fallbackSpec.initial_game_state);
  self.configReady = false;

  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function pct(value){
    return Math.round(value * 100) + "%";
  }

  function signalOrder(){
    return ["E", "T", "K"];
  }

  function get(obj, path, fallback){
    var cursor = obj;
    for(var i=0; i<path.length; i++){
      if(!cursor || cursor[path[i]] === undefined) return fallback;
      cursor = cursor[path[i]];
    }
    return cursor;
  }

  function mathText(text){
    return (text || "").replace(/mu_star/g, "mu*").replace(/theta/g, "theta");
  }

  function updateFromSpec(spec){
    self.spec = spec || fallbackSpec;
    var initial = clone(fallbackSpec.initial_game_state);
    var fromSpec = clone(self.spec.initial_game_state || {});
    for(var key in fromSpec) initial[key] = fromSpec[key];
    self.state = initial;
    self.configReady = true;
    self.broadcastState();
  }

  self.loadSpec = function(){
    fetch(SPEC_PATH).then(function(response){
      if(!response.ok) throw new Error("Could not load " + SPEC_PATH);
      return response.json();
    }).then(function(spec){
      updateFromSpec(spec);
    }).catch(function(err){
      console.warn(err.message);
      updateFromSpec(fallbackSpec);
    });
  };

  self.getLikelihoods = function(signal){
    var likelihoods = get(self.spec, ["suggested_logic", "computeSignalLikelihoods", signal], {});
    var h = likelihoods.Pr_s_given_H || 0.5;
    var l = likelihoods.Pr_s_given_L || 0.5;

    if(signal === "K"){
      h += 0.18 * self.state.enforcementPersistence;
      l -= 0.10 * self.state.enforcementPersistence;
    }
    if(signal === "T"){
      h += 0.08 * self.state.enforcementPersistence;
    }

    return { H: clamp(h, 0.05, 0.95), L: clamp(l, 0.05, 0.95) };
  };

  self.computeBelief = function(signal){
    if(!signal) return self.state.priorHighResolve;
    var prior = self.state.priorHighResolve;
    var lik = self.getLikelihoods(signal);
    var denominator = (lik.H * prior) + (lik.L * (1 - prior));
    var raw = denominator ? (lik.H * prior) / denominator : prior;
    return clamp(raw * (1 - self.state.noise) + prior * self.state.noise, 0, 1);
  };

  self.computeThreshold = function(){
    var base = 0.65;
    var capacityEffect = 0.35 * self.state.adaptationCapacity;
    var loopholeEffect = 0.15 * self.state.loopholes;
    return clamp(base - capacityEffect + loopholeEffect, 0.15, 0.9);
  };

  self.computeMaterialEffect = function(){
    var signalBase = { E: 0.78, K: 0.52, T: 0.34 }[self.state.signal] || 0.35;
    return clamp(signalBase + 0.18 * self.state.enforcementPersistence - 0.24 * self.state.loopholes, 0, 1);
  };

  self.computeCredibility = function(){
    var signalBase = { E: 0.78, K: 0.50, T: 0.32 }[self.state.signal] || 0.45;
    var persistence = self.state.signal === "K" ? 0.30 * self.state.enforcementPersistence : 0.14 * self.state.enforcementPersistence;
    return clamp(signalBase + persistence - 0.18 * self.state.noise, 0, 1);
  };

  self.autoChinaResponse = function(posterior, threshold){
    return posterior >= threshold ? "A" : "W";
  };

  self.classifyOutcome = function(signal, posterior, threshold, response, prior){
    if(!signal) return null;
    if(signal === "E" && posterior >= threshold && response === "A") return "adaptation_paradox";
    if(signal === "E" && posterior >= threshold && response === "W") return "credible_deterrence_or_delay";
    if(signal === "T" && Math.abs(posterior - prior) < 0.1) return "pooling_or_weak_signal";
    if(signal === "K") return "institutional_persistence_signal";
    return "mixed_signal";
  };

  self.computeVietnamScore = function(){
    var capacity = self.state.vietnamGovernanceCapacity;
    var dependency = self.state.vietnamDependency;
    var responsePressure = self.state.chinaResponse === "A" ? 0.12 : 0;
    var signalPressure = self.state.signal === "E" ? 0.12 : 0;
    return clamp(0.45 + (capacity * 0.35) - (dependency * 0.30) - responsePressure - signalPressure, 0, 1);
  };

  self.getVietnamImplication = function(){
    var implications = self.spec.vietnam_implications || fallbackSpec.vietnam_implications;
    var base = implications[self.state.signal] || implications.general || fallbackSpec.vietnam_implications.general;
    var extra = "";
    if(self.state.outcomeType === "adaptation_paradox"){
      extra = " Credible restrictions can trigger substitution; Vietnam should learn from adaptation without copying full-stack sovereignty.";
    }
    return {
      title: base.title,
      interpretation: (base.interpretation || "") + extra,
      recommendation: base.recommendation,
      autonomyScore: self.computeVietnamScore()
    };
  };

  function sliderMeta(id){
    var sliders = self.spec.sliders || fallbackSpec.sliders;
    for(var i=0; i<sliders.length; i++){
      if(sliders[i].id === id) return sliders[i];
    }
    return null;
  }

  function setParam(key, value){
    self.state[key] = Number(value);
    if(key === "priorHighResolve" && !self.state.signal){
      self.state.chinaBelief = self.state.priorHighResolve;
    }
    self.broadcastState();
  }

  function chooseRound(roundId){
    self.state.currentRound = roundId;
    var rounds = get(self.spec, ["simulation_round_loop", "rounds"], []);
    for(var i=0; i<rounds.length; i++){
      if(rounds[i].round_id === roundId && rounds[i].default_settings){
        var defaults = rounds[i].default_settings;
        for(var key in defaults) self.state[key] = defaults[key];
      }
    }
    self.state.signal = null;
    self.state.chinaResponse = null;
    self.state.outcomeType = null;
    self.broadcastState();
  }

  function activeRound(){
    var rounds = get(self.spec, ["simulation_round_loop", "rounds"], []);
    for(var i=0; i<rounds.length; i++){
      if(rounds[i].round_id === self.state.currentRound) return rounds[i];
    }
    return rounds[0] || {};
  }

  function applySignal(signal){
    self.state.signal = signal;
    self.state.chinaResponse = null;
    self.broadcastState();

    self.state.roundHistory.push({
      round: self.state.currentRound,
      type: self.state.usType,
      signal: signal,
      belief: self.state.chinaBelief,
      threshold: self.state.adaptationThreshold,
      response: self.state.chinaResponse,
      outcome: self.state.outcomeType
    });
    if(self.state.roundHistory.length > 5) self.state.roundHistory.shift();

    publish("signaling/message", [{
      round: self.state.currentRound,
      state: self.state.usType,
      signal: signal,
      action: self.state.chinaResponse || "-",
      payoff: [Math.round(self.state.chinaBelief * 100), Math.round(self.state.adaptationThreshold * 100)]
    }]);
    self.render();
  }

  self.applySignal = applySignal;

  self.setResponse = function(response){
    if(!self.state.signal) return;
    self.state.chinaResponse = response;
    self.state.autoResponse = false;
    self.broadcastState();
  };

  self.randomizeNature = function(){
    self.state.usType = Math.random() > 0.5 ? "H" : "L";
    self.broadcastState();
  };

  self.reset = function(){
    var initial = clone(get(self.spec, ["initial_game_state"], fallbackSpec.initial_game_state));
    self.state = initial;
    self.broadcastState();
    publish("signaling/resetDone", []);
  };

  self.step = function(){
    var round = activeRound();
    var nextSignal = round.forced_or_suggested_signal || (self.state.usType === "H" ? "E" : "T");
    if(Math.random() < self.state.noise){
      var all = signalOrder();
      nextSignal = all[Math.floor(Math.random() * all.length)];
    }
    applySignal(nextSignal);
  };

  self.broadcastState = function(){
    self.state.chinaBelief = self.computeBelief(self.state.signal);
    self.state.adaptationThreshold = self.computeThreshold();
    self.state.materialEffect = self.computeMaterialEffect();
    self.state.credibilityScore = self.computeCredibility();
    if(self.state.autoResponse && self.state.signal){
      self.state.chinaResponse = self.autoChinaResponse(self.state.chinaBelief, self.state.adaptationThreshold);
    }
    self.state.outcomeType = self.classifyOutcome(
      self.state.signal,
      self.state.chinaBelief,
      self.state.adaptationThreshold,
      self.state.chinaResponse,
      self.state.priorHighResolve
    );
    self.render();
    publish("signaling/stateChanged", [clone(self.state), self.getVietnamImplication()]);
  };

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

  function meter(label, value, marker, tone){
    var wrap = el("div", "sg-meter");
    var top = el("div", "sg-meter-label");
    top.appendChild(el("span", "", label));
    top.appendChild(el("strong", "", pct(value)));
    wrap.appendChild(top);

    var track = el("div", "sg-meter-track " + (tone || ""));
    var fill = el("div", "sg-meter-fill");
    fill.style.width = pct(value);
    track.appendChild(fill);
    if(marker !== undefined && marker !== null){
      var mark = el("div", "sg-meter-marker");
      mark.style.left = pct(marker);
      track.appendChild(mark);
    }
    wrap.appendChild(track);
    return wrap;
  }

  function miniStat(label, value){
    var node = el("div", "sg-mini-stat");
    node.appendChild(el("span", "", label));
    node.appendChild(el("b", "", value));
    return node;
  }

  function renderSignalCard(signalId){
    var signal = get(self.spec, ["game_model", "signals", signalId], {});
    var selected = self.state.signal === signalId;
    var card = button("sg-signal-card" + (selected ? " selected" : ""), "", function(){
      applySignal(signalId);
    });
    var hint = activeRound().forced_or_suggested_signal === signalId ? " try this round" : signalId;
    card.appendChild(el("div", "sg-card-code", hint));
    card.appendChild(el("h4", "", signal.label || signalId));
    card.appendChild(el("p", "", signal.ui_copy || signal.description || ""));
    var tags = el("div", "sg-tags");
    tags.appendChild(el("span", "", "Cost: " + (signal.cost_level || "?")));
    tags.appendChild(el("span", "", "Visible: " + (signal.visibility || "?")));
    card.appendChild(tags);
    return card;
  }

  function renderRoundTabs(){
    var wrap = el("div", "sg-round-tabs");
    var rounds = get(self.spec, ["simulation_round_loop", "rounds"], []);
    for(var i=0; i<rounds.length; i++){
      (function(round){
        var tab = button("sg-round-tab" + (self.state.currentRound === round.round_id ? " active" : ""), "R" + round.round_id, function(){
          chooseRound(round.round_id);
        });
        tab.title = round.title + ": " + round.learning_goal;
        wrap.appendChild(tab);
      })(rounds[i]);
    }
    return wrap;
  }

  function renderSlider(id){
    var meta = sliderMeta(id);
    if(!meta) return el("div");
    var wrap = el("label", "sg-slider");
    var top = el("div", "sg-slider-top");
    top.appendChild(el("span", "", meta.label));
    top.appendChild(el("b", "", pct(self.state[id])));
    wrap.appendChild(top);
    var input = el("input");
    input.type = "range";
    input.min = meta.min;
    input.max = meta.max;
    input.step = meta.step;
    input.value = self.state[id];
    input.addEventListener("input", function(){
      setParam(id, input.value);
    });
    wrap.appendChild(input);
    return wrap;
  }

  function renderOutcome(){
    var outcome = get(self.spec, ["outcomes", self.state.outcomeType], null);
    var node = el("section", "sg-panel sg-outcome");
    node.appendChild(el("h3", "", outcome ? outcome.title : "Choose a signal"));
    node.appendChild(el("p", "", outcome ? outcome.copy : "China observes the U.S. policy signal, updates belief, and compares that belief with its adaptation threshold."));
    if(outcome) node.appendChild(el("p", "sg-lesson", outcome.lesson));
    node.appendChild(meter("Credibility", self.state.credibilityScore, null, "blue"));
    node.appendChild(meter("Material bite", self.state.materialEffect, null, "gold"));
    return node;
  }

  function renderVietnamPanel(){
    var lesson = self.getVietnamImplication();
    var node = el("section", "sg-panel sg-vietnam");
    node.appendChild(el("h3", "", lesson.title));
    node.appendChild(el("p", "", lesson.interpretation));
    node.appendChild(el("p", "sg-lesson", lesson.recommendation));
    node.appendChild(meter("Vietnam policy autonomy", lesson.autonomyScore, null, "green"));
    return node;
  }

  function renderCostTypology(){
    var typology = self.spec.cost_typology_card || fallbackSpec.cost_typology_card;
    var round = activeRound();
    if(!round.enable_cost_typology_card && !self.state.showCostTypology) return null;
    var node = el("section", "sg-panel sg-typology");
    node.appendChild(el("h3", "", typology.title));
    var grid = el("div", "sg-typology-grid");
    for(var key in typology.matrix){
      var cell = el("div", "sg-typology-cell");
      cell.appendChild(el("b", "", typology.matrix[key].label));
      cell.appendChild(el("span", "", typology.matrix[key].plain_language));
      cell.appendChild(el("em", "", typology.matrix[key].example_signal));
      grid.appendChild(cell);
    }
    node.appendChild(grid);
    return node;
  }

  function renderAdvanced(){
    if(!self.state.advancedMode) return null;
    var belief = get(self.spec, ["game_model", "belief_update"], {});
    var threshold = get(self.spec, ["game_model", "adaptation_threshold"], {});
    var node = el("section", "sg-panel sg-advanced");
    node.appendChild(el("h3", "", "Show the math"));
    node.appendChild(el("code", "", mathText(belief.bayes_formula || "")));
    node.appendChild(el("code", "", mathText(threshold.condition || "")));
    node.appendChild(el("code", "", mathText(threshold.advanced_formula || "")));
    node.appendChild(el("p", "", threshold.plain_language || ""));
    return node;
  }

  function renderHistory(){
    var node = el("div", "sg-history");
    if(!self.state.roundHistory.length){
      node.appendChild(el("span", "", "No rounds yet."));
      return node;
    }
    for(var i=self.state.roundHistory.length - 1; i>=0; i--){
      var item = self.state.roundHistory[i];
      var line = "R" + item.round + " " + item.signal + " -> " + (item.response === "A" ? "Adapt" : "Wait") + " (" + pct(item.belief) + ")";
      node.appendChild(el("span", "", line));
    }
    return node;
  }

  self.render = function(){
    self.dom.innerHTML = "";

    var spec = self.spec;
    var round = activeRound();
    var signals = get(spec, ["game_model", "signals"], fallbackSpec.game_model.signals);
    var selectedSignal = signals[self.state.signal] || null;
    var typeName = get(spec, ["game_model", "players", "US", "hidden_type", "values", self.state.usType], self.state.usType);
    var typeCopy = get(spec, ["game_model", "players", "US", "hidden_type", "teaching_copy", self.state.usType], "");
    var chinaResponse = self.state.chinaResponse === "A" ? "Adapt" : (self.state.chinaResponse === "W" ? "Wait" : "not chosen");
    var responseCopy = get(spec, ["game_model", "players", "China", "responses", self.state.chinaResponse || "W", "description"], "");

    var header = el("header", "sg-header");
    var title = el("div", "sg-title");
    title.appendChild(el("h2", "", get(spec, ["project", "title"], "Signals of Compute Power")));
    title.appendChild(el("p", "", get(spec, ["copy_blocks", "intro_hook"], "")));
    header.appendChild(title);
    var controls = el("div", "sg-controls");
    controls.appendChild(button("sg-small-button", get(spec, ["copy_blocks", "randomize_button"], "Let Nature choose"), self.randomizeNature));
    controls.appendChild(button("sg-small-button", get(spec, ["copy_blocks", "reset_button"], "Try another world"), self.reset));
    controls.appendChild(button("sg-small-button", self.state.advancedMode ? "Hide math" : "Show the math", function(){
      self.state.advancedMode = !self.state.advancedMode;
      publish("signaling/advancedMode", [self.state.advancedMode]);
      self.broadcastState();
    }));
    header.appendChild(controls);
    self.dom.appendChild(header);

    var main = el("div", "sg-main");

    var board = el("section", "sg-board");
    var roundBar = el("div", "sg-round-row");
    var roundText = el("div", "sg-round-copy");
    roundText.appendChild(el("strong", "", round.title || "Round"));
    roundText.appendChild(el("span", "", round.learning_goal || ""));
    roundBar.appendChild(roundText);
    roundBar.appendChild(renderRoundTabs());
    board.appendChild(roundBar);

    var flow = el("div", "sg-flow");
    var nature = el("div", "sg-node nature");
    nature.appendChild(el("span", "", "Nature"));
    nature.appendChild(el("b", "", typeName));
    nature.appendChild(el("small", "", self.state.teachingMode ? typeCopy : "China cannot see this card."));
    var us = el("div", "sg-node us");
    us.appendChild(el("span", "", "U.S."));
    us.appendChild(el("b", "", "Sender"));
    us.appendChild(el("small", "", "Choose a compute governance signal."));
    var china = el("div", "sg-node china");
    china.appendChild(el("span", "", "China"));
    china.appendChild(el("b", "", chinaResponse));
    china.appendChild(el("small", "", responseCopy || "Belief crosses threshold?"));
    var outcomeNode = el("div", "sg-node outcome-node");
    outcomeNode.appendChild(el("span", "", "Outcome"));
    outcomeNode.appendChild(el("b", "", self.state.outcomeType ? get(spec, ["outcomes", self.state.outcomeType, "title"], "classified") : "pending"));
    outcomeNode.appendChild(el("small", "", "Credibility, adaptation, Vietnam lesson."));
    flow.appendChild(nature);
    flow.appendChild(el("div", "sg-arrow", "->"));
    flow.appendChild(us);
    flow.appendChild(el("div", "sg-arrow", "->"));
    flow.appendChild(china);
    flow.appendChild(el("div", "sg-arrow", "->"));
    flow.appendChild(outcomeNode);
    board.appendChild(flow);

    var signalCards = el("div", "sg-signal-grid");
    var order = signalOrder();
    for(var i=0; i<order.length; i++) signalCards.appendChild(renderSignalCard(order[i]));
    board.appendChild(signalCards);

    var beliefArea = el("div", "sg-belief-area");
    beliefArea.appendChild(meter("Prior belief", self.state.priorHighResolve, null, "gray"));
    beliefArea.appendChild(meter("Posterior belief " + (self.state.signal ? "after " + (selectedSignal.short_label || self.state.signal) : ""), self.state.chinaBelief, self.state.adaptationThreshold, "blue"));
    var auto = el("label", "sg-toggle");
    var autoInput = el("input");
    autoInput.type = "checkbox";
    autoInput.checked = !!self.state.autoResponse;
    autoInput.addEventListener("change", function(){
      self.state.autoResponse = autoInput.checked;
      self.broadcastState();
    });
    auto.appendChild(autoInput);
    auto.appendChild(el("span", "", "Auto Response"));
    beliefArea.appendChild(auto);
    beliefArea.appendChild(button("sg-response-button" + (self.state.chinaResponse === "A" ? " active" : ""), "Adapt", function(){ self.setResponse("A"); }));
    beliefArea.appendChild(button("sg-response-button" + (self.state.chinaResponse === "W" ? " active" : ""), "Wait", function(){ self.setResponse("W"); }));
    board.appendChild(beliefArea);

    var sliders = el("div", "sg-slider-grid");
    var sliderIds = ["priorHighResolve", "adaptationCapacity", "loopholes", "noise", "enforcementPersistence", "vietnamDependency", "vietnamGovernanceCapacity"];
    for(var s=0; s<sliderIds.length; s++) sliders.appendChild(renderSlider(sliderIds[s]));
    board.appendChild(sliders);

    var reveal = el("div", "sg-reveal");
    reveal.appendChild(el("p", "", round.teaching_reveal || get(spec, ["copy_blocks", "core_model"], "")));
    reveal.appendChild(button("sg-small-button", "Auto play round", self.step));
    board.appendChild(reveal);

    main.appendChild(board);

    var side = el("aside", "sg-side");
    var status = el("section", "sg-panel sg-status");
    status.appendChild(el("h3", "", selectedSignal ? selectedSignal.label : "No signal yet"));
    status.appendChild(el("p", "", selectedSignal ? selectedSignal.description : get(spec, ["copy_blocks", "core_model"], "")));
    var stats = el("div", "sg-mini-grid");
    stats.appendChild(miniStat("Type gap", selectedSignal ? selectedSignal.type_gap : "-"));
    stats.appendChild(miniStat("Reversible", selectedSignal ? selectedSignal.reversibility : "-"));
    stats.appendChild(miniStat("Mechanism", selectedSignal ? selectedSignal.dominant_cost_mechanism.join(" + ") : "-"));
    stats.appendChild(miniStat("Threshold", pct(self.state.adaptationThreshold)));
    status.appendChild(stats);
    if(selectedSignal) status.appendChild(el("p", "sg-risk", selectedSignal.risk));
    side.appendChild(status);
    side.appendChild(renderOutcome());
    side.appendChild(renderVietnamPanel());
    var typologyNode = renderCostTypology();
    if(typologyNode) side.appendChild(typologyNode);
    var advancedNode = renderAdvanced();
    if(advancedNode) side.appendChild(advancedNode);
    var histPanel = el("section", "sg-panel sg-history-panel");
    histPanel.appendChild(el("h3", "", "Recent rounds"));
    histPanel.appendChild(renderHistory());
    side.appendChild(histPanel);

    main.appendChild(side);
    self.dom.appendChild(main);
  };

  listen(self, "signaling/prior", function(value){ setParam("priorHighResolve", Array.isArray(value) ? value[0] : value); });
  listen(self, "signaling/noise", function(value){ setParam("noise", Array.isArray(value) ? value[0] : value); });
  listen(self, "signaling/enforcementPersistence", function(value){ setParam("enforcementPersistence", Array.isArray(value) ? value[0] : value); });
  listen(self, "signaling/adaptationCapacity", function(value){ setParam("adaptationCapacity", Array.isArray(value) ? value[0] : value); });
  listen(self, "signaling/loopholes", function(value){ setParam("loopholes", Array.isArray(value) ? value[0] : value); });
  listen(self, "signaling/vietnamDependency", function(value){ setParam("vietnamDependency", Array.isArray(value) ? value[0] : value); });
  listen(self, "signaling/vietnamGovernanceCapacity", function(value){ setParam("vietnamGovernanceCapacity", Array.isArray(value) ? value[0] : value); });

  listen(self, "signaling/send", function(signal){
    var s = Array.isArray(signal) ? signal[0] : signal;
    if(s) applySignal(s);
  });

  listen(self, "signaling/chinaResponse", function(response){
    var r = Array.isArray(response) ? response[0] : response;
    if(r) self.setResponse(r);
  });

  listen(self, "signaling/randomize", self.randomizeNature);
  listen(self, "signaling/reset", self.reset);
  listen(self, "signaling/step", self.step);
  listen(self, "signaling/advancedToggle", function(){
    self.state.advancedMode = !self.state.advancedMode;
    self.broadcastState();
  });
  listen(self, "signaling/setUS", function(t){
    var tt = Array.isArray(t) ? t[0] : t;
    if(tt === "H" || tt === "L"){
      self.state.usType = tt;
      self.broadcastState();
    }
  });
  listen(self, "signaling/refresh", self.broadcastState);

  self.add = function(){ _add(self); };
  self.remove = function(){
    unlisten(self);
    _remove(self);
  };

  self.render();
  self.loadSpec();
}

window.Signaling = Signaling;
