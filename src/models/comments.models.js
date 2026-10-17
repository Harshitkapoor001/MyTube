import mongoose,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const commentSchema = new Schema({
    content:{
        type:String,
        required:true
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

// Register the pagination plugin so aggregation queries on this model support .paginate()
commentSchema.plugin(mongooseAggregatePaginate)

export const Comments = mongoose.model("Comments",commentSchema)