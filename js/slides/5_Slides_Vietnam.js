// ============ Downstream observer: Vietnam / flexible commitment ============
// A 3-scene interactive flow (SignalingVietnam builds its own copy in JS):
//   observe the shock → build the strategy → see the consequence.

SLIDES.push({
  id: "signaling_vietnam_observe",
  onstart: function(self){
    self.add({ id:"vietnam1", type:"SignalingVietnam", scene:1, x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_vietnam_build",
  onstart: function(self){
    self.add({ id:"vietnam2", type:"SignalingVietnam", scene:2, x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});

SLIDES.push({
  id: "signaling_vietnam_consequence",
  onstart: function(self){
    self.add({ id:"vietnam3", type:"SignalingVietnam", scene:3, x:0, y:0, width:960, height:540 });
  },
  onend: function(self){
    unlisten(self);
    self.clear();
  }
});
