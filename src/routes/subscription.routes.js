import {Router} from "express"
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/c/:channelId").post(verifyJWT , toggleSubscription)
router.route("/c/:channelId").get(getUserChannelSubscribers)
router.route("/u/:subscriberId").get(getSubscribedChannels)

export default router
