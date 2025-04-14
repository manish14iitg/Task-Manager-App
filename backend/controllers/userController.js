const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Task = require("../models/Task");


// GET /api/users (only admin can have access to all users)

const getUsers = async (req,res) => {
    try {
        const users = await User.find({role: "member"}).select("-password");

        const allUsersWithTaskCounts = await Promise.all(users.map(async (user) => {
            const pendingTasks = await Task.countDocuments({assignedTo: user._id, status: "Pending"});
            const InProgressTasks = await Task.countDocuments({assignedTo: user._id, status: "In Progress"})
            const completedTasks = await Task.countDocuments({assignedTo: user._id, status: "Completed"})

            return {
                ...user._doc,
                pendingTasks,
                InProgressTasks,
                completedTasks,
            }
        }))

        res.json(allUsersWithTaskCounts);
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

// GET /api/users/:id
const getUserById = async (req,res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if(!user) return res.status(404).json({message: "User not found"})
        res.json(user)
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

module.exports = {getUsers, getUserById}