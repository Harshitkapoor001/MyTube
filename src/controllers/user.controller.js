import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cluodinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { trusted } from "mongoose";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

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
        [email,username,password,fullname].some((feilds) => 
        feilds?.trim()==="")
    ) {
        throw new ApiErrors(400,"All feilds are required")
    }
    
    //console.log("Files:",req.files)
    //console.log("Body:",req.body)
    const registeredUser=await User.findOne({
        $or:[{ username },{ email }]
    })
    if (registeredUser) {
        throw new ApiErrors(409,"User is already registered")
    }

    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverimageLocalPath=req.files?.coverimage?.[0]?.path
    //console.log("Avatar:",avatarLocalPath)
    //console.log("Coverimage:",coverimageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiErrors(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)
    

    if (!avatar) {
        throw new ApiErrors(400,"Avatar file is required")
    }

    const user = await User.create({
        email,
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        username:username.toLowerCase(),
        password
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshTokens"
    )
    if (!createdUser) {
        throw new ApiErrors(500,"Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(200,"User Registered Successfully",createdUser)
    )

} )

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshTokens()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave : false })
        return {accessToken,refreshToken}
    } catch (error) {
        console.log("Error",error)
        throw new ApiErrors(500,"Something went wrong while generating access and refresh tokens")
    }
}



const loginUser= asyncHandler(async(req,res) => {
    // req data from body
    // username or email for finding the user in the database
    // passwaord check
    // if checked then generate access tokens and refresh tokens 
    // send the tokens in the form of secure cookies 
    const {username,email,password} = req.body
    if (!username && !email) {
        throw new ApiErrors(400,"Username or Email is required")
    }
    const user = await User.findOne({
        $or:[{username},{email}]
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
        "-password -refreshToken"
    )

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


const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
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
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged Out")
    )

})

const refreshAccessToken = asyncHandler(async (req,res) =>{
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
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiErrors(401,"Refresh Token is expired or used")
        }
        const options =[
            httpOnly = true,
            secure = true
        ]
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accesToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
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
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiErrors(400,"Invalid Password")
    }
    user.password = newPassword
    user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullname , email} = req.body
    if (!(fullname || email)) {
        throw new ApiErrors(400,"All the feilds are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,{user},"User details updated successfully"))
})

const updateAvatar = asyncHandler(async(req,res) =>{
    const oldImageUrl = req.body.avatar.url
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiErrors(400,"Avatar file is missing")
    }
    const avatar = uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiErrors(400,"Error occured while uploading the file on cloudinary")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url,
            }
        },
        {new:true}
    ).select("-password")
    deleteFromCloudinary(oldImageUrl)
    return res
    .status(200)
    .json(new ApiResponse(200,user.avatar.url,"Avatar updated successfully"))
})

const updateCoverImage = asyncHandler(async(req,res) =>{
    const oldImageUrl = req.body.coverimage.url
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiErrors(400,"Cover Image file is missing")
    }
    const coverimage = uploadOnCloudinary(coverImageLocalPath)
    if (!coverimage) {
        throw new ApiErrors(400,"Error occured while uploading cover image on cloudinary")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverimage:coverimage.url,
            }
        },
        {new:true}
    ).select("-password")
    deleteFromCloudinary(oldImageUrl)
    return res
    .status(200)
    .json(new ApiResponse(200,user.coverimage.url,"CoverImage updated successfully"))
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
            $lookup:{
                from:"subscriptions",
                localFeild:"_id",
                foreignFeild:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localFeild:"_id",
                foreignFeild:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFeilds:{
                subscriberCount:{
                    $size:"subscribers"
                },
                channelsSubscribedTOCount:{
                    $size:"subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        $if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
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
            $lookup:{
                from:"videos",
                localFeild:"watchHistory",
                foreignFeild:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localFeild:"owner",
                            foreignFeild:"_id",
                            as:"owner",
                            pipeline:[
                                {
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
                        $addFeilds:{
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
        new ApiResponse(200,user[0].watchHistory,"Watch History fetched successfully")
    )
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
    getUserChannelProfile,
    getUserWatchHistory
}