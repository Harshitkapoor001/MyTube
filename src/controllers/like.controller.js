import mongoose from "mongoose"
import {Like} from "../models/likes.models.js"
import {Video} from "../models/video.models.js"
import {Comments} from "../models/comments.models.js"
import {Tweets} from "../models/tweets.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked: false},"Video unliked successfully"))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{isLiked: true},"Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiErrors(400,"Invalid Comment ID")
    }

    const comment = await Comments.findById(commentId)
    if (!comment) {
        throw new ApiErrors(404,"Comment not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked: false},"Comment unliked successfully"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{isLiked: true},"Comment liked successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiErrors(400,"Invalid Tweet ID")
    }

    const tweet = await Tweets.findById(tweetId)
    if (!tweet) {
        throw new ApiErrors(404,"Tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200,{isLiked: false},"Tweet unliked successfully"))
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{isLiked: true},"Tweet liked successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video:{
                    $exists: true
                }
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
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
                    }
                ]
            }
        },
        {
            $addFields:{
                video:{
                    $first:"$video"
                }
            }
        },
        {
            $match:{
                "video.isPublished": true
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,likedVideos,"Liked videos fetched successfully"))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}
