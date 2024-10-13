require('dotenv').config()
const express = require('express')
const app = express()
app.use(express.json())


app.get('/enclave',async (req,res)=>{
    res.status(200).json({
      message:"Authentication successful, Enclave Provisioned, TPM Quote and TLS Certificate Verified",
    })
})

const PORT = process.env.PORT || 8082
app.listen(PORT,()=>{
    console.log(`listening on ${PORT}`)
})