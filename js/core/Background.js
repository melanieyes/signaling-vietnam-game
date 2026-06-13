/*
  Background.js - drifting-triangle particle field (the explorabl.es / Nicky Case look).
  Not 3D: a 2D <canvas> of floating, slowly-rotating triangles with faint
  "constellation" lines between nearby ones. Parallax-ish drift reads as depth.

  main.js calls Background.mount(hostElement) once; it sits behind the slideshow
  (transparent canvas), so it shows through the text slides and in the margins
  around the 960x540 stage. pointer-events:none, so it never blocks clicks.

  Tweak the CONFIG block to taste (count, colour, speed, dark vs light).
*/

var Background = (function(){

  // ---- CONFIG ----
  var COUNT     = 46;                       // number of triangles
  var TRI       = "rgba(120,130,150,0.40)"; // triangle stroke (light/grey on white)
  var LINK      = "rgba(120,130,150,0.16)"; // connecting line colour
  var LINK_DIST = 132;                      // px: link triangles closer than this
  var SPEED     = 0.28;                      // max drift px/frame
  var SIZE      = [5, 14];                   // triangle radius range
  // For a DARK look like the screenshot: set TRI/LINK to "rgba(255,255,255,0.5)"
  // and give #main a dark background in CSS.

  var canvas, ctx, raf = null, host = null;
  var parts = [], W = 0, H = 0;

  function rand(a, b){ return a + Math.random() * (b - a); }

  function make(){
    return {
      x: rand(0, W), y: rand(0, H),
      vx: rand(-SPEED, SPEED), vy: rand(-SPEED, SPEED),
      r: rand(SIZE[0], SIZE[1]),
      a: rand(0, Math.PI * 2), va: rand(-0.012, 0.012)
    };
  }

  function resize(){
    if(!host || !canvas) return;
    W = host.clientWidth || window.innerWidth;
    H = host.clientHeight || window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  }

  function drawTriangle(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.beginPath();
    for(var i = 0; i < 3; i++){
      var ang = (Math.PI * 2 / 3) * i - Math.PI / 2;
      var x = Math.cos(ang) * p.r;
      var y = Math.sin(ang) * p.r;
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = TRI;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  function frame(){
    ctx.clearRect(0, 0, W, H);

    // constellation links
    for(var i = 0; i < parts.length; i++){
      for(var j = i + 1; j < parts.length; j++){
        var dx = parts[i].x - parts[j].x;
        var dy = parts[i].y - parts[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if(d < LINK_DIST){
          ctx.beginPath();
          ctx.moveTo(parts[i].x, parts[i].y);
          ctx.lineTo(parts[j].x, parts[j].y);
          ctx.strokeStyle = LINK;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 1 - (d / LINK_DIST);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }

    // move + draw triangles (wrap at edges)
    for(var k = 0; k < parts.length; k++){
      var p = parts[k];
      p.x += p.vx; p.y += p.vy; p.a += p.va;
      if(p.x < -24) p.x = W + 24;
      if(p.x > W + 24) p.x = -24;
      if(p.y < -24) p.y = H + 24;
      if(p.y > H + 24) p.y = -24;
      drawTriangle(p);
    }

    raf = requestAnimationFrame(frame);
  }

  return {
    mount: function(hostEl){
      host = hostEl || document.body;
      canvas = document.createElement("canvas");
      canvas.className = "bg-particles";
      canvas.style.position = "absolute";
      canvas.style.left = "0";
      canvas.style.top = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.zIndex = "0";
      canvas.style.pointerEvents = "none";

      if(getComputedStyle(host).position === "static") host.style.position = "relative";
      host.insertBefore(canvas, host.firstChild);

      ctx = canvas.getContext("2d");
      resize();
      parts = [];
      for(var i = 0; i < COUNT; i++) parts.push(make());
      window.addEventListener("resize", resize);
      if(!raf) frame();
    },
    unmount: function(){
      if(raf) cancelAnimationFrame(raf);
      raf = null;
      window.removeEventListener("resize", resize);
      if(canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };

})();

window.Background = Background;
