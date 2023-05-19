const express = require('express')
const cors = require('cors')
const http = require('http')
const bodyParser = require('body-parser')
const app = express()

// Middleware para habilitar o CORS
app.use(cors())
app.use(bodyParser.json())

// Middleware personalizado para lidar com o createServer
app.use((req, res, next) => {
  // Configura o cabeçalho da resposta HTTP
  res.writeHead(200, { 'Content-Type': 'text/plain' })

  // Escreve a resposta
  res.end('Hello, OkHttp client!')

})

// Rota para receber as mensagens
app.post('/', (req, res) => {
  const message = req.body
  console.log(`Nova mensagem recebida: ${message}`)
  res.end('Resposta recebida: ' + message)
})

// Cria o servidor HTTP
const server = http.createServer(app)

// Inicia o servidor e o faz escutar na porta 3000
server.listen(3000, 'localhost', () => {
  console.log('Servidor rodando em http://localhost:3000/')
})
