import {Router} from "express"
import { registerUser , loginUser, logoutUser , refreshAccessToken, changeCurrentPassword, getUserChannelProfile, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserWatchHistory } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"



const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]),
    registerUser)


router.route("/login").post(loginUser)    
 
//secured route
router.route("/logout").post( verifyJWT ,logoutUser)
router.route("/refresh_token").post(refreshAccessToken)
router.route("/change_password").post(verifyJWT , changeCurrentPassword)
router.route("/current_user").get(verifyJWT, getCurrentUser)
router.route("/update_details").patch(verifyJWT , updateAccountDetails)
router.route("/avatar").patch(verifyJWT , upload.single("avatar"), updateAvatar)
router.route("/coverimage").patch(verifyJWT , upload.single("coverimage"), updateCoverImage)
router.route("/c/:username").get(verifyJWT , getUserChannelProfile)
router.route("/watchHistory").get(verifyJWT , getUserWatchHistory)

export default router