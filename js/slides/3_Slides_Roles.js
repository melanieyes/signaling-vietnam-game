// ============ PLAYABLE: pick a role → pick a signal → play the round ============
// These slides mount interactive sims (SignalingScenario.js); they build their
// own copy in JS, so there is no Words copy here.

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
