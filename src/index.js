//import (`dotenv`).config()
import dotenv from "dotenv";
import mongoose, { connect } from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/db.js";
import {app} from "./app.js"
dotenv.config({
    path:"./.env"
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`the app is listening on port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Mongo DB connection failed!!!",error)
})










/*import express from "express"
const app=express();
;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("there is an error",error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`express is listening on the port:${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("there is an error",error)
        throw error
    }
})()*/