const WebSocketServer = require('websocket').server
const http = require('http')
const express = require('express')

const app = express()
app.use(express.json())
const server = http.createServer(app)

// Configuração do servidor WebSocket
const wsServer = new WebSocketServer({ httpServer: server })

// Armazena todas as conexões ativas
const connections = []

wsServer.on('request', (request) => {

  const connectionParams = request.resourceURL
  console.log(connectionParams.query?.idUsuario)
  const connection = request.accept(null, request.origin)
  connections.push(connection) // Adiciona a nova conexão à lista
  // console.log('Nova conexão estabelecida.')
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      try {
        const receivedMessage = JSON.parse(message.utf8Data)
        connections.forEach((connection) => {
          const message = {
            idMatricula: receivedMessage.idMatricula,
            mensagem: receivedMessage.mensagem
          }
          connection.sendUTF(JSON.stringify(message))
        })
      } catch (error) {
        console.error('Erro ao analisar a mensagem JSON:', error)
        connection.sendUTF(JSON.stringify({ status: 'error', message: 'Erro ao analisar a mensagem JSON.', }))
      }
    }
  })
  // Remove a conexão da lista de conexões ativas
  connection.on('close', () => {
    const index = connections.indexOf(connection)
    if (index !== -1) connections.splice(index, 1)
  })
})

// Rota para enviar uma mensagem para todas as conexões WebSocket
app.post('/enviar-mensagem', (req, res) => {
  const message = {
    idMatricula: req.body.idMatricula,
    mensagem: req.body.mensagem
  }
  connections.forEach((connection) => {
    connection.sendUTF(
      JSON.stringify(message)
    )
  })
  res.json({ status: 'success', message: 'Mensagem enviada com sucesso.' })
})
// Sobe o servidor na porta 3000
server.listen(3000, () => { console.log('Servidor WebSocket está ouvindo na porta 3000...') })