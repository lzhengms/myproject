define(function(){return {render:function(map) {var p=[],v =[];for(var i in map) {p.push(i);v.push(map[i]);}return (new Function(p, "var _s=[];_s.push(' <div class=\"group-info\" data-gid=\"',gid,'\" data-type=\"discussion\">  <div class=\"top-part\">  <div class=\"item-title\">讨论组号码：<span class=\"item-content\" data-role=\"group-id\">',gid,'</span></div>  <div class=\"item-title\">讨论组名称：<span class=\"item-content\" data-role=\"group-name\">',gname,'</span></div>  <div style=\"clear: both\"></div>  </div>  <div class=\"bottom-part\">  <div class=\"item-title\">讨论组主题：</div>  <div class=\"group-notice item-content\" data-role=\"group-notice\">',notice,'</div>  </div>  <div class=\"talk-to-btn\" data-action=\"talk-to\">发消息</div> </div>'); return _s;")).apply(null, v).join("");}};});