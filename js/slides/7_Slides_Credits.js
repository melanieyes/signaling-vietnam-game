// ============ FINAL SLIDE: credits + references, all on one compact screen ============
// Credits Nicky Case (interface / sound / explorable style) and the Fearon + Quek
// costly-signaling frameworks. Copy lives in /words.html under "signaling_credits";
// styling uses .credits / .big / .divider.
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
