// Signals of Compute Power, slide sequence.
// Nicky Case "Evolution of Trust" style: one N_Slides_*.js file per section.
// Slide copy lives in /words.html keyed by id; sims build their own copy in JS.

// shared helper: drop a hand-drawn "next" button onto a slide
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


// ============ SLIDE: intro ============
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
