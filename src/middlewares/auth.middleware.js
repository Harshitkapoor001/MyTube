import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken"


export const verifyJWT = asyncHandler(async (req,_,next) =>{//we can write _ in place of res if it is not being used 
    try {
        //console.log("cookies:",req.cookies)
        //console.log("Header:",req.header)
        const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
        //console.log("token:",token)
        if (!token) {
            throw new ApiErrors(401,"Unathorized User")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user){
            throw new ApiErrors(401,"Invalid Access Token")
        }
    
        req.user = user
        next()

    } catch (error) {
        throw new ApiErrors(401,error?.message || "Invalid access Token")
    }
})

