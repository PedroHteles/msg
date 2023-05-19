// Import required modules
const express = require('express')
var bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())
const http = require('http').createServer(app)

// @ts-ignore
const io = require('socket.io')(http)

// Set up express app
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})

app.post("/mensagem", (req, res) => {
  const body = req.body
  io.emit("chat message", JSON.stringify(body))
  return res.status(2000)
})
// Handle incoming socket connections
io.on('connection', function (socket) {

  socket.on('chat message', function (msg) {
    io.emit('chat message', msg) // Broadcast message to all connected sockets
  })

  // Handle disconnections
  socket.on('disconnect', function () {
    console.log('A user disconnected.')
  })
})

// Start the server
http.listen(3000, function () {
  console.log('Server started on port 3000.')
})