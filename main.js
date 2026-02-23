const http = require("http");
const request = require('request');
var dgram = require('dgram');
var server = dgram.createSocket("udp4");
var url = require('url');
var mysql = require('mysql');
const fs = require('fs')
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const axios = require('axios');  // для OpenWeatherMap
//const mqtt = require('mqtt');    // для умного дома

// Загружаем сценарии
const scenariosPath = path.join(__dirname, 'scenarios.json');
let scenarios = [];
if (fs.existsSync(scenariosPath)) {
    const data = fs.readFileSync(scenariosPath, 'utf8');
    scenarios = JSON.parse(data).scenarios;
    //console.dir(scenarios)
    // Компилируем регулярные выражения заранее
    scenarios.forEach(sc => {
       sc.compiled = sc.triggers.map(t => new RegExp(t.pattern, 'iu'));
    });
    console.log(`Loaded ${scenarios.length} scenarios`);
} else {
    console.warn('scenarios.json not found');
}

var con = mysql.createConnection({
  host: "localhost",
  user: "user",
  password: "secret"
});

con.connect(function(err) {
  if (err) throw err;
  con.query('USE burgo;', function (err, result) {
    if (err) throw err;
    console.log("Result: " + result);
  });
  console.log("Connected!");
});


var PORT = 41235;
var BROADCAST_ADDR = "192.168.1.255";
var discoverResult = []

