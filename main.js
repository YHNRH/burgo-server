const http = require("http");
const request = require('request');
var dgram = require('dgram');
var server = dgram.createSocket("udp4");
var url = require('url');

var PORT = 41234;
var BROADCAST_ADDR = "192.168.1.255";
var discoverResult = []

http.createServer(async function(req, res){
     
    res.setHeader("Content-Type", "application/json; charset=utf-8;");
    
    var queryData = url.parse(req.url, true);
    console.dir(queryData)
    if(queryData.pathname === "/api/getudp"){
      res.write(JSON.stringify(await udp()));
      res.end();
    }
    else if(queryData.pathname === '/api/switchstate'){
      var esp = discoverResult.find(el => el.Id == queryData.query.Id);
      res.write(JSON.stringify(await doRequest('http://' + esp.address + '/RELAY=' + queryData.query.RELAY)));
      res.end();
    }
    else{
        res.write("<h2>Not found</h2>");
        res.end();
    }
}).listen(3000);



server.bind(PORT, function() {
    server.setBroadcast(true);
});

server.on('error', (err) => {
  console.error(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  //console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  try{
    var obj = JSON.parse(msg.toString())
    obj.address = rinfo.address;
    discoverResult.push(obj);
  } catch (e){}
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

async function udp(){
  var message = 'discover';
  discoverResult = []
  server.send(message, 0, message.length, PORT, BROADCAST_ADDR, () =>{});
  return await new Promise(function (resolve) {
    setTimeout(()=>{resolve(discoverResult);},200);
    
  });
}

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request.get(url, function (error, res, body) {
      if (!error && res.statusCode === 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}
