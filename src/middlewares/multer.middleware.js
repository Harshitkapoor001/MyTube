import multer from "multer"
import fs from "fs"
import path from "path"

const tempDir = "./public/temp"
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`)
  }
})

export const upload = multer({ 
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max limit to support both images and videos
    }
})