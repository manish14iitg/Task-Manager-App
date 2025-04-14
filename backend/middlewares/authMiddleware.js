const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req,res,next) => {
    try {
        let token = req.headers.authorization;
        if(token && token.startsWith("Bearer")){
            token = token.split(" ")[1]; // extracts the toekn
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            // ataching user so that next function can use it.
            req.user = await User.findById(decoded.id).select("-password");
            next();
        }else{
            res.status(401).json({message: "Not authorized"});
        }
    } catch (err){
        res.status(401).json({message: "Token failed", error: err.message})
    }
}

const adminOnly = (req,res,next) => {
    if(req.user && req.user.role === "admin"){
        next();
    }else{
        res.status(403).json({message: "Access denied, admin Only"})
    }
}

module.exports = {adminOnly, protect};