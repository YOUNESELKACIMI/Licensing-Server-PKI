require('dotenv').config()
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const jwt  = require('jsonwebtoken')
const bcrypt = require('bcrypt');
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


authenticate = async (call, callback) => {
    const { username, password } = call.request;

    const foundUser = await User.findOne({ username });

    if (foundUser) {
        const match = await bcrypt.compare(password, foundUser.password);
        
        if (match) {
            const token = jwt.sign({ username }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
            const enclaveName = await provisionEnclave(username);
            callback(null, {
                success: true,
                message: "Authentication successful",
                enclaveName: enclaveName,
                accessPoint: `/${enclaveName}`,
                token: token,
            });
        } else {
            callback(null, {
                success: false,
                message: "Invalid credentials",
                token: "",
            });
        }
    } else {
        callback(null, {
            success: false,
            message: "Invalid credentials",
            token: "",
        });
    }
}


signup = async (call,callback) =>{
    const {username,password} = call.request
    const hashedPassword = await bcrypt.hash(password, 10); 
    const savedUser = await User.create({ username, password: hashedPassword });
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

