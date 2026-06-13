/*
  SlideSelect.js - the row of navigation dots in #select (footer).
  main.js calls SlideSelect.init(totalSlides) after Slideshow.init().
*/

var SlideSelect = (function(){

  var box;

  return {
    init: function(count){
      box = document.getElementById("select");
      if(!box) return;
      box.innerHTML = "";

      for(var i = 0; i < count; i++){
        (function(idx){
          var dot = document.createElement("div");
          dot.className = "dot";
          dot.addEventListener("click", function(){
            publish("slideshow/goto", [idx]);
          });
          box.appendChild(dot);
        })(i);
      }

      listen(null, "slideshow/changed", function(current){
        var dots = box.children;
        for(var i = 0; i < dots.length; i++){
          if(i === current) dots[i].setAttribute("selected", "");
          else dots[i].removeAttribute("selected");
        }
      });
    }
  };

})();

window.SlideSelect = SlideSelect;
