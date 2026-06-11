/*
  Slideshow.js — runs the SLIDES array.

  Each SLIDES entry: { id, onstart(ctrl), onend(ctrl) }.
  The controller passed to onstart/onend exposes:
    ctrl.add(config)  -> new window[config.type](config), appends it, returns the instance
    ctrl.clear()      -> removes every object added this slide

  Navigation channels (published from buttons / components):
    slideshow/next, slideshow/previous, slideshow/scratch
    slideshow/goto  (payload: slide id string OR numeric index)
    slideshow/jump  (alias of goto)
  Emits: slideshow/changed (index, total)
*/

var Slideshow = (function(){

  var slides = [];
  var index = -1;

  function makeController(){
    var ctrl = { _objects: [] };
    ctrl.add = function(config){
      var Ctor = window[config.type];
      if(typeof Ctor !== "function"){
        if(window.console) console.warn("Slideshow: unknown component type '" + config.type + "'");
        return null;
      }
      var obj = new Ctor(config);
      if(obj && obj.add) obj.add();
      ctrl._objects.push(obj);
      return obj;
    };
    ctrl.clear = function(){
      for(var i = 0; i < ctrl._objects.length; i++){
        var o = ctrl._objects[i];
        if(o && o.remove) o.remove();
      }
      ctrl._objects = [];
    };
    return ctrl;
  }

  function indexOfId(id){
    for(var i = 0; i < slides.length; i++){
      if(slides[i].id === id) return i;
    }
    return -1;
  }

  function show(i){
    if(!slides.length) return;
    if(i < 0) i = 0;
    if(i > slides.length - 1) i = slides.length - 1;

    if(index >= 0 && slides[index]){
      var prev = slides[index];
      if(prev.onend){
        try{ prev.onend(prev._ctrl); }
        catch(err){ if(window.console) console.error("onend error:", err); }
      }
      if(prev._ctrl) prev._ctrl.clear();
    }

    index = i;
    var slide = slides[index];
    slide._ctrl = makeController();
    if(slide.onstart){
      try{ slide.onstart(slide._ctrl); }
      catch(err){ if(window.console) console.error("onstart error on '" + slide.id + "':", err); }
    }
    publish("slideshow/changed", [index, slides.length]);
  }

  function goto(target){
    if(typeof target === "string"){
      var k = indexOfId(target);
      if(k >= 0) show(k);
      return;
    }
    if(typeof target === "number"){
      show(target);
    }
  }

  return {
    init: function(arr){
      slides = arr || window.SLIDES || [];
      listen(null, "slideshow/next", function(){ show(index + 1); });
      listen(null, "slideshow/previous", function(){ show(index - 1); });
      listen(null, "slideshow/scratch", function(){ show(index + 1); });
      listen(null, "slideshow/goto", function(t){ goto(t); });
      listen(null, "slideshow/jump", function(t){ goto(t); });
      show(0);
    },
    goto: goto,
    count: function(){ return slides.length; },
    current: function(){ return index; }
  };

})();

window.Slideshow = Slideshow;
