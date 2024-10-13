require('dotenv').config()
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const jwt  = require('jsonwebtoken')
const path = require('path')
const provisionEnclave = require('./provisionEnclave')
const User = require('./models/user')



const PROTO_PATH = path.join(__dirname, 'proto', 'Authentication.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const AuthenticationProto = grpc.loadPackageDefinition(packageDefinition).Authentication;



/*
enclaveLaunch = async (call,callback) => {
    const {username,token} = call.request
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
    if(!decoded){
        callback(null,{
            success: false,
            enclave_name:"",
            access_point:""
        })
    } else {
        callback(null,{
            success: true,
            enclave_name:"Secure Enclave",
            access_point:"https://localhost:443"
        })
    }
}
*/


authenticate = async (call,callback) =>{
    const {username,password} = call.request
    console.log("username = ",username)
    console.log("password = ",password)
    const foundUser = await User.findOne({username,password})
    console.log("founduser = ", foundUser)
    if(foundUser && foundUser.password==password){
        //const token = jwt.sign({username},process.env.JWT_SECRET_KEY,{ expiresIn: '1h' })
        const enclaveName = await provisionEnclave(username)
        //console.log(`/${enclaveName}`)
        callback(null,{
            success: true,
            message: "Authentication successful",
            enclaveName: enclaveName,
            accessPoint: `/${enclaveName}`,
            //token:token,
        })
    } else {
        callback(null,{
            success: false,
            message: "Invalid credentials",
            //token:"",
        })
    }
}


signup = async (call,callback) =>{
    const {username,password} = call.request
    const savedUser = await User.create({username,password})
    if(savedUser){
        callback(null,{
            success:true,
            message:"Signed up successfully"
        })
    } else {
        callback(null,{
            success:false,
            message:"failed to Sign up"
        })
    }
}




function main(){
    const server = new grpc.Server()
    server.addService(AuthenticationProto.AuthenticationService.service, {
        Authenticate: authenticate,
        SignUp: signup,
    })

    const port = '0.0.0.0:50051'
    server.bindAsync(port, grpc.ServerCredentials.createInsecure(),()=>{
        console.log(`gRPC Licensing Server running at ${port}`)
    })
}

main()

