// ============ FINAL SLIDE: end-credit / author note ============
// Warm, centered closing credit: created by Melanie, inspired by Nicky Case, built
// on Fearon + Quek. Content is inlined here (not from words.html) so a stale cached
// words.html / main.js cannot blank it. Styling uses the .cred-* classes.
SLIDES.push({
  id: "signaling_credits",
  onstart: function(self){
    self.add({
      id:"credits",
      type:"TextBox",
      x:0,
      y:0,
      width:960,
      align:"center",
      text:
        "<div class='cred-page'>" +
          "<div class='cred-block'>" +
            "<p class='cred-kicker'>created by</p>" +
            "<p class='cred-name'>MELANIE</p>" +
            "<p class='cred-line'><a href='https://github.com/melanieyes' target='_blank'>github</a></p>" +
          "</div>" +
          "<div class='cred-block'>" +
            "<p class='cred-label'>interface, sound &amp; explorable style adapted from</p>" +
            "<p class='cred-line'><a href='https://ncase.me/trust/' target='_blank'>&ldquo;The Evolution of Trust&rdquo;</a> &nbsp;&middot;&nbsp; <a href='https://ncase.me/' target='_blank'>play Nicky Case&rsquo;s other stuff</a></p>" +
          "</div>" +
          "<div class='cred-block'>" +
            "<p class='cred-label'>the signaling model is built on the costly-signaling frameworks of</p>" +
            "<p class='cred-line'><a href='https://www.jstor.org/stable/174551' target='_blank'>Fearon (1997): tying hands vs. sinking costs</a> &nbsp;&middot;&nbsp; <a href='https://doi.org/10.1017/S0003055420001094' target='_blank'>Quek (2021): four costly-signaling mechanisms</a></p>" +
          "</div>" +
          "<p class='cred-ps'>p.s. &ldquo;Signals of Compute Power&rdquo; reframes these ideas for compute governance. The U.S. sends a costly signal, China adapts or waits, and Vietnam watches downstream.</p>" +
          "<p class='cred-ps'>The sim is a toy model, not a forecast. But it can help us understand how signaling works, and how better signals might be designed.</p>" +
        "</div>"
    });
  },
  onend: function(self){
    self.clear();
  }
});
