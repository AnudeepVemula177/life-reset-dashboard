// JavaScript makes the dashboard interactive.
// These starter tasks appear the first time the page is opened.
const starterTasks = [
  { id: 1, text: "Study or learn for 25 minutes", completed: false },
  { id: 2, text: "Move your body for a little while", completed: false },
  { id: 3, text: "Plan tomorrow before sleeping", completed: false }
];

const STORAGE_KEY = "life-reset-dashboard-tasks";

// Read saved tasks from this browser. If none exist, use the starter tasks.
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterTasks;
  } catch (error) {
    return starterTasks;
  }
}

let tasks = loadTasks();
let nextTaskId = Math.max(0, ...tasks.map(task => task.id)) + 1;

// Find HTML elements so JavaScript can update them.
const taskList = document.querySelector("#task-list");
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const completedCount = document.querySelector("#completed-count");
const totalCount = document.querySelector("#total-count");
const progressNumber = document.querySelector("#progress-number");
const progressFill = document.querySelector("#progress-fill");
const taskCountLabel = document.querySelector("#task-count-label");

function saveTasks() {
  // localStorage saves text data in this browser on this device.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  // Clear the old list before drawing the current tasks.
  taskList.replaceChildren();

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No tasks yet. Add one small goal above.";
    taskList.append(empty);
  }

  tasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item" + (task.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-toggle";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark " + task.text + " complete");
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const label = document.createElement("span");
    label.className = "task-text";
    label.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-task";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", "Delete " + task.text);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(currentTask => currentTask.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, label, deleteButton);
    taskList.append(item);
  });

  updateProgress();
}

function updateProgress() {
  const completed = tasks.filter(task => task.completed).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  completedCount.textContent = completed;
  totalCount.textContent = total;
  progressNumber.textContent = percentage;
  progressFill.style.width = percentage + "%";
  taskCountLabel.textContent = total + (total === 1 ? " task" : " tasks");
}

taskForm.addEventListener("submit", event => {
  // Prevent the form from reloading the whole webpage.
  event.preventDefault();
  const text = taskInput.value.trim();

  if (!text) return;

  tasks.push({ id: nextTaskId++, text, completed: false });
  saveTasks();
  renderTasks();
  taskInput.value = "";
  taskInput.focus();
});

// A simple 25-minute focus timer.
const timerDisplay = document.querySelector("#timer");
const timerStatus = document.querySelector("#timer-status");
const startButton = document.querySelector("#start-button");
const resetButton = document.querySelector("#reset-button");

const FOCUS_SECONDS = 25 * 60;
let secondsLeft = FOCUS_SECONDS;
let timerInterval = null;

function updateTimerDisplay() {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  timerDisplay.textContent =
    String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

startButton.addEventListener("click", () => {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
    startButton.textContent = "Resume focus";
    timerStatus.textContent = "Paused — take a breath";
    return;
  }

  if (secondsLeft <= 0) secondsLeft = FOCUS_SECONDS;
  timerStatus.textContent = "Focus on one thing at a time";
  startButton.textContent = "Pause";

  timerInterval = setInterval(() => {
    secondsLeft -= 1;
    updateTimerDisplay();

    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      startButton.textContent = "Start again";
      timerStatus.textContent = "Session complete — great work!";
    }
  }, 1000);
});

resetButton.addEventListener("click", () => {
  if (timerInterval !== null) clearInterval(timerInterval);
  timerInterval = null;
  secondsLeft = FOCUS_SECONDS;
  updateTimerDisplay();
  startButton.textContent = "Start focus";
  timerStatus.textContent = "Ready when you are";
});

// Draw the initial task list and timer when the page loads.
renderTasks();
updateTimerDisplay();
