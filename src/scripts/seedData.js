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
    console.error("❌ Refusing to seed: NODE_ENV is set to production.");
    process.exit(1);
}

// Safety Check 2: Require explicit flag or environment variable
const isConfirmed = process.argv.includes("--confirm") || process.env.ALLOW_SEED === "true";
if (!isConfirmed) {
    console.error("❌ Safety guard: To run the seed script, provide --confirm flag or set ALLOW_SEED=true");
    console.error("   Example: node src/scripts/seedData.js --confirm");
    process.exit(1);
}

// Dedicated domain and prefix for test entities
const TEST_EMAIL_DOMAIN = "@test.mytube.local";
const TEST_TITLE_PREFIX = "[Test Data]";
const TEST_PASSWORD = "TestPassword123!";

const testCreatorsData = [
    {
        username: "test_creator_alex",
        email: `alex${TEST_EMAIL_DOMAIN}`,
        fullname: "Alex Chen (Tech & Code)",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        coverimage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
    },
    {
        username: "test_creator_maya",
        email: `maya${TEST_EMAIL_DOMAIN}`,
        fullname: "Maya Lin (Animation & VFX)",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        coverimage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
    },
    {
        username: "test_creator_devin",
        email: `devin${TEST_EMAIL_DOMAIN}`,
        fullname: "Devin Vance (Travel & Adventure)",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        coverimage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80"
    },
    {
        username: "test_creator_sara",
        email: `sara${TEST_EMAIL_DOMAIN}`,
        fullname: "Sara Connor (Fitness & Focus)",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        coverimage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
    }
];

