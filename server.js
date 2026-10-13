// 安裝必要套件: npm install express socket.io
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 託管前端靜態檔案
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`玩家連線: ${socket.id}`);

    // 建立房間
    socket.on('create-room', (roomId) => {
        socket.join(roomId);
        console.log(`房主 ${socket.id} 建立了房間: ${roomId}`);
        socket.emit('room-created', roomId);
    });

    // 加入房間
    socket.on('join-room', (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room && room.size === 1) {
            socket.join(roomId);
            console.log(`玩家 ${socket.id} 加入了房間: ${roomId}`);
            // 通知房主有人加入了，可以開始建立 P2P WebRTC 連線
            socket.to(roomId).emit('peer-joined', socket.id);
            socket.emit('joined-room', roomId);
        } else {
            socket.emit('room-error', '房間不存在或人數已滿！');
        }
    });

    // WebRTC 信令轉發 (Offer / Answer / ICE Candidate)
    socket.on('signal', (data) => {
        // 將訊息轉發給房間內的另一方
        socket.to(data.roomId).emit('signal', {
            sender: socket.id,
            signal: data.signal
        });
    });

    socket.on('disconnect', () => {
        console.log(`玩家斷線: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`信令伺服器運行中：http://localhost:${PORT}`);
});