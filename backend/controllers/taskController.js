const Task = require("../models/Task")


// POST /api/tasks, only admin can create an assign tasks to members
const createTask = async (req,res) => {
    try {
        const {
            title,description,priority, dueDate, assignedTo, attachments, todoCheckList,
        } = req.body;
        if(!Array.isArray(assignedTo)){
            return res.status(400).json({message: "assignedTo must be an array of user IDs"})
        }
        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            todoCheckList,
            attachments,
        })
        res.status(201).json({message: "Task Created Successfully", task})
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

// GET /api/tasks
const getTasks = async (req,res) => {
    try {
        const {status} = req.query;
        let filter = {};
        if(status){
            filter.status = status;
        }
        let tasks;
        if(req.user.role === "admin"){
            tasks = await Task.find(filter).populate("assignedTo", "name email profileImageUrl")
        }else{
            tasks = await Task.find({...filter, assignedTo: req.user._id}).populate(
                "assignedTo",
                "name email profileImageUrl"
            )
        }
        // add completed todoCheckList count to each task
        tasks = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoCheckList.filter(
                    (item) => item.completed
                ).length;

                return { ...task._doc, completedTodoCount: completedCount}
            })
        )

        // status summary counts
        const allTasks = await Task.countDocuments(
            req.user.role === "admin" ? {} : {assignedTo: req.user._id}
        )
        const pendingTasks = await Task.countDocuments({
            ...filter,
            status: "Pending",
            ...(req.user.role !== "admin" && {assignedTo: req.user._id})
        })

        const inProgressTasks = await Task.countDocuments({
            ...filter,
            status: "In Progress",
            ...(req.user.role !== "admin" && {assignedTo: req.user._id})
        })
        const completedTasks = await Task.countDocuments({
            ...filter,
            status: "Completed",
            ...(req.user.role !== "admin" && {assignedTo: req.user._id})
        })

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
            }
        })
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}


// GET /api/tasks/:id

