define(function(){return {render:function(map) {var p=[],v =[];for(var i in map) {p.push(i);v.push(map[i]);}return (new Function(p, "var _s=[];_s.push(' <div class=\"group-search\" data-role=\"group-search\">  <div class=\"group-serach-header\">  <input class=\"group-search-input\" type=\"text\" placeholder=\"请输入群名称关键字/群号\" data-role=\"search-input\"/>  <div class=\"submit-btn\" data-role=\"submit-btn\" >查找</div>  </div>  <div class=\"group-empty-tip\">  <div class=\"arrow\">  <div class=\"arrow-in\"></div>  <div class=\"arrow-out\"></div>  </div>  <div class=\"error-content\">  查找内容不能为空  </div>  </div>  <div class=\"group-search-bar\">  <div class=\"group-search-result-txt\">搜索了\"<span>',gname,'</span>\"找到<span>',gcount,'</span>个群</div>  <div class=\"group-search-del \" data-role=\"group-search-del\" >x</div>  <div class=\"group-search-page\" id=\"pages\"></div>  </div>  <div class=\"group-search-result-container\">  </div> </div>'); return _s;")).apply(null, v).join("");}};});