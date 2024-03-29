//jshint esversion:6
const express       = require('express');
const path          = require('path');
const http          = require('http');
const socketio      = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
    } = require('./utils/users');


const app     = express();
const server  = http.createServer(app);
const io      = socketio(server);

const BotName = 'Wireless Bot';

// set static folfer
app.use(express.static(path.join(__dirname,'public')));

//Run when a client connects
io.on('connection', socket=>{

    socket.on('joinRoom',({username,room})=>{

        const user = userJoin(socket.id,username,room);
        socket.join(user.room);

        // Welcome current user
        socket.emit('message',formatMessage(BotName,'Welcome to Wirless chat!'));

        //Broadcast(to everyone) when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(BotName,`${user.username} has joined the chat` ));

        // Send users and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    //listen for chatMessage
    socket.on('chatMessage', msg=>{ 

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    // Runs when a user disconnects
    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message',formatMessage(BotName,`${user.username } has left the chat`));
            
            // Send users and room info
            io.to(user.room).emit('roomUsers',{
                 room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

});

server.listen(process.env.PORT||5000, ()=>
    console.log("Server running on port 3000"));
