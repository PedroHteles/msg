const WebSocketServer = require('websocket').server
const http = require('http')
const express = require('express')
const sqlite3 = require('sqlite3').verbose()

// Crie uma conexão com o banco de dados SQLite
const db = new sqlite3.Database('mensagens.db')

const app = express()
app.use(express.json())
const server = http.createServer(app)

// Configuração do servidor WebSocket
const wsServer = new WebSocketServer({ httpServer: server })

// Armazena todas as conexões ativas
const connections = []

db.run(`CREATE TABLE IF NOT EXISTS mensagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idMatricula INTEGER,
  mensagem TEXT,
  enviado INTEGER
)`)

wsServer.on('request', (request) => {
  const connectionParams = request.resourceURL
  const connection = request.accept(null, request.origin)
  connection.idUsuario = connectionParams.query?.idUsuario
  connections.push(connection) // Adiciona a nova conexão à lista
  verificarConexoesAtivas(connection.idUsuario)
  // console.log('Nova conexão estabelecida.')
  connection.on('message', async (message) => {
    if (message.type === 'utf8') {
      try {
        const receivedMessage = JSON.parse(message.utf8Data)
        // Insira a mensagem na tabela 'mensagens' somente se o usuário estiver offline
        const targetConnection = connections.find((conn) => conn.idUsuario === receivedMessage.idMatricula)
        if (!targetConnection || !targetConnection.connected) {
          const insertQuery = 'INSERT INTO mensagens (idMatricula, mensagem, enviado) VALUES (?, ?, ?)'
          await runQuery(insertQuery, [receivedMessage.idMatricula, receivedMessage.mensagem, 0])
          console.log('Mensagem inserida com sucesso:', this.lastID)
        } else {
          targetConnection.sendUTF(JSON.stringify({ idMatricula: receivedMessage.idMatricula, mensagem: receivedMessage.mensagem }))
        }
      } catch (error) {
        console.error('Erro ao analisar a mensagem JSON:', error)
        connection.sendUTF(JSON.stringify({ status: 'error', message: 'Erro ao analisar a mensagem JSON.' }))
      }
    }
  })

  // Remove a conexão da lista de conexões ativas
  connection.on('close', () => {
    const index = connections.indexOf(connection)

    // Remover mensagens do banco de dados associadas ao usuário
    const deleteQuery = `DELETE FROM mensagens WHERE idMatricula = ?`
    runQuery(deleteQuery, [connection.idUsuario], (err, result) => {
      if (err) {
        console.error('Erro ao remover mensagens do banco de dados:', err)
      } else {
        console.log('Mensagens removidas com sucesso:', result.affectedRows)
      }
    })

    if (index !== -1) {
      connections.splice(index, 1)
    }
  })

})

process.on('exit', () => {
  db.close()
})

// Função utilitária para execução de queries com prepared statements
function runQuery(query, params) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve(this)
      }
    })
  })
}

// Função para verificar as conexões ativas
function verificarConexoesAtivas(idUsuario) {
  const sql = 'SELECT * FROM mensagens WHERE idMatricula = ? AND enviado = 0'
  db.all(sql, [idUsuario], (err, rows) => {
    if (err) {
      console.error('Erro ao consultar mensagens:', err)
    } else {
      console.log(rows, idUsuario)
      rows.forEach((row) => {
        const idMatricula = row.idMatricula
        const mensagem = row.mensagem
        const connection = connections.find((conn) => conn.idUsuario == idMatricula)
        if (connection && connection.connected) {
          const message = {
            idMatricula: idMatricula,
            mensagem: mensagem
          }
          console.log("msg enviada")
          connection.sendUTF(JSON.stringify(message))
        }
      })
    }
  })
}

app.post('/enviar-mensagem', (req, res) => {
  const message = {
    idMatricula: req.body.idMatricula,
    mensagem: req.body.mensagem
  }
  connections.forEach((connection) => {
    connection.sendUTF(JSON.stringify(message))
  })
  res.json({ status: 'success', message: 'Mensagem enviada com sucesso.' })
})

server.listen(3000, () => {
  console.log('Servidor WebSocket está ouvindo na porta 3000...')
})
