/*
  main.js — bootstrap.
  Loads words.html into Words, then starts the slideshow + nav dots.
*/

(function(){

  function boot(){
    // Sound toggle (cosmetic — no audio engine bundled).
    var sound = document.getElementById("sound");
    if(sound){
      sound.addEventListener("click", function(){
        sound.setAttribute("sound", sound.getAttribute("sound") === "on" ? "off" : "on");
      });
    }

    if(window.Background) Background.mount(document.getElementById("main"));

    Slideshow.init(window.SLIDES);
    SlideSelect.init(window.SLIDES.length);

    var pre = document.getElementById("preloader");
    if(pre) pre.style.display = "none";
  }

  function start(){
    fetch("words.html")
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