// Openly licensed test media (Cloudinary verified demo assets & W3C open test media)
const testVideosData = [
    // Creator: Alex Chen (Tech & Engineering)
    {
        creatorUsername: "test_creator_alex",
        title: `${TEST_TITLE_PREFIX} Fullstack Node.js & React Architecture in 2026`,
        description: "Comprehensive walkthrough of clean architecture, Express middleware, MongoDB aggregation pipelines, and React integration. [Sample media: Cloudinary Forest Bike]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/forest_bike.mp4",
        thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
        duration: 754,
        views: 14200,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_alex",
        title: `${TEST_TITLE_PREFIX} MongoDB Aggregation Pipelines: $lookup, $unwind & Facets`,
        description: "Deep dive into multi-stage aggregations in MongoDB with practical examples for social feeds, watch histories, and dashboards. [Sample media: Cloudinary Ship]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/ship.mp4",
        thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
        duration: 612,
        views: 8900,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_alex",
        title: `${TEST_TITLE_PREFIX} Microservices vs Monoliths: A Senior Architect's Breakdown`,
        description: "Evaluating trade-offs between distributed microservice systems and modular monoliths in modern backend development. [Sample media: Cloudinary Elephants]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        duration: 980,
        views: 24500,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_alex",
        title: `${TEST_TITLE_PREFIX} Docker & Containerization for Node.js Developers`,
        description: "How to containerize Express apps, optimize multi-stage Docker builds, and handle secret management safely. [Sample media: Cloudinary Sea Turtle]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4",
        thumbnail: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=800&q=80",
        duration: 540,
        views: 11300,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_alex",
        title: `${TEST_TITLE_PREFIX} Edge Case Test — Super Ultra Long Video Title Designed To Stress-Test Responsive Frontend Layouts, Cards, Badges, and Text Truncation Across Varied Viewport Resolutions`,
        description: "Testing frontend UI robustness with extreme title lengths, multi-paragraph text, and minimal metadata. [Sample media: Cloudinary Dog]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
        duration: 120,
        views: 320,
        isPublished: true
    },

    // Creator: Maya Lin (Animation & VFX)
    {
        creatorUsername: "test_creator_maya",
        title: `${TEST_TITLE_PREFIX} Big Buck Bunny: Open Source Animation Showcase`,
        description: "The classic open-source 3D animated film produced by the Blender Institute. Licensed under Creative Commons Attribution 3.0. [Sample media: Cloudinary Dog]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        thumbnail: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
        duration: 596,
        views: 58200,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_maya",
        title: `${TEST_TITLE_PREFIX} Sintel: CGI Short Film Breakdown & Animation Behind The Scenes`,
        description: "Open movie project by the Blender Foundation examining character rigging, digital hair rendering, and fantasy environment lighting. CC-BY 3.0. [Sample media: Cloudinary Finish Line]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/finish_line.mp4",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        duration: 888,
        views: 43100,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_maya",
        title: `${TEST_TITLE_PREFIX} Elephants Dream: The World's First Open Movie Breakdown`,
        description: "Groundbreaking open-source computer generated short film exploring abstract machine worlds. [Sample media: Cloudinary Elephants]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/elephants.mp4",
        thumbnail: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80",
        duration: 653,
        views: 22400,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_maya",
        title: `${TEST_TITLE_PREFIX} Tears of Steel: Sci-Fi VFX Compositing & Motion Tracking`,
        description: "Exploring live-action visual effects integration, color grading, and CGI assets in dystopian open cinema. [Sample media: Cloudinary Finish Line]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/finish_line.mp4",
        thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
        duration: 734,
        views: 31200,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_maya",
        title: `${TEST_TITLE_PREFIX} Draft Project: Procedural Geometry Nodes Tutorial (Unpublished)`,
        description: "Work in progress draft video to test unpublished state filtering across creator dashboards and feed endpoints.",
        videoFile: "https://res.cloudinary.com/demo/video/upload/kitten_fighting.mp4",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        duration: 210,
        views: 0,
        isPublished: false // Edge case: unpublished draft
    },

    // Creator: Devin Vance (Travel & Adventure)
    {
        creatorUsername: "test_creator_devin",
        title: `${TEST_TITLE_PREFIX} Off-Road Adventure: Scenic Trail Exploration`,
        description: "High-octane dirt track driving and scenic landscape cinematography in the American Pacific Northwest. [Sample media: Cloudinary Snow Horses]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/snow_horses.mp4",
        thumbnail: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
        duration: 245,
        views: 7600,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_devin",
        title: `${TEST_TITLE_PREFIX} Ocean Wonders: Marine Life & Coral Reef Expedition`,
        description: "Undersea documentary exploring sea turtles, coral ecosystems, and tropical marine reserves. [Sample media: Cloudinary Sea Turtle]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4",
        thumbnail: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
        duration: 180,
        views: 18900,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_devin",
        title: `${TEST_TITLE_PREFIX} Budget Travel Challenge: Exploring Hidden Gems Across Europe`,
        description: "Searching for cheap transport, authentic street food, and historic landmarks on a student shoestring budget. [Sample media: Cloudinary Ship]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/ship.mp4",
        thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
        duration: 492,
        views: 35400,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_devin",
        title: `${TEST_TITLE_PREFIX} 48 Hours in Tokyo: Hidden Alleys & Street Food Tour`,
        description: "A cinematic culinary journey through Shinjuku, Shibuya, and Yanaka neighborhood ramen shops and coffee roasters. [Sample media: Cloudinary Forest Bike]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/forest_bike.mp4",
        thumbnail: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
        duration: 810,
        views: 52400,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_devin",
        title: `${TEST_TITLE_PREFIX} Minimalist Solo Backpacking: Alpine Gear & Camp Cooking`,
        description: "Ultralight tent setup, water filtration essentials, and dehydrated meals for 3-day backcountry trail hikes. [Sample media: Cloudinary Dog]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/dog.mp4",
        thumbnail: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80",
        duration: 640,
        views: 13500,
        isPublished: true
    },

    // Creator: Sara Connor (Fitness & Focus)
    {
        creatorUsername: "test_creator_sara",
        title: `${TEST_TITLE_PREFIX} 20-Minute High-Intensity Interval Training (HIIT) Workout`,
        description: "Follow-along bodyweight routine requiring zero equipment. Perfect for home workouts and functional mobility. [Sample media: Cloudinary Finish Line]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/finish_line.mp4",
        thumbnail: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
        duration: 1200,
        views: 67100,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_sara",
        title: `${TEST_TITLE_PREFIX} The Science of Deep Focus: Neurobiology of Sustained Attention`,
        description: "How dopamine, sleep hygiene, and intentional time-blocking optimize cognitive performance and coding flow states. [Sample media: Cloudinary Sea Turtle]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4",
        thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
        duration: 510,
        views: 28900,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_sara",
        title: `${TEST_TITLE_PREFIX} Minimalist Morning Routine for Programmers & Creators`,
        description: "Hydration, light exposure, cold showers, and morning mobility drills before sitting down at the terminal. [Sample media: Cloudinary Snow Horses]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/snow_horses.mp4",
        thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        duration: 390,
        views: 41200,
        isPublished: true
    },
    {
        creatorUsername: "test_creator_sara",
        title: `${TEST_TITLE_PREFIX} Quick 30-Second Desk Stretch: Relieve Neck & Shoulder Strain`,
        description: "Edge case short-form video test (under 1 minute) demonstrating quick ergonomics adjustments between meetings. [Sample media: Cloudinary Forest Bike]",
        videoFile: "https://res.cloudinary.com/demo/video/upload/forest_bike.mp4",
        thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
        duration: 32, // Edge case: short video duration
        views: 82000,
        isPublished: true
    }
];

