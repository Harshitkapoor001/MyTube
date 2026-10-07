import mongoose from "mongoose"
import {Comments} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if (!content) {
        throw new ApiError(400,"content feild is required")
    }
    const video = await User.findById(videoId)
   if (!video) {
        throw new ApiError(404,"Video not found")
    }
    const comment = await Comments.create[{
        content,
        video:videoId,
        owner:req.body._id
    }]
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment added successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}