define(function(){return {render:function(map) {var p=[],v =[];for(var i in map) {p.push(i);v.push(map[i]);}return (new Function(p, "var _s=[];_s.push(' <div class=\"group-check\">  <div class=\"group-check-content\">  <div class=\"group-info\">  <div class=\"group-avatar\"></div>  <div class=\"group-approch-info\">  <div class=\"top\">您将申请加入<span class=\"group-name\">',gname,'</span>（<span class=\"group-id\">',gid,'</span>）</div>  <div class=\"group-creator\">创建人: ',creatorname,'（',creatorid,'）</div>  </div>  </div>  <div class=\"validate\">  <div class=\"title\">需要身份验证才能加入该群</div>  <textarea class=\"content\"></textarea>  </div>  </div> </div>'); return _s;")).apply(null, v).join("");}};});