"use client"

import { useState, useEffect } from "react"
import { Plus, Filter } from "lucide-react"
import { toast } from "react-hot-toast"
import TaskCard from "./task-card"
import TaskForm from "./task-form"
import { taskService } from "../../services/api"

interface Task {
  _id: string
  title: string
  description: string
  date: string
  time: string
  deadline: string
  completed: boolean
  important: boolean
  archived: boolean
  user: string
}

interface TaskListProps {
  filter?: "all" | "completed" | "pending" | "important" | "archived"
}

export default function TaskList({ filter = "all" }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [sortBy, setSortBy] = useState<"deadline" | "title">("deadline")

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = [...tasks]

    if (filter === "completed") {
      result = result.filter((task) => task.completed)
    } else if (filter === "pending") {
      result = result.filter((task) => !task.completed)
    } else if (filter === "important") {
      result = result.filter((task) => task.important)
    } else if (filter === "archived") {
      result = result.filter((task) => task.archived)
    } else {
      // "all" filter - exclude archived tasks
      result = result.filter((task) => !task.archived)
    }

    // Apply sorting
    if (sortBy === "deadline") {
      result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title))
    }

    setFilteredTasks(result)
  }, [tasks, filter, sortBy])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")

      if (!user.id) {
        toast.error("You must be logged in")
        return
      }

      const response = await taskService.getUserTasks(user.id)
      setTasks(response.data)
    } catch (error: any) {
      console.error("Error fetching tasks:", error)
      toast.error(error.response?.data?.message || "Failed to load tasks")

      // For demo purposes, set some sample tasks
      setTasks([
        {
          _id: "1",
          title: "Implement user authentication",
          description: "Add user authentication functionality to the website",
          date: "2023-09-15",
          time: "10:00",
          deadline: "2023-09-15T10:00:00.000Z",
          completed: true,
          important: false,
          archived: false,
          user: "user1",
        },
        {
          _id: "2",
          title: "Update website content",
          description: "Update the About Us page with new team members",
          date: "2023-09-20",
          time: "14:00",
          deadline: "2023-09-20T14:00:00.000Z",
          completed: false,
          important: true,
          archived: false,
          user: "user1",
        },
        {
          _id: "3",
          title: "Design new logo",
          description: "Create a new logo for the company rebranding",
          date: "2023-09-25",
          time: "09:00",
          deadline: "2023-09-25T09:00:00.000Z",
          completed: false,
          important: false,
          archived: false,
          user: "user1",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await taskService.completeTask(id)

      // Update local state
      setTasks(tasks.map((task) => (task._id === id ? { ...task, completed: true } : task)))

      toast.success("Task marked as completed")
    } catch (error: any) {
      console.error("Error completing task:", error)
      toast.error(error.response?.data?.message || "Failed to update task")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      await taskService.deleteTask(id)

      // Update local state
      setTasks(tasks.filter((task) => task._id !== id))

      toast.success("Task deleted successfully")
    } catch (error: any) {
      console.error("Error deleting task:", error)
      toast.error(error.response?.data?.message || "Failed to delete task")
    }
  }

  const handleEdit = (id: string) => {
    const task = tasks.find((t) => t._id === id)
    if (task) {
      setTaskToEdit(task)
      setIsFormOpen(true)
    }
  }

  const handleAddTask = () => {
    setTaskToEdit(null)
    setIsFormOpen(true)
  }

  const handleArchive = async (id: string) => {
    try {
      const response = await taskService.archiveTask(id)

      // Update local state
      setTasks(tasks.map((task) => (task._id === id ? { ...task, archived: response.data.archived } : task)))

      toast.success(response.data.archived ? "Task archived" : "Task unarchived")
    } catch (error: any) {
      console.error("Error archiving task:", error)
      toast.error(error.response?.data?.message || "Failed to archive task")
    }
  }

  const handleImportant = async (id: string) => {
    try {
      const response = await taskService.markImportant(id)

      // Update local state
      setTasks(tasks.map((task) => (task._id === id ? { ...task, important: response.data.important } : task)))

      toast.success(response.data.important ? "Task marked as important" : "Task unmarked as important")
    } catch (error: any) {
      console.error("Error marking task as important:", error)
      toast.error(error.response?.data?.message || "Failed to update task")
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          {filter === "all" && "All Tasks"}
          {filter === "completed" && "Completed Tasks"}
          {filter === "pending" && "Pending Tasks"}
          {filter === "important" && "Important Tasks"}
          {filter === "archived" && "Archived Tasks"}
        </h1>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "deadline" | "title")}
              className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="title">Sort by Title</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={16} />
          </div>

          <button
            onClick={handleAddTask}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-light text-white transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <h3 className="text-xl font-medium text-white mb-2">No tasks found</h3>
          <p className="text-accent-light mb-6">
            {filter === "all"
              ? "You don't have any tasks yet. Create your first task to get started!"
              : `You don't have any ${filter} tasks.`}
          </p>
          <button
            onClick={handleAddTask}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-light text-white transition-colors inline-flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Create New Task</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onToggleImportant={handleImportant}
            />
          ))}
        </div>
      )}

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        taskToEdit={taskToEdit}
        onTaskAdded={fetchTasks}
        onTaskUpdated={fetchTasks}
      />
    </div>
  )
}

