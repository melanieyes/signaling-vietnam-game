/*
  TextBox.js — a positioned block of copy.
  config: { x, y, width, align, size, color, text | text_id }

  Note: it uses the ".object" class (absolute positioning) but intentionally
  NOT ".textbox", because slides.css makes `.textbox > div` position:absolute,
  which would break rich content like the <div class="credits"> block.
*/

function TextBox(config){
  var self = this;
  config = config || {};

  var d = document.createElement("div");
  d.className = "object";
  d.style.left = (config.x || 0) + "px";
  d.style.top = (config.y || 0) + "px";
  if(config.width != null) d.style.width = config.width + "px";
  d.style.textAlign = config.align || "left";
  if(config.size != null) d.style.fontSize = config.size + "px";
  if(config.color) d.style.color = config.color;
  d.style.lineHeight = "1.15em";
  d.innerHTML = (config.text != null) ? config.text : Words.get(config.text_id);

  self.dom = d;
  self.setText = function(html){ d.innerHTML = html; };
  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };
}

window.TextBox = TextBox;
