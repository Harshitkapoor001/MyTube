import {Router} from "express"
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/").post(verifyJWT , createPlaylist)
router.route("/user/:userId").get(getUserPlaylists)
router.route("/:playlistId").get(getPlaylistById)
router.route("/:playlistId").patch(verifyJWT , updatePlaylist)
router.route("/:playlistId").delete(verifyJWT , deletePlaylist)
router.route("/add/:videoId/:playlistId").patch(verifyJWT , addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(verifyJWT , removeVideoFromPlaylist)

export default router
