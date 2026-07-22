import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

const router = Router();

// On Vercel (serverless), the filesystem is read-only except /tmp.
// Locally, use the project-level uploads/ folder.
const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel
  ? path.join(os.tmpdir(), "uploads")
  : path.join(process.cwd(), "uploads");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn("Could not create uploads dir, using /tmp fallback:", err);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the dir exists at request time (Vercel /tmp can be cleaned between invocations)
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB file size limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Allow standard images and videos
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

router.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum allowed size is 200MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // File URL construction based on standard Express static serve approach
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
      },
    });
  });
});

export default router;
