define(function(){return {render:function(map) {var p=[],v =[];for(var i in map) {p.push(i);v.push(map[i]);}return (new Function(p, "var _s=[];_s.push(' <div class=\"my-message img-index-',index,'\">  <div class=\"avatar-wrap\" data-uid=\"',uid,'\" data-type=\"user\" data-action=\"user-info\">  <img class=\"avatar\" src=\"',Global.faceUrl,uid,'\"/>  </div>  <div class=\"content\">  <div class=\"message-content\">  <div class=\"progress\">  <div class=\"bar\"></div>  <div class=\"num\">0%</div>  </div>  </div>  </div> </div>'); return _s;")).apply(null, v).join("");}};});