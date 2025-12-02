import { Server } from "socket.io";
import "dotenv/config";

const origins = (process.env.ORIGIN ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const io = new Server({
  cors: {
    origin: origins
  }
});

const port = Number(process.env.PORT);
io.listen(port);
console.log(`Server is running on port ${port}`);

let peers: Record<string, { name: string | null }> = {};

io.on("connection", (socket) => {
  if (!peers[socket.id]) {
    peers[socket.id] = { name: null };
    socket.emit("introduction", Object.entries(peers));
    io.emit("newUserConnected", { id: socket.id, name: null });
    console.log("Peer joined:", socket.id);
  }

  socket.on("setName", (realName: string) => {
    if (peers[socket.id] && peers[socket.id].name !== realName) {
      peers[socket.id].name = realName;
      io.emit("userNameUpdated", { id: socket.id, name: realName });
      console.log(`Name set for ${socket.id}: ${realName}`);
    }
  });
  

  socket.on("signal", (to, from, data) => {
    if (to in peers) {
      io.to(to).emit("signal", to, from, data);
    }
  });

  socket.on("disconnect", () => {
    delete peers[socket.id];
    io.sockets.emit("userDisconnected", socket.id);
    console.log("Peer disconnected:", socket.id);
  });
});
