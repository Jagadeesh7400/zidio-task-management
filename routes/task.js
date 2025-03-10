const express = require("express")
const router = express.Router()
const Task = require("../models/Task")
const User = require("../models/User")
const auth = require("../middleware/auth")
const { createNotification } = require("../routes/notification")
const mongoose = require("mongoose")

// Get all tasks for a user
router.get("/user/:userId", auth, async (req, res) => {
  try {
    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user ID" })
    }

    // Check if the user is authorized to view these tasks
    if (req.params.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    const tasks = await Task.find({ user: req.params.userId }).sort({ deadline: 1 })
    res.json(tasks)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific task
router.get("/:id", auth, async (req, res) => {
  try {
    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" })
    }

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check if the user is authorized to view this task
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    res.json(task)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new task
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, date, time, deadline, important, user: taskUser } = req.body

    // Validation
    if (!title || !description || !date || !time || !deadline) {
      return res.status(400).json({ message: "Please provide all required fields" })
    }

    const userId = taskUser || req.user.id

    // Check if the user is authorized to create a task for this user
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    // Validate that the user exists
    const userExists = await User.findById(userId)
    if (!userExists) {
      return res.status(404).json({ message: "User not found" })
    }

    const newTask = new Task({
      title,
      description,
      date,
      time,
      deadline,
      important: important || false,
      user: userId,
    })

    const task = await newTask.save()

    // Create notification for new task
    await createNotification({
      user: userId,
      message: `New task "${title}" has been created`,
      type: "task_reminder",
      relatedTask: task._id,
    })

    res.json(task)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update a task
router.put("/:id", auth, async (req, res) => {
  try {
    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" })
    }

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check if the user is authorized to update this task
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    const { title, description, date, time, deadline, important } = req.body

    // Update task fields
    if (title) task.title = title
    if (description) task.description = description
    if (date) task.date = date
    if (time) task.time = time
    if (deadline) task.deadline = deadline
    if (important !== undefined) task.important = important

    const updatedTask = await task.save()
    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark a task as completed
router.put("/:id/complete", auth, async (req, res) => {
  try {
    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" })
    }

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check if the user is authorized to update this task
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    task.completed = true

    const updatedTask = await task.save()

    // Create notification for completed task
    await createNotification({
      user: task.user,
      message: `Task "${task.title}" has been completed`,
      type: "task_completed",
      relatedTask: task._id,
    })

    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete a task
router.delete("/:id", auth, async (req, res) => {
  try {
    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" })
    }

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check if the user is authorized to delete this task
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    await Task.findByIdAndDelete(req.params.id)
    res.json({ message: "Task removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Archive a task
router.put("/:id/archive", auth, async (req, res) => {
  try {
    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" })
    }

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check if the user is authorized to update this task
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    task.archived = !task.archived // Toggle archive status

    const updatedTask = await task.save()
    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark a task as important
router.put("/:id/important", auth, async (req, res) => {
  try {
    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" })
    }

    const task = await Task.findById(req.params.id)

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Check if the user is authorized to update this task
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" })
    }

    task.important = !task.important // Toggle important status

    const updatedTask = await task.save()
    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

