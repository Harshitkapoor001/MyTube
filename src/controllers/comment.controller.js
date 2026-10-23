import mongoose from "mongoose"
import {Comments} from "../models/comments.models.js"
import {Video} from "../models/video.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    const commentsAggregate = Comments.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullname:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        }
    ])

    const options = {
        page: Math.max(1, parseInt(page, 10)),
        // Maximum 50 comments per page
        limit: Math.min(50, Math.max(1, parseInt(limit, 10)))
    }

    const comments = await Comments.aggregatePaginate(commentsAggregate, options)

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if (!content || content.trim() === "") {
        throw new ApiErrors(400,"content feild is required")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }
    const comment = await Comments.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })
    
    return res
    .status(201)
    .json(
        new ApiResponse(201,comment,"Comment added successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiErrors(400,"Invalid Comment ID")
    }

    if (!content || content.trim() === "") {
        throw new ApiErrors(400,"content feild is required")
    }

    const comment = await Comments.findById(commentId)
    if (!comment) {
        throw new ApiErrors(404,"Comment not found")
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to update this comment")
    }

    const updatedComment = await Comments.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: content.trim()
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedComment,"Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiErrors(400,"Invalid Comment ID")
    }

    const comment = await Comments.findById(commentId)
    if (!comment) {
        throw new ApiErrors(404,"Comment not found")
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to delete this comment")
    }

    await Comments.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}