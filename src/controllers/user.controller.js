import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { Video } from "../models/video.models.js";

const registerUser=asyncHandler( async (req,res)=>{
     
    // get user details from frontend
    // Validation-not empty
    // Check if user already exist:username and email
    // Check for image,check for avatar
    // Upload them to cloudinary,avatar
    // create user object, create entry in db
    // Remove password and refresh tokens feild from response
    // check for user creation 
    // return res

    const {email, username, password, fullname} = req.body
    console.log("email: ",email)

    if (
        !email || !username || !password || !fullname ||
        [email, username, password, fullname].some((field) => 
            typeof field !== "string" || field.trim() === ""
        )
    ) {
        throw new ApiErrors(400, "All fields are required")
    }

    //console.log("Files:",req.files)
    //console.log("Body:",req.body)
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedUsername = username.trim().toLowerCase()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
        throw new ApiErrors(400, "Invalid email address format")
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(trimmedUsername)) {
        throw new ApiErrors(400, "Username must be 3-30 characters long and can only contain letters, numbers, and underscores")
    }

    if (password.length < 6) {
        throw new ApiErrors(400, "Password must be at least 6 characters long")
    }

    const registeredUser = await User.findOne({
        $or: [{ username: trimmedUsername }, { email: trimmedEmail }]
    })
    if (registeredUser) {
        throw new ApiErrors(409, "User is already registered with this username or email")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path
    //console.log("Avatar:",avatarLocalPath)
    //console.log("Coverimage:",coverimageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)

    if (!avatar) {
        throw new ApiErrors(400, "Avatar file is required")
    }

    const user = await User.create({
        email: trimmedEmail,
        fullname: fullname.trim(),
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        username: trimmedUsername,
        password
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshTokens"
    )
    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully")
    )

})

// Generate access and refresh tokens
const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshTokens()
        user.refreshTokens = refreshToken
        await user.save({ validateBeforeSave : false })
        return {accessToken,refreshToken}
    } catch (error) {
        console.log("Error",error)
        throw new ApiErrors(500,"Something went wrong while generating access and refresh tokens")
    }
}



const loginUser= asyncHandler(async(req,res) =>{
    // req data from body
    // username or email for finding the user in the database
    // passwaord check
    // if checked then generate access tokens and refresh tokens 
    // send the tokens in the form of secure cookies 
    const {username, email, password} = req.body
    if (!username && !email) {
        throw new ApiErrors(400, "Username or Email is required")
    }
    if (!password || typeof password !== "string" || password.trim() === "") {
        throw new ApiErrors(400, "Password is required")
    }

    const searchCriteria = []
    if (username && typeof username === "string" && username.trim() !== "") {
        searchCriteria.push({ username: username.trim().toLowerCase() })
    }
    if (email && typeof email === "string" && email.trim() !== "") {
        searchCriteria.push({ email: email.trim().toLowerCase() })
    }

    const user = await User.findOne({
        $or: searchCriteria
    })

    if(!user){
        throw new ApiErrors(404,"User not Found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiErrors(401,"Password is incorrect")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshTokens"
    )

    // Cookie configuration options
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User LoggedIn Successfully"
        )
    )

})


const logoutUser = asyncHandler(async(req,res) =>{
    // Remove refresh token from user document
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshTokens : 1
            }
        },
        {
            new : true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("AccessToken",options)
    .clearCookie("RefreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged Out")
    )

})

const refreshAccessToken = asyncHandler(async (req,res) =>{
    // Read refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.RefreshToken || req.body.RefreshToken
    if (!incomingRefreshToken) {
        throw new ApiErrors(401,"Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        // Verify incoming token matches stored token
        if (incomingRefreshToken !== user?.refreshTokens) {
            throw new ApiErrors(401,"Refresh Token is expired or used")
        }
        const options ={
            httpOnly : true,
            secure : true
        }
    
        const {accessToken,refreshToken:newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("AccessToken",accessToken,options)
        .cookie("RefreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken:newRefreshToken,
                },
                "Access token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiErrors(401,error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword , newPassword} = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiErrors(400, "Both old password and new password are required")
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
        throw new ApiErrors(400, "New password must be at least 6 characters long")
    }
    if (oldPassword === newPassword) {
        throw new ApiErrors(400, "New password must be different from the old password")
    }

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiErrors(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiErrors(400,"Invalid Password")
    }

    user.password = newPassword
    user.refreshTokens = undefined
    await user.save({validateBeforeSave:false})

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200,{},"Password changed successfully. Please log in again."))
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullname , email} = req.body
    if (!fullname && !email) {
        throw new ApiErrors(400, "At least one field (fullname or email) is required")
    }

    const updateFields = {}

    if (fullname !== undefined) {
        if (typeof fullname !== "string" || fullname.trim() === "") {
            throw new ApiErrors(400, "Fullname cannot be empty")
        }
        updateFields.fullname = fullname.trim()
    }

    if (email !== undefined) {
        if (typeof email !== "string" || email.trim() === "") {
            throw new ApiErrors(400, "Email cannot be empty")
        }
        const trimmedEmail = email.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedEmail)) {
            throw new ApiErrors(400, "Invalid email address format")
        }

        const existingEmailUser = await User.findOne({
            email: trimmedEmail,
            _id: { $ne: req.user?._id }
        })
        if (existingEmailUser) {
            throw new ApiErrors(409, "Email is already registered by another account")
        }
        updateFields.email = trimmedEmail
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : updateFields
        },
        {new : true}
    ).select("-password -refreshTokens")

    return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User details updated successfully"))
})

const updateAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiErrors(400,"Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new ApiErrors(400,"Error occured while uploading the file on cloudinary")
    }

    // Fetch existing avatar URL
    const oldUser = await User.findById(req.user?._id)
    const oldAvatarUrl = oldUser?.avatar

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url,
            }
        },
        {new:true}
    ).select("-password -refreshTokens")

    // Delete old avatar from Cloudinary
    if(oldAvatarUrl){
        await deleteFromCloudinary(oldAvatarUrl)
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiErrors(400,"Cover Image file is missing")
    }
    const coverimage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverimage?.url) {
        throw new ApiErrors(400,"Error occured while uploading cover image on cloudinary")
    }

    // Fetch existing cover image URL
    const oldUser = await User.findById(req.user?._id)
    const oldCoverImageUrl = oldUser?.coverimage

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:coverimage.url,
            }
        },
        {new:true}
    ).select("-password -refreshTokens")

    // Delete old cover image from Cloudinary
    if(oldCoverImageUrl){
        await deleteFromCloudinary(oldCoverImageUrl)
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"CoverImage updated successfully"))
})

const removeCoverImage = asyncHandler(async(req,res) =>{
    const oldUser = await User.findById(req.user?._id)
    const oldCoverImageUrl = oldUser?.coverimage

    if(oldCoverImageUrl){
        await deleteFromCloudinary(oldCoverImageUrl)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:""
            }
        },
        {new:true}
    ).select("-password -refreshTokens")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover image removed successfully"))
})


const getUserChannelProfile = asyncHandler(async(req,res) =>{
    const {username} = req.params
    if (!username?.trim()) {
        throw new ApiErrors(400,"Username does not exists")
    }
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            // Join subscriptions where this user is the channel — gives us all subscribers
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            // Join subscriptions where this user is the subscriber — gives us all channels they follow
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            // Compute derived fields from the joined data
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedTOCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        // Check if the currently logged-in user is in the subscribers list
                        if:{$in:[req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null,"$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            // Only return the fields needed for the channel profile page
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedTOCount:1,
                email:1,
                avatar:1,
                coverimage:1,
                isSubscribed:1
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiErrors(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})

const getUserWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // Join video documents from videos collection
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        // Join video owner details
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    // Project public profile fields
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        // Flatten owner array to single object
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0]?.watchHistory || [],"Watch History fetched successfully")
    )
})

const addVideoToWatchHistory = asyncHandler(async(req,res) =>{
    const {videoId} = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiErrors(404,"Video not found")
    }

    // Remove existing video entry if present
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $pull:{
                watchHistory: new mongoose.Types.ObjectId(videoId)
            }
        }
    )

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $push:{
                watchHistory: new mongoose.Types.ObjectId(videoId)
            }
        },
        {new:true}
    ).select("-password -refreshTokens")

    return res
    .status(200)
    .json(new ApiResponse(200,user.watchHistory,"Video added to watch history"))
})

const removeVideoFromWatchHistory = asyncHandler(async(req,res) =>{
    const {videoId} = req.params
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiErrors(400,"Invalid video ID")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $pull:{
                watchHistory: new mongoose.Types.ObjectId(videoId)
            }
        },
        {new:true}
    ).select("-password -refreshTokens")

    return res
    .status(200)
    .json(new ApiResponse(200,user.watchHistory,"Video removed from watch history"))
})

const clearWatchHistory = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                watchHistory: []
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,[],"Watch history cleared successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    removeCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
    addVideoToWatchHistory,
    removeVideoFromWatchHistory,
    clearWatchHistory
}