define(function(){return {render:function(map) {var p=[],v =[];for(var i in map) {p.push(i);v.push(map[i]);}return (new Function(p, "var _s=[];_s.push(''); if(owner==='others') {_s.push(' <div class=\"',owner,'-message ',error,'\" data-uid=\"',uid,'\">  <div class=\"avatar-wrap\" data-uid=\"',uid,'\" data-type=\"user\" data-action=\"user-info\">  <img class=\"avatar\" src=\"',isPsp?Global.pspFaceUrl:Global.faceUrl,uid,'\"/>  </div>  <div class=\"content\">  <div class=\"username\" title=\"',username,'\">',username,'</div>  <div class=\"time-wrap\">  <span class=\"date\">',Global.helper.cuteMessageTime.getDate(time),' </span>  <span class=\"time\">',Global.helper.cuteMessageTime.getTime(time),' </span>  </div>  <div class=\"message-content ',erp_task?'message-erp':'' ,'\">',content,'</div>  </div> </div>');} else {_s.push(' <div class=\"',owner,'-message ',error,'\" ',error ? 'title=\"发送失败\"' : '','> <div class=\"avatar-wrap\" data-uid=\"',uid,'\" data-type=\"user\" data-action=\"user-info\">  <img class=\"avatar\" src=\"',Global.faceUrl,uid,'\"/> </div> <div class=\"content\">  <div class=\"time-wrap\">  <span class=\"date\">',Global.helper.cuteMessageTime.getDate(time),' </span>  <span class=\"time\">',Global.helper.cuteMessageTime.getTime(time),' </span>  </div>  <div class=\"message-content\">',content,'</div> </div> </div>');} return _s;")).apply(null, v).join("");}};});