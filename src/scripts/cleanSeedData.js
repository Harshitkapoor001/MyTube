import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { Comments } from "../models/comments.models.js";
import { Like } from "../models/likes.models.js";
import { Playlist } from "../models/playlist.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Tweets } from "../models/tweets.models.js";

dotenv.config({ path: "./.env" });

// Safety Check 1: Refuse to run in production
if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to clean: NODE_ENV is set to production.");
    process.exit(1);
}

// Safety Check 2: Require explicit confirmation
const isConfirmed = process.argv.includes("--confirm") || process.env.ALLOW_CLEAN === "true";
if (!isConfirmed) {
    console.error("❌ Safety guard: To run the test cleanup script, provide --confirm flag or set ALLOW_CLEAN=true");
    console.error("   Example: node src/scripts/cleanSeedData.js --confirm");
    process.exit(1);
}

const TEST_EMAIL_REGEX = /@test\.mytube\.local$/;
const TEST_USERNAME_REGEX = /^test_creator_/;
const TEST_TITLE_PREFIX = "[Test Data]";

const cleanup = async () => {
    try {
        console.log("Connecting to MongoDB database...");
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Connected to database: ${mongoose.connection.name}`);

        // Find only test users
        const testUsers = await User.find({
            $or: [
                { email: { $regex: TEST_EMAIL_REGEX } },
                { username: { $regex: TEST_USERNAME_REGEX } }
            ]
        }).select("_id username email");

        console.log(`Found ${testUsers.length} test creator(s) for safe cleanup.`);

        const testUserIds = testUsers.map((u) => u._id);

        // Find all test videos
        const testVideos = await Video.find({
            $or: [
                { owner: { $in: testUserIds } },
                { title: { $regex: `^\\${TEST_TITLE_PREFIX}` } }
            ]
        }).select("_id title");

        const testVideoIds = testVideos.map((v) => v._id);

        console.log(`Found ${testVideos.length} test video(s) for safe cleanup.`);

        // 1. Delete test comments
        const commentsDeleted = await Comments.deleteMany({
            $or: [
                { owner: { $in: testUserIds } },
                { video: { $in: testVideoIds } }
            ]
        });
        console.log(`  - Deleted ${commentsDeleted.deletedCount} test comment(s)`);

        // 2. Delete test likes
        const likesDeleted = await Like.deleteMany({
            $or: [
                { likedBy: { $in: testUserIds } },
                { video: { $in: testVideoIds } }
            ]
        });
        console.log(`  - Deleted ${likesDeleted.deletedCount} test like(s)`);

        // 3. Delete test playlists
        const playlistsDeleted = await Playlist.deleteMany({
            $or: [
                { owner: { $in: testUserIds } },
                { name: { $regex: `^\\${TEST_TITLE_PREFIX}` } }
            ]
        });
        console.log(`  - Deleted ${playlistsDeleted.deletedCount} test playlist(s)`);

        // 4. Delete test subscriptions
        const subsDeleted = await Subscription.deleteMany({
            $or: [
                { subscriber: { $in: testUserIds } },
                { channel: { $in: testUserIds } }
            ]
        });
        console.log(`  - Deleted ${subsDeleted.deletedCount} test subscription(s)`);

        // 5. Delete test tweets
        const tweetsDeleted = await Tweets.deleteMany({
            owner: { $in: testUserIds }
        });
        console.log(`  - Deleted ${tweetsDeleted.deletedCount} test tweet(s)`);

        // 6. Delete test videos
        const videosDeleted = await Video.deleteMany({
            _id: { $in: testVideoIds }
        });
        console.log(`  - Deleted ${videosDeleted.deletedCount} test video(s)`);

        // 7. Delete test users
        const usersDeleted = await User.deleteMany({
            _id: { $in: testUserIds }
        });
        console.log(`  - Deleted ${usersDeleted.deletedCount} test user(s)`);

        // Verify remaining real users
        const remainingUsers = await User.countDocuments();
        console.log(`\nRemaining non-test users in database: ${remainingUsers}`);

        console.log("\n==========================================");
        console.log("🧹 TEST DATA CLEANUP COMPLETE");
        console.log("All non-test user records were preserved untouched.");
        console.log("==========================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error while cleaning test data:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

cleanup();
