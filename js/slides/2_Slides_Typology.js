// ============ SLIDE: Quek's 2x2 cost typology ============
// A card-based game-explanation scene (SignalingTypology builds its own copy in
// JS): the 2x2 cost matrix plus a chip strip mapping the cost types onto the
// three moves the player picks on the next slide.
SLIDES.push({
  id: "signaling_typology",
  onstart: function(self){
    self.add({ id:"signalingTypology", type:"SignalingTypology", x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});
