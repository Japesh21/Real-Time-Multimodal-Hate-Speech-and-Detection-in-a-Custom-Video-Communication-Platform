const meetingSockets = require("./meeting.sockets");
const aiSockets = require("./ai.sockets");

module.exports = function(io) {

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    meetingSockets(io, socket);
    aiSockets(io, socket);

  });

};