define(function() {
	var local = 'http://web91u.local/static/js';
	//var remote = 'http://imnd.99.com/static/public/js/dist';
	//var local = 'http://web91u.local/';
	var remote = 'http://testoand.99.com/webchat/static/js';

	seajs.on('fetch', function(data) {
		if (data.uri) {
			data.requestUri = data.uri.replace(remote, local);
		}
	});

});
