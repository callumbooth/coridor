const { Server } = require("socket.io");

const io = new Server({ cors: { origin: "http://localhost:5173" } });

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("joinRoom", (id) => {
    console.log("joining room", id);
    socket.join(id);
  });

  socket.on("playerMoved", (roomId, data) => {
    socket.to(roomId).emit("opponentMoved", data);
  });

  console.log("rooms", socket.rooms);
});

io.listen(3000);
