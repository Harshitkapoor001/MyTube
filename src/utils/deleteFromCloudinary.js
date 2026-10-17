import {v2 as cloudinary} from "cloudinary"
import { ApiErrors } from "./ApiErrors.js"

const deleteFromCloudinary = async(oldImageUrl) =>{
    try {
        if(!oldImageUrl) return null
        // Cloudinary's destroy() requires the public_id, not the full URL
        // e.g. from "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg" → "sample"
        const publicId = oldImageUrl.split("/").pop().split(".")[0]
        const response = await cloudinary.uploader.destroy(publicId)
        return response
    } catch (error) {
        console.error("Cloudinary delete error:",error)
        throw new ApiErrors(500,"Error occurred while deleting the image from cloudinary")
    }
}
    
export {deleteFromCloudinary}