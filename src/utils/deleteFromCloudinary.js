import {v2 as cloudinary} from "cloudinary"

const deleteFromCloudinary = async(oldImageUrl, resourceType = "image") =>{
    try {
        if(!oldImageUrl) return null
        // Cloudinary's destroy() requires the public_id, not the full URL
        // e.g. from "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg" → "sample"
        const publicId = oldImageUrl.split("/").pop().split(".")[0]
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        })
        return response
    } catch (error) {
        console.error("Cloudinary delete error:",error)
        return null
    }
}
    
export {deleteFromCloudinary}