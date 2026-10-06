# MyTube

MyTube is a backend-focused video-sharing platform inspired by YouTube.  
It provides user authentication, video management, cloud-based media storage, subscriptions, watch history, and user profile management.

The project is built using Node.js, Express.js, MongoDB, Mongoose, JWT, Cloudinary, and other modern backend technologies.

---

## 🚀 Features

### 👤 User Authentication
- User registration and login
- JWT-based authentication
- Access and refresh tokens
- Secure password hashing using bcrypt
- Logout functionality
- Refresh access token
- Protected routes using authentication middleware

### 🧑‍💻 User Profile
- Get current user details
- Update account information
- Update avatar
- Update cover image
- Get user channel/profile information

### 🎥 Video Management
- Upload videos
- Store videos using Cloudinary
- Update video information
- Delete videos
- Get video details
- Manage uploaded videos

### 📺 Subscriptions
- Subscribe to a channel
- Unsubscribe from a channel
- Get subscribed channels
- Manage channel subscriptions

### 👀 Watch History
- Track user's watched videos
- Get user's watch history
- Manage watch history using MongoDB aggregation

### ☁️ Cloud Storage
- Cloudinary integration for media storage
- Multer for handling multipart/form-data uploads
- Temporary local storage for uploaded files
- Delete old media from Cloudinary when files are updated

### 🔍 MongoDB Aggregation
The project uses MongoDB aggregation pipelines for complex operations such as:
- Fetching channel information
- Subscription-related data
- Watch history
- User/video relationships
- Pagination and data transformation

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Authentication & Security
- JSON Web Tokens (JWT)
- bcrypt
- Cookie-based authentication

### File & Media Management
- Multer
- Cloudinary

### Development Tools
- Nodemon
- Postman
- Git & GitHub

---
