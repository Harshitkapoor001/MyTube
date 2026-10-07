import {mongoose , Schema} from "mongoose"
import {Video} from "./video.models.js"
import { Comments } from "./comments.models.js"
import { User } from "./user.models.js"


const likeSchema = new Schema({
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comments"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweets"
    },
    
},{timestamps:true})

export const Like = mongoose.model("Like",likeSchema)