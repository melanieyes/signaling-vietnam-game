// Signals of Compute Power explorable sequence

var _signalingPct = function(value){
  return Math.round(value * 100) + "%";
};

var _signalingOutcomeTitles = {
  adaptation_paradox: "credible signal, accelerated adaptation",
  credible_deterrence_or_delay: "credible signal, China waits",
  pooling_or_weak_signal: "pooling or weak signal",
  institutional_persistence_signal: "institutional persistence signal",
  mixed_signal: "mixed signal"
};

var _signalingSetDefaults = function(o){
  var defaults = {
    slider_prior: 0.5,
    slider_noise: 0.2,
    slider_adaptcap: 0.5,
    slider_loopholes: 0.3,
    slider_enforce: 0.5,
    slider_viet_dependency: 0.6,
    slider_viet_capacity: 0.4
  };
  for(var id in defaults){
    if(o[id]) o[id].setValue(defaults[id]);
  }
};

var _signalingBindStatus = function(self, o){
  listen(self, "signaling/stateChanged", function(state, viet){
    var st = state[0] || state;
    var v = viet || state[1] || {};
    var typeName = st.usType === "H" ? "High Resolve" : "Low Resolve";
    if(o.usType) o.usType.setText("<b>U.S. type:</b> " + typeName);
    if(o.beliefBox) o.beliefBox.setText(
      "<b>China belief:</b> " + _signalingPct(st.chinaBelief) +
      "<br><b>Adapt marker:</b> " + _signalingPct(st.adaptationThreshold)
    );
    if(o.responseBox) o.responseBox.setText("<b>China response:</b> " + (st.chinaResponse === "A" ? "Adapt" : (st.chinaResponse === "W" ? "Wait" : "not chosen")));
    if(o.outcomeBox) o.outcomeBox.setText("<b>Outcome:</b> " + (_signalingOutcomeTitles[st.outcomeType] || "choose a signal"));
    if(o.vietnamBox){
      o.vietnamBox.setText(
        "<b>" + (v.title || "Flexible commitment") + "</b>" +
        " | autonomy " + _signalingPct(v.autonomyScore || 0) +
        "<br>" + (v.interpretation || "") +
        "<br><b>Policy:</b> " + (v.recommendation || "")
      );
    }
  });
};

var _signalingAddNext = function(self, x, y, text_id){
  self.add({
    id:"next_button",
    type:"Button",
    x:x,
    y:y,
    size:"long",
    text_id:text_id || "signaling_next",
    message:"slideshow/next"
  });
};

