var io = require('socket.io')();
var spawn = require('child_process').spawn;
var getport = require('get-port');
var request = require("request");
var winston = require("winston");
// initiate Logger 
var logger = new winston.Logger({
  transports: [
    new (winston.transports.Console) (),
    new (winston.transports.File) ({filename: '/var/log/streaming.log'})
    ]
  }
  );

var subtitles = require('./subtitles.js');

var processes = {};

io.on('connection', function(socket){
  console.log("Connected users : " + io.sockets.sockets.length);

  socket.on('disconnect', function(){
    console.log("Connected users : " + io.sockets.sockets.length);

    if(socket.playing) { // There was already a stream running
      processes[socket.playing].spectators--;
      if(processes[socket.playing].spectators === 0) {
        processes[socket.playing].child.kill();
        delete processes[socket.playing];
      }
    }
  });

  socket.on('msg', function(msg){

    if(msg['getSubs']) {
      console.log(msg['getSubs'][0]);
      request({url: msg['getSubs'][0], encoding: null}, function(error, response, data){
        if (!error && response.statusCode == 200) {
          var path = require('path');

          subtitles.decompress(data, function(dataBuf) {
              subtitles.decode(dataBuf, msg['getSubs'][1], function(dataBuff) {
                socket.emit('dataBuf', dataBuff);
              });
          });

        }else{
          console.log('Failed to download subtitle!', error, response);
          logger.log('error','Failed to download subtitle!', error, response);
        }
      });
    }

    if(msg['url_request']) {
      var url = msg['url_request'];
      logger.log('info',"URL Request" + url);
      request(url, function(error, response, body) {
        socket.emit('url_request', body);
      });
    }

    if(msg['torrent'] && !msg['torrent'].stream_stop) {

      getport(function (err, port) {
        if (err)
        { 
          logger.log('error',err);
          console.log(err);
        }

        console.log(msg['torrent']);
        logger.log('info',"------------------Message Torrent : " + JSON.stringify(msg['torrent']) + "------------------");
        logger.log('info',"------------------OPEN PORT ON : " + port + "------------------");

        if(!processes[msg.torrent.stream[0]]) {
          var process = {};

          var child = spawn('peerflix', [msg.torrent.stream[0], '--port='+ port, '--tmp=./tmp', '--remove'], {});


          process.port = port;
          process.spectators = 0;
          process.child = child;

          processes[msg.torrent.stream[0]] = process;

          child.stdout.on('data', function(data) {
            logger.log('info','Peerflix Data' +data);
            //console.log('stdout: ' + data);
          });
          child.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
          });
          child.on('close', function (code, signal) {
            logger.log('error','child process terminated due to receipt of signal '+signal);
            console.log('child process terminated due to receipt of signal '+signal);
          });
        }
        else port = processes[msg.torrent.stream[0]].port;

        processes[msg.torrent.stream[0]].spectators++;

        if(socket.playing) { // There was already a stream running
          processes[socket.playing].spectators--;
          if(processes[socket.playing].spectators === 0) {
            processes[socket.playing].child.kill();
            delete processes[socket.playing];
          }
        }

        socket.playing = msg.torrent.stream[0];

        console.log("------------------RUNNING PROCESSES------------------");
        logger.log('info',"------------------RUNNING PROCESSES------------------");
        for(var p in processes) {
          console.log(p + " | Port:" + processes[p].port + " | Spectators: " + processes[p].spectators);
          logger.log('info',p + " | Port:" + processes[p].port + " | Spectators: " + processes[p].spectators);
        }
        console.log("-----------------------------------------------------");
        logger.log('info',"-----------------------------------------------------");
        socket.emit('streamUrl', port);
        logger.log('info','streamUrl :  '+ port);
      });
    }
  });
});
io.listen(3000);
