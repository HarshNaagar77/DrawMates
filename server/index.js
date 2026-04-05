// importing necessary dependencies

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// importing routes
import authRoute from './routes/authRoute.js';
import connectDB from './config/dbconfig.js';


// configuring dotenv path
dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 4000;
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

// creating an express app
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigins
    }
})


// setting corsOptions

const corsOptions = {
    origin: corsOrigins,
    credentials: true
}

// configuring app middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// defining routes
app.use("/api/auth", authRoute);

let connections = [];

io.on('connection', (socket) => {
    connections.push(socket)
    console.log(`New user connected : ${socket.id}`)




    socket.on('createRoom', ({ roomName }) => {
        console.log(`${socket.id} created room : ${roomName}`);
        socket.join(roomName);
        emitRoomCount(roomName);
    });


    // Join existing room
    socket.on('join-room', ({ roomName }) => {
        console.log(`${socket.id} joined room : ${roomName}`);
        socket.join(roomName);
        emitRoomCount(roomName);
    });

    // Handle get-room-count request
    socket.on('get-room-count', ({ roomName }) => {
        emitRoomCount(roomName);
    });


    // Listen for drawing events and broadcast to room
    socket.on('drawing', ({ roomName, drawingData }) => {
        // Broadcast to all other users in the room
        socket.to(roomName).emit('drawing', { drawingData });
    });

    // Listen for clear-canvas event and broadcast to room
    socket.on('clear-canvas', ({ roomName }) => {
        socket.to(roomName).emit('clear-canvas');
    });


    socket.on('disconnect', (reason) => {
        connections = connections.filter((con) => con.id !== socket.id);
        // For all rooms this socket was in, emit updated count
        for (const roomName of socket.rooms) {
            if (roomName !== socket.id) {
                emitRoomCount(roomName);
            }
        }
    })

    // Helper to emit room count
    function emitRoomCount(roomName) {
        const room = io.sockets.adapter.rooms.get(roomName);
        const count = room ? room.size : 0;
        io.to(roomName).emit('room-count', { count });
    }
})

// connecting database and starting server
connectDB()
    .then(() => {
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(` Server is running at port : ${PORT}`);
            app.get("/", (req, res) => { 
                res.status(201).send("Hi, from index.js ! server is running successfully.");
            })
        })
    })
    .catch((error) => {
        console.log("Error starting the server !!", error);
    })
