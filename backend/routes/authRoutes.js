const express = require("express");
const { registerUser, loginUser, getUserProfile, updateUserProfile } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
// protect will check if the user is authenticated or not.
router.get("/profile", protect, getUserProfile)
router.put("/profile", protect, updateUserProfile)

router.post("/upload-image", upload.single("image"), (req,res) => {
    if(!req.file) {
        return res.status(400).json({message: "no file uploaded"})
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    res.status(200).json({imageUrl})
})

module.exports = router;