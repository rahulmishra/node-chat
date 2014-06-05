var http = require("http");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var mime = require("mime");
var path = require("path");
var chatServer = require('./lib/chat_server');


var cache = {};

var server = http.createServer(function (request, response) {

  var filePath = false;
  console.log("Request URL is " + request.url);
  if (request.url == "/") {
    filePath = "public/index.html";
  } else {
    filePath = "public/" + request.url;
  }

  var absPath = "./" + filePath;

  serveStatic(response, cache, absPath);

});

chatServer.listen(server);

server.listen(8080, function () {
  console.log("server is now listening on 8080");
});

function send404(response) {
  response.writeHead(404, {"Content-Type": "text/plain"});
  response.write("Error 404: resource not found.");
  response.end();
}


function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {"Content-Type": mime.lookup(path.basename(filePath))});
  response.end(fileContents);
}


function serveStatic(response, cache, absPath) {

  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
     fs.readFileAsync(absPath).then(function (fileContent) {
      sendFile(response, absPath, fileContent);
    }).catch(function () {
      send404(response);
    });

  }

}