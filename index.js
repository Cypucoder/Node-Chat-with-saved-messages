var app = require('express')();
var mysql = require('mysql');
var http = require('http').Server(app);
var io = require('socket.io')(http);
//Used for demo purposes to temporarily save nicknames to server
var nicknames = [];

var pool = mysql.createPool({
    //conectionLimit: 100, 
    host: 'localhost', 
    user: 'root', 
    password: 'password', 
    database: 'message'
    //port: 3000;
});



app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var socket; //via advice from Spyri

io.on('connection', function(socket){
      console.log('a user connected');
    
      socket.on('disconnect', function(){
      console.log('user disconnected');
      });
    
    
      socket.on('chat message', function(msg){
          console.log(socket.nickname + ': ' + msg);
         //get_nick();
          //get_status();
        io.emit('chat message', {Status: msg, User: socket.nickname});
          add_status(msg.Status, socket.nickname,function(res){
        if(res){
            io.emit('refresh feed', msg);
            console.log('refresh feed, status ');
        } else {
            io.emit('error');
            console.log('there was an error under socket.on chat message');
        }
      });
          });

        //used in updating temporary nicknames
      socket.on('new user', function(data, callback){
        if (nicknames.indexOf(data) != -1){
            callback(false);
        } else{
            callback(true);
            socket.nickname = data;
            nicknames.push(socket.nickname);
            io.emit('usernames', nicknames);
            updateNicknames();
            console.log(get_l5());
            socket.emit('l5', {data : get_l5()});
        }
  });
    
    function updateNicknames() {
        io.sockets.emit('usernames', nicknames);        
    }
    
      socket.on('disconnect', function(data){
          if(!socket.nickname) return;
          nicknames.splice(nicknames.indexOf(socket.nickname), 1);
          updateNicknames();
  });
    
});

var add_status = function (msg, nick, callback) {
    pool.getConnection(function(err, connection){
        if(err){
            console.log('there was an issue in the add_status section');
            connection.release();
            callback(false);
            return;
        }
        
        connection.query("INSERT INTO `status` (`User`, `Status`) VALUES ('" + nick + "', '" + msg + "')", function(err, rows){
            connection.release();
            if(!err) {
                callback(true);
            }
        });
        
        connection.on('error', function(err) {
            callback(false);
            return;
        });
    });
}

var get_l5 = function(){
   //var stat = connection.query('SELECT `status` FROM `status` WHERE idStatus=5');
    var r;
     pool.getConnection(function(err, connection){
        if(err){
            console.log('there was an issue in the get_l5 section');
            connection.release();
            callback(false);
            return;
        }
        connection.query("SELECT `User`, `status` FROM `status` LIMIT 10", function(err, results){
            console.log(results);
            connection.release();
            r = results;
           
        });
    });
    return r;    
};

http.listen(3000, function(){
  console.log('listening on *:3000');
});