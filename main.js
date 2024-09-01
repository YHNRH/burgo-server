const http = require("http");
const request = require('request');

http.createServer(async function(req, res){
     
    res.setHeader("Content-Type", "application/json; charset=utf-8;");
     
    if(req.url === "/home" || req.url === "/"){
        res.write("<h2>Home</h2>");
        res.end();
    }
    else if(req.url == "/api/get"){
        res.write(JSON.stringify(await getActiveAdresses()));
        res.end();
    }
    else{
        res.write("<h2>Not found</h2>");
        res.end();
    }
}).listen(3000);

async function getActiveAdresses(){
    var arr = [];
    for (var i = 2; i <= 100; i++){
        try{
            var a = JSON.parse(await doRequest('http://192.168.1.' + i + '/STATUS'));
            a.addr = '192.168.1.' + i;
            arr.push(a);
        } catch(e){}
    }
    return arr;
}


function doRequest(url) {
    return new Promise(function (resolve, reject) {
      request.get(url, {timeout: 30}, function (error, res, body) {
        if (!error && res.statusCode === 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
}
