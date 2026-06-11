/*
  Button.js — a hand-drawn Nicky Case-style button.
  config: { x, y, size ("short"|"long"), text | text_id, message, data }
  On click it publishes `message` with `data` (default []).
  DOM structure (#background / #text / #hitbox) matches the .button rules in slides.css.
*/

function Button(config){
  var self = this;
  config = config || {};

  var d = document.createElement("div");
  d.className = "object button no-select";
  if(config.size) d.setAttribute("size", config.size);
  d.setAttribute("hover", "no");
  d.style.left = (config.x || 0) + "px";
  d.style.top = (config.y || 0) + "px";

  var bg = document.createElement("div"); bg.id = "background";
  var tx = document.createElement("div"); tx.id = "text";
  tx.innerHTML = (config.text != null) ? config.text : Words.get(config.text_id);
  var hit = document.createElement("div"); hit.id = "hitbox";

  d.appendChild(bg);
  d.appendChild(tx);
  d.appendChild(hit);

  hit.addEventListener("mouseenter", function(){ d.setAttribute("hover", "yes"); });
  hit.addEventListener("mouseleave", function(){ d.setAttribute("hover", "no"); });
  hit.addEventListener("click", function(){
    if(config.message) publish(config.message, config.data || []);
  });

  self.dom = d;
  self.setText = function(html){ tx.innerHTML = html; };
  self.deactivate = function(on){ d.setAttribute("deactivated", on ? "yes" : "no"); };
  self.add = function(){ _add(self); };
  self.remove = function(){ _remove(self); };
}

window.Button = Button;
