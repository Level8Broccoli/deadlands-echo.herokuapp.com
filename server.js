var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var user_list = {};

function broadcast(message) {
  for (var user in user_list) {
    user_list[user].write(JSON.stringify(message));
  }
}

// 1. Echo sockjs server
var sockjs_opts = {
  sockjs_url: "http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js",
  disable_cors: true
};

var sockjs_echo = sockjs.createServer(sockjs_opts);
sockjs_echo.on('connection', function (conn) {
  user_list[conn.id] = conn;
  conn.on('data', function (message) {
    broadcast(JSON.parse(message));
  });
  conn.on("close", function () {
    delete user_list[conn.id];
  })
});

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function (req, res) {
  static_directory.serve(req, res);
});
server.addListener('upgrade', function (req, res) {
  res.end();
});

sockjs_echo.installHandlers(server, {
  prefix: '/echo'
});
const port = process.env.PORT || 3000;
console.log(` [*] Listening on 0.0.0.0:${port}`);
server.listen(port, '0.0.0.0');
