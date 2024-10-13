require('dotenv').config()
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const path = require('path')
const express = require('express')
const app = express()
app.use(express.json())

const PROTO_PATH = path.join(__dirname, 'proto', 'Authentication.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const AuthenticationProto = grpc.loadPackageDefinition(packageDefinition).Authentication;

const AuthenticationClient = new AuthenticationProto.AuthenticationService(
    'localhost:50051',
    grpc.credentials.createInsecure()
)



app.post('/login',(req,res)=>{
    const request= req.body

    AuthenticationClient.Authenticate(request,(error,response)=>{
        if(error){
            res.status(400).json({error:error})
        }
        else{
            //console.log(response)
            res.status(200).json(response)
        }
    })
})

app.post('/signup',(req,res)=>{
    const request = req.body
    AuthenticationClient.SignUp(request,(error,response)=>{
        if(error){
            res.status(400).json({error:error})
        }
        else{
            res.status(200).json(response)
        }
    })
})


const PORT = process.env.PORT || 8081
app.listen(PORT,()=>{
    console.log(`client is listening on ${PORT}`)
})

