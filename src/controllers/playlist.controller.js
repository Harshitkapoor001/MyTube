import mongoose from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiErrors} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name || name.trim() === "") {
        throw new ApiErrors(400,"Name is required")
    }

    if (!description || description.trim() === "") {
        throw new ApiErrors(400,"Description is required")
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user?._id,
        videos: []
    })

    return res
    .status(201)
    .json(new ApiResponse(201,playlist,"Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiErrors(400,"Invalid User ID")
    }

    const playlists = await Playlist.find({owner: userId})

    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiErrors(400,"Invalid Playlist ID")
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
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
                                        fullname: 1,
                                        username: 1,
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
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
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
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])

    if (!playlist?.length) {
        throw new ApiErrors(404,"Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist[0],"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Playlist or Video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiErrors(404,"Playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to modify this playlist")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    // Add video if not already in playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid Playlist or Video ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiErrors(404,"Playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to modify this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos: new mongoose.Types.ObjectId(videoId)
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiErrors(400,"Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiErrors(404,"Playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiErrors(400,"Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiErrors(404,"Playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiErrors(403,"You are not authorized to update this playlist")
    }

    const updateFields = {}
    if (name && name.trim() !== "") {
        updateFields.name = name.trim()
    }
    if (description && description.trim() !== "") {
        updateFields.description = description.trim()
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiErrors(400,"At least one field (name or description) is required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updateFields
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
