import {mongoose,Schema} from "mongoose"

const subscriptionchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//the one who has subscribed
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//the one who has been subscribed
        ref:"User"
    }
},{timestamps:true})



export const Subscription = mongoose.model("Subscription",subscriptionchema)