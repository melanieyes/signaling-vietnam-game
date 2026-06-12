// ============ The lesson, read through your outcome ============
// SignalingGovernanceEnding builds its own copy in JS. No Words copy here.

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
