import mongoose from "mongoose"
import {Tweets} from "../models/tweets.models.js"
import {Like} from "../models/likes.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    if (!content || content.trim() === "") {
        throw new ApiErrors(400,"Content is required")
    }

    const tweet = await Tweets.create({
        content: content.trim(),
        owner: req.user?._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201,tweet,"Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiErrors(400,"Invalid User ID")
    }

    const tweets = await Tweets.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
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
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes"
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                },
                likesCount:{
                    $size:"$likes"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[
                                req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null,
                                "$likes.likedBy"
                            ]
                        },
                        then: true,
                        else: false
                    }
                }
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
    .json(new ApiResponse(200,tweets,"Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiErrors(400,"Invalid Tweet ID")
    }

    if (!content || content.trim() === "") {
        throw new ApiErrors(400,"Content is required")
    }

    const tweet = await Tweets.findById(tweetId)
    if (!tweet) {
        throw new ApiErrors(404,"Tweet not found")
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to update this tweet")
    }

    const updatedTweet = await Tweets.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content.trim()
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiErrors(400,"Invalid Tweet ID")
    }

    const tweet = await Tweets.findById(tweetId)
    if (!tweet) {
        throw new ApiErrors(404,"Tweet not found")
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to delete this tweet")
    }

    await Tweets.findByIdAndDelete(tweetId)

    // Delete associated likes
    await Like.deleteMany({tweet: tweetId})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
