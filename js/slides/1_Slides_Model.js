// ============ SLIDE: the model (orientation) ============
// A card-based orientation scene (SignalingActors builds its own copy in JS):
// introduces the three players, the signal -> update -> downstream flow, and the
// "credibility != control" twist.
SLIDES.push({
  id: "signaling_game",
  onstart: function(self){
    self.add({ id:"signalingActors", type:"SignalingActors", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});
