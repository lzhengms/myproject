define(function(){return {render:function(map) {var p=[],v =[];for(var i in map) {p.push(i);v.push(map[i]);}return (new Function(p, "var _s=[];_s.push(' <div class=\"group-info\" data-gid=\"',gid,'\" data-type=\"group\" data-role=\"group-search\">  <div class=\"top-part\">  <div class=\"item-title\">群号码：<span class=\"item-content\" data-role=\"group-id\">',gid,'</span></div>  <div class=\"item-title\">创建人：<span class=\"item-content\" data-role=\"group-creator\">',creator,'(',creatorid,')</span></div>  <div class=\"item-title\">群名称：<span class=\"item-content\" data-role=\"group-name\">',groupname,'</span></div>  <div class=\"item-title\">群分类：<span class=\"item-content\" data-role=\"group-type\">',type,'</span></div>  <div style=\"clear: both\"></div>  </div>  <div class=\"bottom-part\">  <div class=\"item-title\">群公告：</div>  <div class=\"group-notice item-content\" data-role=\"group-notice\">',notice,'</div>  <div class=\"item-title\">群简介：</div>  <div class=\"group-intro item-content\" data-role=\"group-intro\">',intro,'</div>  </div>');if(group_search){_s.push('  <div class=\"talk-to-btn\" data-role=\"join-group\" data-gid=\"',gid,'\" data-gname=\"',groupname,'\">申请加入</div>');}else{_s.push('  <div class=\"talk-to-btn\" data-action=\"talk-to\">发消息</div>');}_s.push(' </div>'); return _s;")).apply(null, v).join("");}};});