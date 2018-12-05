const http = require('http');
const fs = require('fs');

var ip = require('ip').address();


http.createServer( function(request, response) {
	if (request.url.match(/\/cards\/.*\.png/)) {
		var fileName = "." + request.url;
		fs.exists(fileName, function (exists) {
			if (!exists) {
				return send404(response);
			}

			var file = fs.readFile(fileName, function(err, buffer) {
				if (err) {
					return send404(response);		
				}
				response.setHeader('Content-type', 'image/png');
				response.end(buffer);
			})
		});
	} else if (request.url == "/") {
		fs.readFile("./client.html", function(err, file) {
			if (err) {
				return send404(response);		
			}

			file = file.toString()
						.replace("WEB_SOCKET_URL", "ws:/" + ip + ":8080");
			response.end(file);
		});
	} else {
		send404(response);
	}
}).listen(8000);

function send404(response) {
	response.statusCode = 404;
	response.end("File not found");
}