const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config('./.env')

module.exports = async () =>{
    const mongoUri = process.env.MONGOCONNECT;
    console.log(mongoUri)

    try{
        mongoose.connect(mongoUri,{useUnifiedTopology:true}).then(()=>{
            console.log("MONGODB CONNECTED");
        }).catch(err=>{
            console.log("ERROR FROM PROMISE : " + err);
            
        })
    }
    catch(e){
        console.log("Error in connecting to MongoDB");
    }
}