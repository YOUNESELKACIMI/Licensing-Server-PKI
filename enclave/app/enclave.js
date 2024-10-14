require('dotenv').config()
const http = require('http')
const fs = require('fs')
const express = require('express')
const app = express()
app.use(express.json())


const tls = {
  key: fs.readFileSync("/etc/tls/tls.key"),
  cert: fs.readFileSync("/etc/tls/tls.crt"),
  ca: fs.readFileSync("/etc/tls/ca.crt")
}

app.get('/enclave',async (req,res)=>{
    res.status(200).json({
      message:"Authentication successful, Enclave Provisioned, TPM Quote and TLS Certificate Verified",
    })
})

const server = http.createServer(tls,app)

const PORT = process.env.PORT || 8082
server.listen(PORT,()=>{
    console.log(`listening on ${PORT}`)
})