const getTaskById = async (req,res) => {
    try {
        const task = await Task.findById(req.params.id).populate("assignedTo", "name email profileImageUrl")
        if(!task){
            return res.status(404).json({message: "Task not fount"})
        }
        res.json(task)
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

// PUT /api/tasks/:id
const updateTask = async (req,res) => {
    try {
        const task = await Task.findById(req.params.id)
        if(!task){
            return res.status(404).json({message: "Task not found"})
        }

        task.title = req.body.title || task.title
        task.description = req.body.description || task.description
        task.priority = req.body.priority || task.priority
        task.dueDate = req.body.dueDate || task.dueDate
        task.todoCheckList = req.body.todoCheckList || task.todoCheckList
        task.attachments = req.body.attachments || task.attachments


        if(req.body.assignedTo){
            if(!Array.isArray(req.body.assignedTo)){
                return res.status(400).json({message: "assignedTo must be an array of user IDs"})
                
            }
            task.assignedTo = req.body.assignedTo
        }

        const updatedTask = await task.save();
        res.json({message: "Task Updated Successfully", updateTask})
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

// DELETE /api/tasks/:id
const deleteTask = async (req,res) => {
    try {
        const task = await Task.findById(req.params.id)
        if(!task){
            return res.status(404).json({message: "Task not found"})
        }

        await task.deleteOne();
        res.json({message: "Task deleted successfully"})
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

// PUT /api/tasks/:id/status

const updateTaskStatus = async (req,res) => {
    try {
        const task = await Task.findById(req.params.id)
        if(!task){
            return res.status(404).json({message: "Task not found"})
        }

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        )

        if(!isAssigned && req.user.role !== "admin"){
            return res.status(403).json({message: "Not authorized to update status"})
        }

        task.status = req.body.status || task.status;

        if(task.status === "Completed"){
            task.todoCheckList.forEach((item) => (item.completed = true))
            task.progress = 100;
        }

        await task.save();
        res.json({message: "Task status updated", task})
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}


//PUT /api/tasks/:id/todo
const updateTaskCheckList = async (req,res) => {
    try {
        const {todoCheckList} = req.body;
        const task = await Task.findById(req.params.id)

        if(!task){
            return res.status(404).json({message: "Task not found"})
        }
            if(!task.assignedTo.includes(req.user._id) && req.user.role !== "admin"){
                return res.status(403).json({message: "Not authorized to update checklist"})
            }

            task.todoCheckList = todoCheckList

            // UPDATE PROGRESS BASED ON CHECKLIST COMPLETION

            const completedCount = task.todoCheckList.filter(
                (item) => item.completed
            ).length
            const totalItems = task.todoCheckList.length

            task.progress = totalItems > 0 ? Math.round(completedCount / totalItems)* 100 : 0

            if(task.progress === 100){
                task.status = "Completed"
            } else if(task.progress > 0){
                task.status = "In Progress"
            } else{
                task.status = "Pending"
            }
        await task.save()
        const updatedTask = await Task.findById(req.params.id).populate("assignedTo", "name email profileImageUrl")

        res.json({message: "Task Checklist updated", task: updateTask})
    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}


// GET /api/tasks/dashboard-data
const getDashboardData = async (req,res) => {
    try{
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({status: "Pending"})
    const completedTasks = await Task.countDocuments({status: "Completed"})
    const overdueTasks = await Task.countDocuments({
        status: { $ne: "Completed"},
        dueDate: { $lt: new Date},
    })

    const taskStatuses = ["Pending", "In Progress", "Completed"]
    const taskDistributionRaw = await Task.aggregate([
        {
            $group: {
                _id: "$status",
                count: {$sum: 1}
            }
        }
    ])

    const taskDistribution = taskStatuses.reduce((acc, status) => {
        const formattedKey = status.replace(/\s+/g, ""); // Remove spaces for key naming
        acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0;
        return acc;
      }, {});
      
      taskDistribution["All"] = totalTasks; // Add total count

      const taskPriorities = ["Low", "Medium", "High"];
      const taskPriorityLevelsRaw = await Task.aggregate([
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
          },
        },
      ]);

      const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
        acc[priority] =
          taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
        return acc;
      }, {});
      
      // Fetch recent 10 tasks
      const recentTasks = await Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt");
      res.status(200).json({
        statistics : {
            totalTasks,
            pendingTasks,
            completedTasks,
            overdueTasks,
        },
        charts : {
            taskDistribution,
            taskPriorityLevels,
        },
        recentTasks,
      })

    }catch(error){
        res.status(500).json({message: "Server Error", error: error.message})
    }
      
}

// GET /api/tasks/user-dashboard-data

const getUserDashboardData = async (req,res) => {
    try {
        const userId = req.user._id; // Only fetch data for the logged-in user

        // Fetch statistics for user-specific tasks
        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
        const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
        const overdueTasks = await Task.countDocuments({
        assignedTo: userId,
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
        });

        // Task distribution by status
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
        { $match: { assignedTo: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, ""); // Remove spaces for response keys
            acc[formattedKey] =
              taskDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
          }, {});
          taskDistribution["All"] = totalTasks; // Add total count to taskDistribution
          
          // Task distribution by priority
          const taskPriorities = ["Low", "Medium", "High"];
          const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
          ]);
            
          const taskPriorityLevels = taskPriorities.reduce((acc,priority) => {
            acc[priority] = taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
            return acc;
          }, {})

          // fetch recent 10 tasks
          const recentTasks = await Task.find({assignedTo: userId}).sort({createtedAt: -1}).limit(10).select("title status priority dueDate createdAt")

          res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
          });

    } catch (error) {
        res.status(500).json({message: "Server Error", error: error.message})
    }
}

module.exports = {
    createTask,getTasks,getTaskById,updateTask,deleteTask,updateTaskStatus,updateTaskCheckList,getDashboardData,getUserDashboardData
}