const sampleComments = [
    "Amazing explanation, the diagram around the 5-minute mark really cleared up how the pipeline works!",
    "Testing video playback quality and responsiveness on mobile. Looking crisp!",
    "Great tutorial! Looking forward to the next episode in this series.",
    "Very helpful test fixture video. Sound and streaming speeds are rock solid.",
    "Thanks for putting together this comprehensive guide."
];

const sampleTweets = [
    "Just published a new guide on modern fullstack architecture! Check it out and let me know your thoughts. 🚀",
    "Excited to share our latest 3D render experiment. All open assets built in Blender! 🎨",
    "Pack light, travel far, and always double check your hiking boots before ascending! 🏔️",
    "Reminder: stay hydrated and take a quick 2-minute stretch break today! 💪"
];

const seed = async () => {
    try {
        console.log("Connecting to MongoDB database...");
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Connected to database: ${mongoose.connection.name}`);

        // Safety: verify that non-test users exist and are untouched
        const existingUsersCount = await User.countDocuments();
        console.log(`Current existing users in database before seed: ${existingUsersCount}`);

        // 1. Upsert test creators
        console.log("\n--- Seeding Test Creators ---");
        const createdUsersMap = {};

        for (const creatorData of testCreatorsData) {
            let user = await User.findOne({ username: creatorData.username });
            if (!user) {
                // Pass plain text password so Mongoose pre-save hook handles hashing properly
                user = await User.create({
                    ...creatorData,
                    password: TEST_PASSWORD,
                    watchHistory: []
                });
                console.log(`  + Created test creator: ${user.username} (${user.email})`);
            } else {
                console.log(`  = Test creator already exists: ${user.username}`);
            }
            createdUsersMap[creatorData.username] = user;
        }

        const testUserIds = Object.values(createdUsersMap).map((u) => u._id);

        // 2. Upsert test videos
        console.log("\n--- Seeding Test Videos ---");
        const createdVideos = [];

        for (const videoData of testVideosData) {
            const owner = createdUsersMap[videoData.creatorUsername];
            if (!owner) continue;

            let video = await Video.findOne({
                title: videoData.title,
                owner: owner._id
            });

            if (!video) {
                video = await Video.create({
                    title: videoData.title,
                    description: videoData.description,
                    videoFile: videoData.videoFile,
                    thumbnail: videoData.thumbnail,
                    duration: videoData.duration,
                    views: videoData.views,
                    isPublished: videoData.isPublished,
                    owner: owner._id
                });
                console.log(`  + Created video: "${video.title}" (${video.duration}s, ${video.views} views)`);
            } else {
                console.log(`  = Video already exists: "${video.title}"`);
            }
            createdVideos.push(video);
        }

        // 3. Upsert subscriptions between test creators
        console.log("\n--- Seeding Test Subscriptions ---");
        let subCount = 0;
        for (let i = 0; i < testUserIds.length; i++) {
            for (let j = 0; j < testUserIds.length; j++) {
                if (i !== j) {
                    const subscriber = testUserIds[i];
                    const channel = testUserIds[j];
                    const existingSub = await Subscription.findOne({ subscriber, channel });
                    if (!existingSub) {
                        await Subscription.create({ subscriber, channel });
                        subCount++;
                    }
                }
            }
        }
        console.log(`  Subscriptions active between test creators: ${subCount} newly created`);

        // 4. Seed comments on published videos
        console.log("\n--- Seeding Test Comments ---");
        let commentCount = 0;
        const publishedVideos = createdVideos.filter((v) => v.isPublished);

        for (let i = 0; i < publishedVideos.length; i++) {
            const vid = publishedVideos[i];
            const commenter = testUserIds[i % testUserIds.length];
            const content = sampleComments[i % sampleComments.length];

            const existingComment = await Comments.findOne({
                video: vid._id,
                owner: commenter,
                content
            });

            if (!existingComment) {
                await Comments.create({
                    video: vid._id,
                    owner: commenter,
                    content
                });
                commentCount++;
            }
        }
        console.log(`  Comments created: ${commentCount}`);

        // 5. Seed likes on published videos
        console.log("\n--- Seeding Test Likes ---");
        let likeCount = 0;
        for (let i = 0; i < publishedVideos.length; i++) {
            const vid = publishedVideos[i];
            const likers = [testUserIds[i % testUserIds.length], testUserIds[(i + 1) % testUserIds.length]];
            for (const likerId of likers) {
                const existingLike = await Like.findOne({
                    video: vid._id,
                    likedBy: likerId
                });
                if (!existingLike) {
                    await Like.create({
                        video: vid._id,
                        likedBy: likerId
                    });
                    likeCount++;
                }
            }
        }
        console.log(`  Likes created: ${likeCount}`);

        // 6. Seed Playlists for creators
        console.log("\n--- Seeding Test Playlists ---");
        const alexVideos = publishedVideos.filter((v) => v.owner.toString() === createdUsersMap.test_creator_alex._id.toString()).map((v) => v._id);
        const mayaVideos = publishedVideos.filter((v) => v.owner.toString() === createdUsersMap.test_creator_maya._id.toString()).map((v) => v._id);

        const playlistsToSeed = [
            {
                name: `${TEST_TITLE_PREFIX} Fullstack Web Development Collection`,
                description: "Curated series of modern backend architecture, databases, and Docker containerization tutorials.",
                owner: createdUsersMap.test_creator_alex._id,
                videos: alexVideos
            },
            {
                name: `${TEST_TITLE_PREFIX} 3D Animation & VFX Project Showcase`,
                description: "Open source CGI films and behind-the-scenes production breakdowns by Blender Foundation.",
                owner: createdUsersMap.test_creator_maya._id,
                videos: mayaVideos
            }
        ];

        for (const plData of playlistsToSeed) {
            const existingPl = await Playlist.findOne({ name: plData.name, owner: plData.owner });
            if (!existingPl) {
                await Playlist.create(plData);
                console.log(`  + Created playlist: "${plData.name}" (${plData.videos.length} videos)`);
            } else {
                console.log(`  = Playlist already exists: "${plData.name}"`);
            }
        }

        // 7. Seed Tweets for community tab
        console.log("\n--- Seeding Test Tweets ---");
        for (let i = 0; i < testCreatorsData.length; i++) {
            const creator = createdUsersMap[testCreatorsData[i].username];
            const content = `${TEST_TITLE_PREFIX} ${sampleTweets[i % sampleTweets.length]}`;
            const existingTweet = await Tweets.findOne({ owner: creator._id, content });
            if (!existingTweet) {
                await Tweets.create({ owner: creator._id, content });
                console.log(`  + Created tweet for ${creator.username}`);
            }
        }

        // 8. Populate watchHistory for test creators
        console.log("\n--- Updating Watch History for Test Creators ---");
        for (const creator of Object.values(createdUsersMap)) {
            const sampleWatched = publishedVideos.slice(0, 4).map((v) => v._id);
            await User.findByIdAndUpdate(creator._id, {
                $addToSet: { watchHistory: { $each: sampleWatched } }
            });
        }
        console.log("  Watch history updated for all test creators.");

        console.log("\n==========================================");
        console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
        console.log(`Total test creators: ${Object.keys(createdUsersMap).length}`);
        console.log(`Total test videos:   ${createdVideos.length}`);
        console.log("Safety: All existing non-test user data preserved without changes.");
        console.log("==========================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error while seeding data:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seed();
