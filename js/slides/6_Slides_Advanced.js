// ============ SLIDE: advanced (the math) ============
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

// ============ SLIDE: synthesis (the argument), before the references ============
// Closing argument tying Fearon + Quek + compute governance together. Sits between
// the math slide and the credits/references. Two exits: replay the game, or read on.
SLIDES.push({
  id: "signaling_synthesis",
  onstart: function(self){
    self.add({
      id:"synthesis",
      type:"TextBox",
      x:0,
      y:0,
      width:960,
      align:"center",
      // content is inlined here (not pulled from words.html) so it cannot be
      // blanked by a stale cached words.html / main.js
      text:
        "<div class='synth-page'>" +
          "<p class='synth-eyebrow'>what this game is trying to say</p>" +
          "<h2 class='synth-title'>When compute policy becomes the signal</h2>" +
          "<div class='synth-note'>" +
            "<p>Costly signaling is an old idea in international relations. Scholars have used it to study diplomacy, deterrence, reputation, cyber conflict, and institutions.</p>" +
            "<p>This game moves that logic into <b>compute governance</b>. The point is simple: chips, cloud access, thresholds, and provider oversight are not just technical rules. They are <b>costly policy choices</b> that other states can read.</p>" +
            "<p>Fearon helps explain why costly signals can become credible. Quek helps separate the different ways costs work. In this game, the U.S. sends a signal, China updates and adapts or waits, and <b>Vietnam inherits the pressure</b> while trying to keep room to move.</p>" +
          "</div>" +
          "<p class='synth-final'>Compute governance is not only about controlling compute. It is also about how policy changes beliefs, triggers adaptation, and reshapes <b>room to move</b>.</p>" +
        "</div>"
    });
    self.add({
      id:"replay",
      type:"Button",
      x:70,
      y:478,
      size:"long",
      text:"↺ back to the game",
      message:"slideshow/goto",
      data:["signaling_role_choice"]
    });
    self.add({
      id:"references",
      type:"Button",
      x:495,
      y:478,
      size:"long",
      text:"references →",
      message:"slideshow/next"
    });
  },
  onend: function(self){
    self.clear();
  }
});