http.createServer(async function(req, res){
     
    res.setHeader("Content-Type", "application/json; charset=utf-8;");
    
    var queryData = url.parse(req.url, true);
    console.dir(queryData)
    if(queryData.pathname === "/api/getudp"){
      var devices = await udp();
      devices.forEach((device, index) => {
        con.query('SELECT NAME FROM device WHERE Id = ' + device.Id, function (err, result) {
          if (err) throw err;
          if (result.length > 0)
            device.Name = result[0].NAME;
          if (index == devices.length-1){
            res.write(JSON.stringify(devices));
            res.end();
          }
        });
      });

    }
    else if(queryData.pathname === '/api/switchstate'){
      var esp = discoverResult.find(el => el.Id == queryData.query.Id);
      res.write(JSON.stringify(await doRequest('http://' + esp.address + '/RELAY=' + queryData.query.RELAY)));
      res.end();
    }
    else if(queryData.pathname === '/api/updatedevice'){
      con.query(
        'INSERT INTO device ' +
        '(ID, NAME) ' +
        'VALUES (' +  queryData.query.Id + ', \'' + queryData.query.name + '\') ' +
        'ON DUPLICATE KEY UPDATE ' +
        'NAME = ' + '\'' + queryData.query.name + '\';'
        , function (err, result) {
        if (err) throw err;
          
        console.dir(result)
        res.write('test');
        res.end();
      });
    }
    else if(queryData.pathname === '/api/test'){
      let body = '';
      req.on('data', (chunk) => {
          body += chunk;
      });
      req.on('end', () => {
      
        fs.appendFile('output.raw', body, (err) => {
            if (err) throw err;
        })

        console.log(body);
        res.write('"okay"'); 
        res.end(); 
      });
    }
    else if (queryData.pathname === '/api/upload') {

    console.dir(req.headers)
    // Генерируем уникальное имя файла (можно использовать дату или UUID)
    const fileName = `recording_${Date.now()}.wav`;
    const filePath = path.join(__dirname, 'uploads', fileName); // папка uploads должна существовать

    // Создаём writeStream для сохранения файла
    const writeStream = fs.createWriteStream(filePath);

    // Обработка ошибок записи
    writeStream.on('error', (err) => {
      console.error('File write error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });

    // Подписываемся на данные запроса и направляем их в файл
    req.pipe(writeStream);

    // Когда запрос закончился (все данные получены)
    req.on('end', () => {
      console.log(`File saved: ${filePath}`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('OK');
    });

    // Обработка ошибок запроса (например, обрыв соединения)
    req.on('error', (err) => {
      console.error('Request error:', err);
      writeStream.destroy(); // закрываем поток записи
      res.statusCode = 500;
      res.end('Request Error');
    });
  }
  else if (queryData.pathname === '/api/upload_raw') {
    const fileName = `raw_${Date.now()}.raw`;
    const filePath = path.join(__dirname, 'uploads', fileName);
    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);
    req.on('end', () => {
        console.log(`Raw saved: ${filePath}`);
        res.end('OK');
    });
  }
  else if (queryData.pathname.startsWith('/api/sounds')) {
    var filepath = __dirname + /\/[a-z]+\/[a-z]+[.](?:mp3|wav)$/.exec(queryData.pathname);
    fs.readFile(filepath, function (error, data) {
      console.log(data.byteLength)
      if (error) {
        res.write(error.message);
        res.end();
      } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200, {
          "Content-type": "audio/mp3",
          "content-length": data.byteLength
        });
        res.write(data);
        res.end();
      }
    });

  }
  else if (queryData.pathname === '/api/command') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        const audioBuffer = Buffer.concat(chunks);
        
        // Сохраняем во временный WAV-файл
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const tempWav = path.join(tempDir, `cmd_${Date.now()}.wav`);
        const tempRawWav = path.join(tempDir, `raw_${Date.now()}.wav`);
        const tempResampledWav = path.join(tempDir, `resp_${Date.now()}.wav`);
        
        fs.writeFileSync(tempWav, audioBuffer);
        
        try {
            // 1. Распознавание речи через Python-скрипт
            const pythonInterpreter = path.join(__dirname, 'venv/bin/python');
            const { stdout, stderr } = await execPromise(`${pythonInterpreter} speech.py ${tempWav}`);
            if (stderr) console.error('STT stderr:', stderr);
            const recognizedText = stdout.trim();
            console.log('Recognized:', recognizedText);
            
            // 2. Обработка текста по сценариям
            let answerText = '';
            let matchedScenario = null;
            let extractedParams = {};
            
            for (const sc of scenarios) {
                for (const regex of sc.compiled) {
                    const match = recognizedText.match(regex);
                    if (match) {
                        matchedScenario = sc;
                        extractedParams = match.groups || {};
                        break;
                    }
                }
                if (matchedScenario) break;
            }
            
            if (matchedScenario) {
                console.log('Matched scenario:', matchedScenario.name);
                // Выполняем действие
                switch (matchedScenario.action.type) {
                    case 'weather':
                        const city = extractedParams.city || matchedScenario.action.city_default || 'Москва';
                        try {
                            const apiKey = process.env.OPENWEATHER_API_KEY; // задайте в окружении
                            const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=ru`;
                            const response = await axios.get(url);
                            const data = response.data;
                            const temp = Math.round(data.main.temp);
                            const description = data.weather[0].description;
                            answerText = matchedScenario.response_template
                                .replace('{city}', city)
                                .replace('{temp}', temp)
                                .replace('{description}', description);
                        } catch (e) {
                            console.error('Weather API error:', e);
                            answerText = 'Не удалось получить погоду';
                        }
                        break;
                        
                    case 'get_time':
                        const now = new Date();
                        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        answerText = matchedScenario.response_template.replace('{time}', timeStr);
                        break;
                        
                    case 'mqtt':
                        // Здесь нужно подключиться к вашему MQTT брокеру
                        const mqttClient = mqtt.connect('mqtt://localhost'); // укажите свой брокер
                        const room = extractedParams.room || 'комнате';
                        const topic = matchedScenario.action.topic.replace('{room}', room);
                        const payload = matchedScenario.action.payload;
                        
                        mqttClient.on('connect', () => {
                            mqttClient.publish(topic, payload, () => {
                                mqttClient.end();
                            });
                        });
                        answerText = matchedScenario.response_text.replace('{room}', room);
                        break;
                        
                    default:
                        answerText = 'Команда распознана, но действие не настроено';
                }
            } else {
                answerText = 'Извините, я не поняла команду';
            }
            
            console.log('Answer:', answerText);
            
            // 3. Генерация речи через RHVoice
            const ttsCmd = `echo "${answerText}" | RHVoice-test -p anna --quality min -o ${tempRawWav}`;
            await execPromise(ttsCmd);

            const targetRate = 66000; // замените на частоту вашего I2S (например, 44100 или 16000)
            const ffmpegCmd = `ffmpeg -i ${tempRawWav} -ar ${targetRate} -ac 1 -c:a pcm_s16le ${tempResampledWav} -y`;
            await execPromise(ffmpegCmd);

            // 4. Отправка ответа
            const responseAudio = fs.readFileSync(tempResampledWav);
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', responseAudio.length);
              res.end(responseAudio);
            
        } catch (err) {
            console.error('Command processing error:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        } finally {
            // Удаляем временные файлы
            fs.unlink(tempWav, () => {});
            fs.unlink(tempRawWav, () => {});
            fs.unlink(tempResampledWav, () => {});
        }
    });
  }
    else{
        res.write("<h2>Not found</h2>");
        res.end();
    }
}).listen(3001);

// Создаём папку uploads, если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}


server.bind(PORT, function() {
    server.setBroadcast(true);
});

server.on('error', (err) => {
  console.error(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
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
