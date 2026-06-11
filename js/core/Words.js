/*
  Words.js — tiny copy store (Evolution of Trust convention).
  main.js fetches words.html and calls Words.load(html).
  Words.get("some_id") returns the innerHTML of <div id="some_id"> from that file.
*/

var Words = (function(){

  var store = {};

  return {
    load: function(html){
      var box = document.createElement("div");
      box.innerHTML = html || "";
      var nodes = box.querySelectorAll("[id]");
      for(var i = 0; i < nodes.length; i++){
        store[nodes[i].id] = nodes[i].innerHTML;
      }
    },
    has: function(id){
      return Object.prototype.hasOwnProperty.call(store, id);
    },
    get: function(id){
      if(id == null) return "";
      return this.has(id) ? store[id] : ("[" + id + "]");
    }
  };

})();

window.Words = Words;
