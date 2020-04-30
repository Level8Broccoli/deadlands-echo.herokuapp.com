var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var connections = {};

function broadcast(message) {
  for (var i in connections) {
    connections[i].write(message);
  }
}

var sockjsOptions = {
  sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js"
};

var sockjsServer = sockjs.createServer(sockjsOptions);
sockjsServer.on('connection', function (conn) {
  connections[conn.id] = conn;
  conn.on('data', function (message) {
    conn.write(message);
    broadcast(message);
  });
  conn.on("close", function () {
    delete connections[conn.id];
  })
});

var static_directory = new node_static.Server(__dirname);

var server = http.createServer(function(req,res){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}
});
server.addListener('request', function (req, res) {
  static_directory.serve(req, res);
});
server.addListener('upgrade', function (req, res) {
  res.end();
});

sockjsServer.installHandlers(server, {
  prefix: '/echo'
});

const port = process.env.PORT || 3000;
console.log(` [*] Listening on 0.0.0.0:${port}`);
server.listen(port, '0.0.0.0');
