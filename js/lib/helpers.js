/*
  helpers.js — core plumbing for the explorable.
  Self-contained pub/sub messaging + stage add/remove + the global SLIDES array.
  (Does not depend on the other lib/* placeholders.)

  Public API used across the project:
    SLIDES                         — array the slide files push() into
    listen(self, channel, fn)      — subscribe; tracked on `self` for unlisten()
    unlisten(self)                 — drop every subscription owned by `self`
    publish(channel, argsArray)    — fn.apply(ctx, argsArray) for each subscriber
    _add(self) / _remove(self)     — append/remove self.dom to the #slideshow stage
*/

window.SLIDES = window.SLIDES || [];

(function(){

  var channels = {};

  function ensure(name){
    return channels[name] || (channels[name] = []);
  }

  window.listen = function(self, name, fn){
    var token = { ctx: self || null, fn: fn };
    ensure(name).push(token);
    if(self){
      if(!self._subs) self._subs = [];
      self._subs.push({ name: name, token: token });
    }
    return token;
  };

  window.unlisten = function(self){
    if(!self || !self._subs) return;
    for(var i = 0; i < self._subs.length; i++){
      var sub = self._subs[i];
      var arr = channels[sub.name];
      if(!arr) continue;
      var idx = arr.indexOf(sub.token);
      if(idx >= 0) arr.splice(idx, 1);
    }
    self._subs = [];
  };

  window.publish = function(name, args){
    var arr = channels[name];
    if(!arr || !arr.length) return;
    args = args || [];
    var snapshot = arr.slice();
    for(var i = 0; i < snapshot.length; i++){
      try{
        snapshot[i].fn.apply(snapshot[i].ctx, args);
      }catch(err){
        if(window.console) console.error("listener error on '" + name + "':", err);
      }
    }
  };

})();

function _stage(){
  return document.getElementById("slideshow");
}

function _add(self){
  var stage = _stage();
  if(stage && self && self.dom && self.dom.parentNode !== stage){
    stage.appendChild(self.dom);
  }
}

function _remove(self){
  if(self && self.dom && self.dom.parentNode){
    self.dom.parentNode.removeChild(self.dom);
  }
}
