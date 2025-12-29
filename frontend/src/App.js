import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ListTodo,
  BarChart3,
  Filter,
  AlertCircle,
  Zap,
  Flag
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`} 
       className={`${bgColor} rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
      </div>
      <div className={`${color} opacity-20`}>
        <Icon size={48} />
      </div>
    </div>
  </div>
);

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const styles = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: "bg-gray-100", text: "text-gray-700", icon: Circle },
    in_progress: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock },
    completed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 }
  };
  
  const style = styles[status];
  const Icon = style.icon;
  const label = status.replace('_', ' ').toUpperCase();
  
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// Task Card Component
const TaskCard = ({ task, onUpdate, onDelete, onEdit }) => {
  const handleStatusCycle = () => {
    const statusOrder = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    onUpdate(task.id, { status: nextStatus });
  };

  return (
    <div data-testid={`task-card-${task.id}`}
         className={`bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border-l-4 ${
           task.status === 'completed' ? 'border-green-500 opacity-75' : 
           task.priority === 'high' ? 'border-red-500' : 
           task.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
         }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-500 mt-2 text-sm">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <button
            data-testid={`task-status-btn-${task.id}`}
            onClick={handleStatusCycle}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Change Status"
          >
            {task.status === 'completed' ? 
              <CheckCircle2 className="text-green-500" size={20} /> :
              task.status === 'in_progress' ? 
              <Clock className="text-blue-500" size={20} /> :
              <Circle className="text-gray-400" size={20} />
            }
          </button>
          <button
            data-testid={`task-edit-btn-${task.id}`}
            onClick={() => onEdit(task)}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors"
          >
            <Edit3 className="text-blue-500" size={18} />
          </button>
          <button
            data-testid={`task-delete-btn-${task.id}`}
            onClick={() => onDelete(task.id)}
            className="p-2 rounded-full hover:bg-red-100 transition-colors"
          >
            <Trash2 className="text-red-500" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button 
            data-testid="modal-close-btn"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Task Form Component
const TaskForm = ({ task, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [status, setStatus] = useState(task?.status || "pending");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const data = { title: title.trim(), description: description.trim(), priority };
    if (task) {
      data.status = status;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
        <input
          data-testid="task-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Enter task title..."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          data-testid="task-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          rows={3}
          placeholder="Add a description..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex gap-3">
          {['low', 'medium', 'high'].map((p) => (
            <button
              key={p}
              type="button"
              data-testid={`priority-btn-${p}`}
              onClick={() => setPriority(p)}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                priority === p
                  ? p === 'high' ? 'bg-red-500 text-white' :
                    p === 'medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {task && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            data-testid="task-status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          data-testid="task-cancel-btn"
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="task-submit-btn"
          className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState({ status: '', priority: '' });

  const fetchTasks = useCallback(async () => {
    try {
      let url = `${API}/tasks`;
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.priority) params.append('priority', filter.priority);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      setTasks(response.data);
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  }, [filter]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/tasks-stats`);
      setStats(response.data);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchTasks]);

  const handleCreateTask = async (data) => {
    try {
      await axios.post(`${API}/tasks`, data);
      await Promise.all([fetchTasks(), fetchStats()]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const handleUpdateTask = async (id, data) => {
    try {
      await axios.put(`${API}/tasks/${id}`, data);
      await Promise.all([fetchTasks(), fetchStats()]);
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`${API}/tasks/${id}`);
      await Promise.all([fetchTasks(), fetchStats()]);
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-xl">
                <ListTodo className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  TaskFlow
                </h1>
                <p className="text-sm text-gray-500">Manage your tasks efficiently</p>
              </div>
            </div>
            <button
              data-testid="add-task-btn"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        {stats && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Overview</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard 
                title="Total Tasks" 
                value={stats.total} 
                icon={ListTodo}
                color="text-indigo-600"
                bgColor="bg-white"
              />
              <StatsCard 
                title="Pending" 
                value={stats.pending} 
                icon={Circle}
                color="text-gray-600"
                bgColor="bg-white"
              />
              <StatsCard 
                title="In Progress" 
                value={stats.in_progress} 
                icon={Clock}
                color="text-blue-600"
                bgColor="bg-white"
              />
              <StatsCard 
                title="Completed" 
                value={stats.completed} 
                icon={CheckCircle2}
                color="text-green-600"
                bgColor="bg-white"
              />
            </div>
          </section>
        )}

        {/* Filters Section */}
        <section className="mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="text-gray-500" size={20} />
              <h3 className="font-medium text-gray-700">Filters</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Status</label>
                <select
                  data-testid="filter-status"
                  value={filter.status}
                  onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Priority</label>
                <select
                  data-testid="filter-priority"
                  value={filter.priority}
                  onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              {(filter.status || filter.priority) && (
                <button
                  data-testid="clear-filters-btn"
                  onClick={() => setFilter({ status: '', priority: '' })}
                  className="self-end px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tasks List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="text-yellow-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Tasks</h2>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm font-medium">
                {tasks.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first task!</p>
              <button
                data-testid="empty-add-task-btn"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                <Plus size={20} />
                Create Task
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onEdit={openEditModal}
                />
              ))}  
            </div>
          )}
        </section>

        {/* Priority Legend */}
        <section className="mt-8">
          <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="text-gray-500" size={18} />
              <h3 className="font-medium text-gray-700 text-sm">Priority Guide</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Low Priority</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-lg">
                <ListTodo className="text-white" size={16} />
              </div>
              <span className="font-semibold text-gray-700">TaskFlow</span>
            </div>
            <p className="text-sm text-gray-500">Built with React & FastAPI for AWS Amplify Demo</p>
            <a 
              href="https://staging.d1tzra9kie7xo5.amplifyapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              AWS Amplify Staging
            </a>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}

export default App;
