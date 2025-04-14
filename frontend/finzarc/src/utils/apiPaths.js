export const BASE_URL = "https://task-manager-app-jju1.onrender.com";

export const API_PATHS = {
    AUTH: {
        REGISTER: "/api/auth/register", // register a new user admin or member
        LOGIN: "/api/auth/login", // authonticate user and return JWT token
        GET_PROFILE: "/api/auth/profile", // get logged-in user details
    },

    USERS: {
        GET_ALL_USERS: "api/users", // get all users (only admin have access)
        GET_USER_BY_ID: (userId) => `/api/users/${userId}`, // get user by id
        CREATE_USER: (userId) => `/api/users/${userId}`, // create a new user (only admin have access)
        UPDATE_USER: (userId) => `/api/users/${userId}`, // update user details
        DELETE_USER: (userId) => `/api/users/${userId}`, // delete a user
    },

    TASKS: {
        GET_DASHBOARD_DATA: "/api/tasks/dashboard-data", // get dashboard data
        GET_USER_DASHBOARD_DATA: "/api/tasks/user-dashboard-data", // get user dashboard data
        GET_ALL_TASKS: "/api/tasks", // get all tasks, only assigned user have access and all admins have access.
        GET_TASK_BY_ID: (taskId) => `/api/tasks/${taskId}`, // get task by id
        CREATE_TASK: "/api/tasks", // create a new task, admin only
        UPDATE_TASK: (taskId) => `/api/tasks/${taskId}`, // get task by id
        DELETE_TASK: (taskId) => `/api/tasks/${taskId}`, // delete a task admin only
        UPDATE_TASK_STATUS: (taskId) => `/api/tasks/${taskId}/status`,
        UPDATE_TODO_CHECKLIST: (taskId) => `/api/tasks/${taskId}/todo`,
    },
    REPORTS: {
        EXPORT_TASKS: "/api/reports/export/tasks", // download all tasks as an excel file
        EXPORT_USERS: "/api/reports/export/users", // Download user-task details as an excel file
    },
    IMAGE: {
        UPLOAD_IMAGE: "/api/auth/upload-image",
    }
}
