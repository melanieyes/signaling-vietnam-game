function SignalViz(config){

  var self = this;
  self.id = config.id;

  // DOM
  self.dom = document.createElement("div");
  self.dom.className = "object";
  self.dom.classList.add("signalviz");
  self.dom.style.left = (config.x || 500) + "px";
  self.dom.style.top = (config.y || 200) + "px";
  self.dom.style.width = (config.width || 320) + "px";
  self.dom.style.height = (config.height || 160) + "px";

  var title = document.createElement("div");
  title.className = "signalviz_title";
  title.innerHTML = Words.get(config.title_id || "signaling_recent_messages") || "Messages";
  self.dom.appendChild(title);

  var list = document.createElement("div");
  list.className = "signalviz_list";
  self.dom.appendChild(list);

  var maxItems = config.maxItems || 6;

  var renderItem = function(rec){
    var item = document.createElement("div");
    item.className = "signalviz_item";
    item.innerHTML = "<b>"+rec.state+"</b> → "+rec.signal+" → <i>"+rec.action+"</i> &nbsp; <span class=\"small\">("+rec.payoff.join(",")+")</span>";
    return item;
  };

  var items = [];
  var push = function(rec){
    var node = renderItem(rec);
    list.insertBefore(node, list.firstChild);
    items.unshift(node);
    if(items.length>maxItems){
      var removed = items.pop();
      list.removeChild(removed);
    }
  };

  // Listen to signaling messages
  listen(self, "signaling/message", function(record){
    // record is passed as array (publish sends [record])
    var rec = record[0] || record;
    push(rec);
  });

  // Add/Remove
  self.add = function(){ _add(self); };
  self.remove = function(){ unlisten(self); _remove(self); };

}
