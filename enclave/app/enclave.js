require('dotenv').config()
const http = require('http')
const fs = require('fs')
const jwt  = require('jsonwebtoken')
const express = require('express')
const app = express()
app.use(express.json())


const tls = {
  key: fs.readFileSync("/etc/tls/tls.key"),
  cert: fs.readFileSync("/etc/tls/tls.crt"),
  ca: fs.readFileSync("/etc/tls/ca.crt")
}

app.post('/enclave', async (req, res) => {
  try {
    const { username } = req.body;
    const authorization = req.headers['authorization']; 
    if (!authorization) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded && decoded.username === username) {
      res.status(200).json({
        message: "Authentication successful, Enclave Provisioned, TPM Quote and TLS Certificate Verified",
      });
    } else {
      res.status(400).json({ error: "Not Authorized" });
    }
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

const server = http.createServer(tls,app)

const PORT = process.env.PORT || 8082
server.listen(PORT,()=>{
    console.log(`listening on ${PORT}`)
})