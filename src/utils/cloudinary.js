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
        console.log("the file is uploaded on:",response)
        // Remove the local temp file after a successful upload
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        //console.log("Cloudinary error",error);
        // Remove the local temp file even if the upload failed
        if(fs.existsSync(localFilePath)){
            fs.unlinkSync(localFilePath)//this will remove the locally saved temporary file as the upload operation got failed
        }
        return null
    }
}



export {uploadOnCloudinary, cloudinary}
