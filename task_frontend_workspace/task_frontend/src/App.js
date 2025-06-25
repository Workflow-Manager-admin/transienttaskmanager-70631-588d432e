import React, { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3001/api/tasks/";

const COLORS = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  taskBg: "var(--task-bg)",
  border: "var(--border)",
  surface: "var(--surface)",
  text: "var(--text)",
  textSecondary: "var(--text-secondary)"
};

/**
 * Task input for adding or editing a task.
 * PUBLIC_INTERFACE
 */
function TaskInput({ value, onChange, onSubmit, placeholder, disabled, autoFocus }) {
  return (
    <form
      className="task-input-row"
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 24
      }}
    >
      <input
        className="task-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={!!disabled}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          fontSize: 16,
          padding: "12px 14px",
          border: `1.5px solid var(--border)`,
          borderRadius: 4,
          outline: "none",
          background: "var(--input-bg)",
          color: "var(--text)"
        }}
      />
      <button
        type="submit"
        className="btn"
        style={{
          background: "var(--primary)",
          color: "var(--text)"
        }}
        disabled={!!disabled || !value.trim()}
      >
        Add
      </button>
    </form>
  );
}

/**
 * Single Task component, shows one task row with action buttons.
 * PUBLIC_INTERFACE
 */
function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  isEditing,
  editText,
  setEditText,
  onSaveEdit,
  editDisabled
}) {
  return (
    <div
      className="task-row"
      style={{
        background: "var(--task-bg)",
        color: "var(--text)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        padding: 12,
        marginBottom: 12,
        boxShadow: "var(--shadow)",
        border: "1px solid var(--border)"
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", minWidth: 0 }}>
        <button
          aria-label="Mark as complete"
          className="btn-icon task-complete"
          onClick={() => onToggleComplete(task)}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            cursor: "pointer",
            marginRight: 10,
            color: task.completed ? "var(--accent)" : "var(--text-secondary)",
            fontSize: 20
          }}
        >
          {task.completed ? "✔️" : "○"}
        </button>
        {isEditing ? (
          <form
            style={{ flex: 1, display: "flex" }}
            onSubmit={e => {
              e.preventDefault();
              if (editText.trim()) onSaveEdit();
            }}
          >
            <input
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="task-edit-input"
              autoFocus
              style={{
                flex: 1,
                fontSize: 16,
                padding: "7px 8px",
                border: "1.2px solid var(--border)",
                borderRadius: 4,
                outline: "none",
                background: "var(--input-bg)",
                color: "var(--text)"
              }}
              disabled={editDisabled}
            />
            <button
              type="submit"
              className="btn"
              style={{
                background: "var(--accent)",
                color: "#23273c",
                padding: "6px 14px",
                marginLeft: 8
              }}
              disabled={editDisabled || !editText.trim()}
            >
              Save
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                padding: "6px 12px",
                marginLeft: 4
              }}
              onClick={() => setEditText(null)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <span
            style={{
              flex: 1,
              textDecoration: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.6 : 1,
              fontSize: 17,
              minWidth: 0,
              overflowWrap: "anywhere"
            }}
          >
            {task.text}
          </span>
        )}
      </div>
      {!isEditing && (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            aria-label="Edit"
            className="btn btn-small"
            style={{
              background: "rgba(33, 47, 65, 0.92)",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 14,
              cursor: "pointer"
            }}
            onClick={() => onEdit(task)}
            disabled={task.completed}
          >
            Edit
          </button>
          <button
            aria-label="Delete"
            className="btn btn-small"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 14,
              cursor: "pointer"
            }}
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * The main App component.
 * Handles fetching, creating, editing, completing, and deleting tasks.
 */
function App() {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch all tasks from backend
  useEffect(() => {
    setLoading(true);
    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const json = await res.json();
        setTasks(json);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch tasks from server");
        setLoading(false);
      });
  }, []);

  // Add new task
  const handleAddTask = () => {
    if (!inputText.trim()) return;
    setAddSaving(true);
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputText })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const newTask = await res.json();
        setTasks([newTask, ...tasks]);
        setInputText("");
        setAddSaving(false);
      })
      .catch(() => {
        setError("Failed to add task");
        setAddSaving(false);
      });
  };

  // Toggle task completion
  const handleToggleComplete = (task) => {
    fetch(`${API_URL}${task.id}/complete/`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const updatedTask = await res.json();
        setTasks(tasks =>
          tasks.map(t =>
            t.id === updatedTask.id ? updatedTask : t
          )
        );
      })
      .catch(() => setError("Failed to update task"));
  };

  // Handle deleting a task
  const handleDeleteTask = (task) => {
    fetch(`${API_URL}${task.id}/`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error();
        setTasks(tasks => tasks.filter(t => t.id !== task.id));
        // No opportunity for response parsing on DELETE
      })
      .catch(() => setError("Failed to delete task"));
  };

  // Initiate edit mode for a task
  const handleEdit = (task) => {
    setEditTaskId(task.id);
    setEditText(task.text);
  };

  // Save edits to a task
  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    setEditSaving(true);
    fetch(`${API_URL}${editTaskId}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const updatedTask = await res.json();
        setTasks(tasks =>
          tasks.map(t =>
            t.id === updatedTask.id ? updatedTask : t
          )
        );
        setEditTaskId(null);
        setEditText("");
        setEditSaving(false);
      })
      .catch(() => {
        setError("Failed to edit task");
        setEditSaving(false);
      });
  };

  return (
    <div className="app" style={{ background: "var(--dark-bg)", minHeight: "100vh" }}>
      <nav
        className="navbar"
        style={{
          background: "var(--surface)",
          borderBottom: "2px solid var(--accent)"
        }}
      >
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div className="logo" style={{ color: "var(--accent)" }}>
              <span className="logo-symbol" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 24 }}>✔</span>
              <span style={{ fontWeight: 700, letterSpacing: 1, color: "var(--text)", opacity: 0.98 }}>Minimal Todo</span>
            </div>
            <span style={{ color: "var(--text-secondary)", fontWeight: 400, opacity: 0.82 }}>
              powered by Django backend
            </span>
          </div>
        </div>
      </nav>
      <main>
        <div className="container" style={{ paddingTop: 108, maxWidth: 500 }}>
          <h1 className="title" style={{ color: "var(--text)", fontSize: 36, textAlign: "center", fontWeight: 700 }}>
            My Tasks
          </h1>
          <p className="description" style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 32 }}>
            Add, edit, complete, and delete your daily todos. Data is in-memory only (not saved permanently).
          </p>

          <TaskInput
            value={inputText}
            onChange={setInputText}
            onSubmit={handleAddTask}
            placeholder="What needs to be done?"
            disabled={addSaving}
            autoFocus
          />

          {loading ? (
            <div style={{ textAlign: "center", color: "var(--primary)", padding: 12 }}>
              Loading...
            </div>
          ) : (
            <>
              {tasks.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-secondary)", fontWeight: 500, padding: 24 }}>
                  No tasks yet. Add your first one!
                </div>
              ) : (
                <section>
                  {tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      isEditing={editTaskId === task.id}
                      editText={editTaskId === task.id ? editText : undefined}
                      setEditText={editTaskId === task.id ? setEditText : undefined}
                      onSaveEdit={handleSaveEdit}
                      editDisabled={editSaving}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onEdit={handleEdit}
                    />
                  ))}
                </section>
              )}
            </>
          )}
          {error && (
            <div style={{
              background: "rgba(56,48,14,0.18)", color: "var(--accent)",
              padding: "10px 16px", borderRadius: 4, marginTop: 18,
              fontSize: 15, border: "1px solid var(--accent)"
            }}>{error}</div>
          )}
        </div>
      </main>
      <footer style={{
        textAlign: "center",
        color: "var(--text-secondary)",
        fontWeight: 400,
        padding: 28,
        fontSize: 15
      }}>
        &copy; {new Date().getFullYear()} Minimal Todo App – Powered by React & Django
      </footer>
    </div>
  );
}

export default App;
