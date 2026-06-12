// ============ SLIDE: Quek's 2x2 cost typology ============
SLIDES.push({
  id: "signaling_typology",
  onstart: function(self){
    self.add({ id:"title", type:"TextBox", x:90, y:44, width:780, align:"center", size:33, color:"#315f7c", text_id:"signaling_typology_title" });

    // column headers
    self.add({ id:"corner", type:"TextBox", x:66, y:120, width:150, align:"center", size:18, color:"#999", text_id:"signaling_typology_corner" });
    self.add({ id:"noncontingent", type:"TextBox", x:230, y:122, width:300, align:"center", size:22, color:"#315f7c", text_id:"signaling_typology_noncontingent" });
    self.add({ id:"contingent", type:"TextBox", x:556, y:122, width:300, align:"center", size:22, color:"#315f7c", text_id:"signaling_typology_contingent" });

    // row labels
    self.add({ id:"exante", type:"TextBox", x:66, y:206, width:150, align:"center", size:24, color:"#7a3f18", text_id:"signaling_typology_exante" });
    self.add({ id:"expost", type:"TextBox", x:66, y:366, width:150, align:"center", size:24, color:"#7a3f18", text_id:"signaling_typology_expost" });

    // 2x2 cells (bold title + description)
    self.add({ id:"sunk", type:"TextBox", x:232, y:190, width:300, size:19, text_id:"signaling_typology_sunk" });
    self.add({ id:"reducible", type:"TextBox", x:556, y:190, width:300, size:19, text_id:"signaling_typology_reducible" });
    self.add({ id:"installment", type:"TextBox", x:232, y:350, width:300, size:19, text_id:"signaling_typology_installment" });
    self.add({ id:"tied", type:"TextBox", x:556, y:350, width:300, size:19, text_id:"signaling_typology_tied" });

    self.add({ id:"takeaway", type:"TextBox", x:150, y:452, width:660, align:"center", size:20, color:"#7a3f18", text_id:"signaling_typology_takeaway" });
    _signalingAddNext(self, 306, 500, "signaling_typology_button");
  },
  onend: function(self){
    self.clear();
  }
});
