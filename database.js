const mongoose=require("mongoose");
const url='mongodb://127.0.0.1:27017/GetSetGo';

mongoose.connect(url);
const data=mongoose.connection;
data.on("connected",()=>{
    console.log("Database conncted");
})
data.on("disconncted",()=>{
    console.log("Database disconnected");
})

module.exports=data;
