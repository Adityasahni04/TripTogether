const mongoose=require("mongoose");
const url='mongodb+srv://asmigarg569:7dfqYLq35ii3SoSa@cluster0.4frfv.mongodb.net/';

mongoose.connect(url);
const data=mongoose.connection;
data.on("connected",()=>{
    console.log("Database conncted");
})
data.on("disconncted",()=>{
    console.log("Database disconnected");
})

module.exports=data;