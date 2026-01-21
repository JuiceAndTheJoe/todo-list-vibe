// API Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const statsSection = document.getElementById('stats');
const itemsLeft = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupEventListeners();
  await fetchTodos();
}

function setupEventListeners() {
  // Form submission
  todoForm.addEventListener('submit', handleAddTodo);

  // Filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
    });
  });

  // Retry button
  retryBtn.addEventListener('click', fetchTodos);

  // Clear completed
  clearCompletedBtn.addEventListener('click', handleClearCompleted);
}

// API Functions
async function fetchTodos() {
  showLoading();
  try {
    const response = await fetch(`${API_URL}/todos`);
    if (!response.ok) throw new Error('Failed to fetch todos');
    todos = await response.json();
    renderTodos();
  } catch (error) {
    showError(error.message);
  }
}

async function createTodo(title) {
  try {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error('Failed to create todo');
    const newTodo = await response.json();
    todos.unshift(newTodo);
    renderTodos();
    return true;
  } catch (error) {
    showTemporaryError(error.message);
    return false;
  }
}

async function updateTodo(id, updates) {
  try {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    const updatedTodo = await response.json();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos[index] = updatedTodo;
    }
    renderTodos();
    return true;
  } catch (error) {
    showTemporaryError(error.message);
    // Revert optimistic update
    await fetchTodos();
    return false;
  }
}

async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete todo');
    todos = todos.filter(t => t.id !== id);
    renderTodos();
    return true;
  } catch (error) {
    showTemporaryError(error.message);
    return false;
  }
}

// Event Handlers
async function handleAddTodo(e) {
  e.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;

  const success = await createTodo(title);
  if (success) {
    todoInput.value = '';
  }
}

async function handleToggle(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  await updateTodo(id, { completed: !todo.completed });
}

async function handleDelete(id) {
  await deleteTodo(id);
}

async function handleClearCompleted() {
  const completedTodos = todos.filter(t => t.completed);
  for (const todo of completedTodos) {
    await deleteTodo(todo.id);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderTodos();
}

// Render Functions
function renderTodos() {
  hideAllStates();

  const filteredTodos = getFilteredTodos();
  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  // Update stats
  if (todos.length > 0) {
    statsSection.classList.remove('hidden');
    itemsLeft.textContent = `${activeTodos.length} item${activeTodos.length !== 1 ? 's' : ''} left`;
    clearCompletedBtn.classList.toggle('hidden', completedTodos.length === 0);
  } else {
    statsSection.classList.add('hidden');
  }

  // Show empty state or render list
  if (filteredTodos.length === 0) {
    todoList.innerHTML = '';
    if (todos.length === 0) {
      emptyState.querySelector('p').textContent = 'No todos yet. Add one above!';
    } else if (currentFilter === 'active') {
      emptyState.querySelector('p').textContent = 'No active todos. Great job!';
    } else if (currentFilter === 'completed') {
      emptyState.querySelector('p').textContent = 'No completed todos yet.';
    }
    emptyState.classList.remove('hidden');
    return;
  }

  todoList.innerHTML = filteredTodos.map(todo => createTodoHTML(todo)).join('');

  // Add event listeners to checkboxes and delete buttons
  todoList.querySelectorAll('.todo-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      handleToggle(parseInt(checkbox.dataset.id, 10));
    });
  });

  todoList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleDelete(parseInt(btn.dataset.id, 10));
    });
  });
}

function createTodoHTML(todo) {
  return `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <label class="checkbox-wrapper">
        <input
          type="checkbox"
          class="todo-checkbox"
          data-id="${todo.id}"
          ${todo.completed ? 'checked' : ''}
        >
        <span class="checkmark"></span>
      </label>
      <span class="todo-text">${escapeHTML(todo.title)}</span>
      <button class="delete-btn" data-id="${todo.id}" aria-label="Delete todo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </li>
  `;
}

function getFilteredTodos() {
  switch (currentFilter) {
    case 'active':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    default:
      return todos;
  }
}

// UI State Functions
function showLoading() {
  hideAllStates();
  loadingState.classList.remove('hidden');
}

function showError(message) {
  hideAllStates();
  errorMessage.textContent = message;
  errorState.classList.remove('hidden');
}

function showTemporaryError(message) {
  // Create a toast notification for temporary errors
  const toast = document.createElement('div');
  toast.className = 'toast-error';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ef4444;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideUp 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function hideAllStates() {
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
}

// Utility Functions
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
