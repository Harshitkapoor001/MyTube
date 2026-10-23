import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const getAllVideos = asyncHandler(async(req,res) =>{
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    // Validate sortBy against allowed fields
    const allowedSortFields = ["createdAt", "views", "duration", "title"]
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiErrors(400, `Invalid sortBy field. Allowed: ${allowedSortFields.join(", ")}`)
    }

    const pipeline = []

    // Search query by title or description
    if (query) {
        pipeline.push({
            $match:{
                $or:[
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        })
    }

    // Filter by specific channel/user
    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiErrors(400,"Invalid User ID")
        }
        pipeline.push({
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // By default only show published videos
    pipeline.push({
        $match:{
            isPublished: true
        }
    })

    // Sort stage
    const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1
    pipeline.push({
        $sort:{
            [sortBy]: sortOrder
        }
    })

    // Join owner channel details
    pipeline.push({
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline:[
                {
                    $project:{
                        fullname: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    })

    pipeline.push({
        $addFields:{
            owner:{
                $first: "$owner"
            }
        }
    })

    const options = {
        page: Math.max(1, parseInt(page, 10)),
        // Maximum 50 videos per page
        limit: Math.min(50, Math.max(1, parseInt(limit, 10)))
    }

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options)

    return res
    .status(200)
    .json(new ApiResponse(200,videos,"Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async(req,res) =>{
    const { title, description } = req.body

    if (!title || title.trim() === "") {
        throw new ApiErrors(400,"Title is required")
    }

    if (!description || description.trim() === "") {
        throw new ApiErrors(400,"Description is required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiErrors(400,"Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiErrors(400,"Thumbnail file is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url) {
        throw new ApiErrors(400,"Error while uploading video file to Cloudinary")
    }

    if (!thumbnail?.url) {
        throw new ApiErrors(400,"Error while uploading thumbnail to Cloudinary")
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user._id,
        isPublished: true
    })

    const createdVideo = await Video.findById(video._id)

    if (!createdVideo) {
        throw new ApiErrors(500,"Something went wrong while publishing the video")
    }

    return res
    .status(201)
    .json(new ApiResponse(201,createdVideo,"Video published successfully"))
})

const getVideoById = asyncHandler(async(req,res) =>{
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Video ID")
    }

    // Increment video views
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc:{
                views: 1
            }
        },
        {
            new: true
        }
    )

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            // Join video owner profile
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $lookup:{
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields:{
                            subscribersCount:{
                                $size: "$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    if:{
                                        $in:[
                                            req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            // Join video likes
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields:{
                owner:{
                    $first: "$owner"
                },
                likesCount:{
                    $size: "$likes"
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
            $project:{
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ])

    if (!video?.length) {
        throw new ApiErrors(404,"Video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video[0],"Video fetched successfully"))
})

const updateVideo = asyncHandler(async(req,res) =>{
    const { videoId } = req.params
    const { title, description } = req.body

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    // Verify video ownership
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to update this video")
    }

    const updateFields = {}

    if (title && title.trim() !== "") {
        updateFields.title = title.trim()
    }

    if (description && description.trim() !== "") {
        updateFields.description = description.trim()
    }

    const thumbnailLocalPath = req.file?.path

    if (thumbnailLocalPath) {
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        if (!newThumbnail?.url) {
            throw new ApiErrors(400,"Error while uploading new thumbnail")
        }

        // Delete old thumbnail from Cloudinary
        if (video.thumbnail) {
            await deleteFromCloudinary(video.thumbnail)
        }

        updateFields.thumbnail = newThumbnail.url
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiErrors(400,"At least one field (title, description or thumbnail) is required to update")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        { new: true }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedVideo,"Video updated successfully"))
})

const deleteVideo = asyncHandler(async(req,res) =>{
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    // Verify video ownership
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to delete this video")
    }

    // Delete assets from Cloudinary
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile, "video")
    }

    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async(req,res) =>{
    const { videoId } = req.params

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    // Verify video ownership
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to change publish status for this video")
    }

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video publish status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
