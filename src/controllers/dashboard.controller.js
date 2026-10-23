import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/likes.models.js"
import {Comments} from "../models/comments.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Get overall channel stats for the logged-in creator:
// total subscribers, total videos, total views, total likes across all videos
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id

    // 1. Subscriber count
    const subscriberCount = await Subscription.countDocuments({
        channel: channelId
    })

    // 2. Aggregate video-level stats: total videos, total views, total likes
    const videoStats = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            // Join likes for each video
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $group:{
                _id: null,
                totalVideos:{ $sum: 1 },
                totalViews:{ $sum: "$views" },
                totalLikes:{ $sum: { $size: "$likes" } }
            }
        }
    ])

    // 3. Total comments on all channel videos
    const channelVideos = await Video.find(
        { owner: channelId },
        { _id: 1 }
    )
    const videoIds = channelVideos.map((v) => v._id)

    const totalComments = await Comments.countDocuments({
        video:{ $in: videoIds }
    })

    const stats = videoStats[0] || { totalVideos: 0, totalViews: 0, totalLikes: 0 }

    return res
    .status(200)
    .json(new ApiResponse(200, {
        totalSubscribers: subscriberCount,
        totalVideos: stats.totalVideos,
        totalViews: stats.totalViews,
        totalLikes: stats.totalLikes,
        totalComments
    }, "Channel stats fetched successfully"))
})

// Get all videos uploaded by the logged-in creator with per-video engagement metrics
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id

    const videos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            // Join likes for each video
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            // Join comments for each video
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments"
            }
        },
        {
            $addFields:{
                likesCount:{ $size: "$likes" },
                commentsCount:{ $size: "$comments" }
            }
        },
        {
            $project:{
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                likesCount: 1,
                commentsCount: 1
            }
        },
        {
            $sort:{ createdAt: -1 }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}
