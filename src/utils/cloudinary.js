import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async(localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // Log uploaded file details
        console.log(`File uploaded to Cloudinary: [${response.resource_type}] ${response.secure_url}`)
        // Remove local temporary file
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        // Remove local temporary file on error
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}



export {uploadOnCloudinary, cloudinary}