SLIDES.push({
  id: "signaling_intro",
  onstart: function(self){
    self.add({
      id:"title",
      type:"TextBox",
      x:120,
      y:42,
      width:720,
      align:"center",
      size:34,
      color:"#315f7c",
      text_id:"signaling_intro_title"
    });
    self.add({
      id:"text",
      type:"TextBox",
      x:155,
      y:126,
      width:650,
      align:"center",
      size:24,
      text_id:"signaling_intro"
    });
    self.add({
      id:"takeaway",
      type:"TextBox",
      x:170,
      y:308,
      width:620,
      align:"center",
      size:26,
      color:"#7a3f18",
      text_id:"signaling_intro_takeaway"
    });
    _signalingAddNext(self, 306, 456, "signaling_intro_button");
  },
  onend: function(self){
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_game",
  onstart: function(self){
    self.add({
      id:"title",
      type:"TextBox",
      x:90,
      y:24,
      width:780,
      align:"center",
      size:31,
      color:"#315f7c",
      text_id:"signaling_game_title"
    });
    self.add({
      id:"left",
      type:"TextBox",
      x:70,
      y:90,
      width:385,
      size:18,
      text_id:"signaling_game_left"
    });
    self.add({
      id:"right",
      type:"TextBox",
      x:520,
      y:90,
      width:370,
      size:18,
      text_id:"signaling_game_right"
    });
    self.add({
      id:"flow",
      type:"TextBox",
      x:130,
      y:330,
      width:700,
      align:"center",
      size:20,
      color:"#7a3f18",
      text_id:"signaling_game_flow"
    });
    self.add({
      id:"note",
      type:"TextBox",
      x:120,
      y:410,
      width:720,
      align:"center",
      size:18,
      text_id:"signaling_game_note"
    });
    _signalingAddNext(self, 306, 466, "signaling_game_button");
  },
  onend: function(self){
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_typology",
  onstart: function(self){
    self.add({ id:"title", type:"TextBox", x:90, y:24, width:780, align:"center", size:31, color:"#315f7c", text_id:"signaling_typology_title" });
    self.add({ id:"corner", type:"TextBox", x:82, y:92, width:150, align:"center", size:19, color:"#666", text_id:"signaling_typology_corner" });
    self.add({ id:"noncontingent", type:"TextBox", x:300, y:92, width:240, align:"center", size:21, color:"#315f7c", text_id:"signaling_typology_noncontingent" });
    self.add({ id:"contingent", type:"TextBox", x:610, y:92, width:240, align:"center", size:21, color:"#315f7c", text_id:"signaling_typology_contingent" });

    self.add({ id:"exante", type:"TextBox", x:86, y:178, width:120, align:"center", size:23, color:"#7a3f18", text_id:"signaling_typology_exante" });
    self.add({ id:"expost", type:"TextBox", x:86, y:338, width:120, align:"center", size:23, color:"#7a3f18", text_id:"signaling_typology_expost" });

    self.add({ id:"sunk", type:"TextBox", x:236, y:160, width:300, size:19, text_id:"signaling_typology_sunk" });
    self.add({ id:"reducible", type:"TextBox", x:560, y:160, width:300, size:19, text_id:"signaling_typology_reducible" });
    self.add({ id:"installment", type:"TextBox", x:236, y:320, width:300, size:19, text_id:"signaling_typology_installment" });
    self.add({ id:"tied", type:"TextBox", x:560, y:320, width:300, size:19, text_id:"signaling_typology_tied" });

    self.add({ id:"takeaway", type:"TextBox", x:170, y:426, width:620, align:"center", size:18, color:"#7a3f18", text_id:"signaling_typology_takeaway" });
    _signalingAddNext(self, 306, 486, "signaling_typology_button");
  },
  onend: function(self){
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_role_choice",
  onstart: function(self){
    self.add({ id:"signalingRoleChoice", type:"SignalingRoleChoice", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_signal_choice",
  onstart: function(self){
    self.add({ id:"signalingSignalChoice", type:"SignalingSignalSelection", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_role_game",
  onstart: function(self){
    self.add({ id:"signaling", type:"SignalingRoleGame", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_governance_ending",
  onstart: function(self){
    self.add({ id:"signalingEnding", type:"SignalingGovernanceEnding", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

// Downstream observer — Vietnam / middle-power strategic hedging (flexible commitment).
SLIDES.push({
  id: "signaling_vietnam",
  onstart: function(self){
    self.add({ id:"vietnamHedge", type:"SignalingVietnamHedge", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_advanced",
  onstart: function(self){
    self.add({
      id:"title",
      type:"TextBox",
      x:80,
      y:24,
      width:800,
      align:"center",
      size:31,
      color:"#315f7c",
      text_id:"signaling_advanced_title"
    });
    self.add({
      id:"left",
      type:"TextBox",
      x:130,
      y:118,
      width:700,
      align:"center",
      size:26,
      text_id:"signaling_advanced_left"
    });
    self.add({
      id:"right",
      type:"TextBox",
      x:160,
      y:252,
      width:640,
      align:"center",
      size:24,
      color:"#7a3f18",
      text_id:"signaling_advanced_right"
    });
    self.add({
      id:"bottom",
      type:"TextBox",
      x:160,
      y:350,
      width:708,
      align:"center",
      size:21,
      text_id:"signaling_advanced_bottom"
    });
    self.add({
      id:"button",
      type:"Button",
      x:306,
      y:466,
      size:"long",
      text_id:"signaling_advanced_button",
      message:"slideshow/scratch"
    });
  },
  onend: function(self){
    self.clear();
  }
});

// FINAL SLIDE — credits + references, all compact on one screen.
// Explicitly credits Nicky Case (interface / sound / explorable style) and the
// Fearon + Quek costly-signaling frameworks the model is built on. Copy lives in
// words.html under "signaling_credits"; styling uses .credits / .big / .divider.
SLIDES.push({
  id: "signaling_credits",
  onstart: function(self){
    self.add({
      id:"credits",
      type:"TextBox",
      x:0,
      y:46,
      width:960,
      align:"center",
      size:19,
      text_id:"signaling_credits"
    });
  },
  onend: function(self){
    self.clear();
  }
});
