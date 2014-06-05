var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {

  io = socketio.listen(server);
  io.set('log level', 1);

  io.on('connection', function (socket) {

    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    joinRoom(socket, 'Lobby');

    handleMessageBroadcasting(socket, nickNames);

    handleNameChangeAttempts(socket, nickNames, namesUsed);

    handleRoomJoining(socket);

//    socket.on('rooms', function () {
//      socket.emit('rooms', io.sockets.manager.rooms);
//    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });


  function assignGuestName(socket, guestNumber, nickNames, namesUsed) {

    var name = "Guest " + guestNumber;

    nickNames[socket.id] = name;

    socket.emit("nameResult", {"Success": true, "name": name});

    namesUsed.push(name);

    return guestNumber + 1;

  }

  function joinRoom(socket, room) {

    socket.join(room);

    currentRoom[socket.id] = room;

    socket.emit('joinResult', {"room": room});

    socket.to(room).emit("message", {
      "text": nickNames[socket.id] + " has joined the room"
    })

    var clientsOnSocket = io.sockets.connected;
  }


  function handleNameChangeAttempts(socket, nickNames, namesUsed) {

    socket.on('nameChangeAttempt', function (name) {

        if (name.indexOf("Guest") === 0) {
          socket.emit("nameResult", {"success": false, "message": "Names cannot begin with 'Guest'"});
        } else {

          if (namesUsed.indexOf(name) === -1) {

            var previousName = nickNames[socket.id];

            delete namesUsed[namesUsed.indexOf(previousName)];

            nickNames[socket.id] = name;
            namesUsed.push(name)

            socket.emit("nameResult", {"success": true,
              "name": name
            });

            socket.to(currentRoom[socket.id]).emit("message", {
                "text": previousName + " is now known as " + name
              }
            )
          }
          else {
            socket.emit("nameResult", {"success": false, "message": "This name is already in use"});
          }

        }


      }
    )
    ;
  }

  function handleMessageBroadcasting(socket, nickNames) {

    socket.on('message', function (message) {

      socket.to(message.room).emit('message', {
        "text": nickNames[socket.id] + " : " + message.text
      });
    })

  }

  function handleRoomJoining(socket) {
    socket.on('join', function (room) {
      socket.leave(currentRoom[socket.id]);
      joinRoom(socket, room.newRoom);
    });
  }

  function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
      var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
      delete namesUsed[nameIndex];
      delete nickNames[socket.id];
    });
  }


}
