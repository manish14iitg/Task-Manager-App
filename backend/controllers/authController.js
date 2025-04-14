const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")


const generateJwtToken = (userId) => {
    return jwt.sign(
        {id: userId},
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
    )
}

// POST /api/auth/register
const registerUser = async (req, res ) => {
    try {
        const {name, email, password, profileImageUrl, adminInviteToken} = req.body;

        const userAlreadyExists = await User.findOne({email});
        if(userAlreadyExists){
            return res.status(400).json({message: "User Already Exists"})
        }
        let role = "member";
        if(adminInviteToken && adminInviteToken == process.env.ADMIN_INVITE_TOKEN){
            role = "admin";
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl,
            role,
        })

        // return user data with jwt token
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            token: generateJwtToken(user._id)
        })
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message})
    }
};

// POST /api/auth/login
const loginUser = async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message: "Invalid email or password"})
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch){
            return res.status(401).json({message: "Invalid email or password"})
        }

        res.json({
            _id:user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            token:generateJwtToken(user._id),
        })
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message})
    }
};

// GET /api/auth/profile (requires JWT in req)
const getUserProfile = async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message})
    }
};

// PUT /api/auth/profile (requirees JWT in req)

const updateUserProfile = async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        user.name = req.body.name || user.name
        user.email = req.body.email || user.email

        if(req.body.password){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt)
            user.password = hashedPassword;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateJwtToken(updatedUser._id)
        })
    } catch (error) {
        res.status(500).json({message: "Server error", error: error.message})
    }
};

module.exports = {registerUser, loginUser, getUserProfile, updateUserProfile}