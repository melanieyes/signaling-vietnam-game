/*
  main.js - bootstrap.
  Loads words.html into Words, then starts the slideshow + nav dots.
  Slide layout lives in the per-section js/slides/*_Slides_*.js files (Nicky Case style).
*/

(function(){

  function boot(){
    // Audio layer: preloads the sound pack, binds the #sound toggle, and maps
    // varied SFX + looping music onto the game's interactions (see js/lib/sound.js).
    if(window.Sound) Sound.init();

    if(window.Background) Background.mount(document.getElementById("main"));

    Slideshow.init(window.SLIDES);
    SlideSelect.init(window.SLIDES.length);

    fitStage();
    window.addEventListener("resize", fitStage);

    var pre = document.getElementById("preloader");
    if(pre) pre.style.display = "none";
  }

  // Scale the fixed 960×540 stage up/down to fill #main while preserving 16:9.
  // The internal coordinate system is untouched - we only CSS-transform the
  // stage, so every slide benefits and click/hit areas scale with it. #main is
  // already height:calc(100% - 60px), so the footer space is reserved for us.
  var MAX_STAGE_SCALE = 1.12;   // never magnify past this on large screens
  function fitStage(){
    var main = document.getElementById("main");
    var stage = document.getElementById("slideshow");
    if(!main || !stage) return;
    // fit to the smaller axis, but cap so big screens stay close to 1:1
    var scale = Math.min(main.clientWidth / 960, main.clientHeight / 540, MAX_STAGE_SCALE);
    if(scale < 0.2) scale = 0.2;
    stage.style.transform = "scale(" + scale + ")";
  }

  function start(){
    fetch("words.html?v=4")
      .then(function(r){ if(!r.ok) throw new Error("words.html " + r.status); return r.text(); })
      .then(function(html){ Words.load(html); boot(); })
      .catch(function(err){
        if(window.console) console.warn("Could not load words.html:", err);
        boot();
      });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", start);
  }else{
    start();
  }

})();
