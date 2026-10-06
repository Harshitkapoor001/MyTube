
import { ApiErrors } from "./ApiErrors.js"


const deleteFromCloudinary = async(oldImageUrl) =>{
    try {
        if(!oldImageUrl) return null
        const response = await cloudinary.uploader.destroy(oldImageUrl)
        return response
    } catch (error) {
        throw new ApiErrors(500,"error occured while deleting the image from cloudinary")
    }
}
    
export {deleteFromCloudinary}