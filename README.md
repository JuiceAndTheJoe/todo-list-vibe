# Todo List Vibe

A full-stack todo list application with a modern, clean interface. Built with Node.js, Express, MariaDB, and vanilla JavaScript.

## Features

- **Create, Read, Update, Delete** - Full CRUD operations for managing todos
- **Mark Complete** - Toggle todos between active and completed states
- **Filter Todos** - View all, active, or completed todos
- **Persistent Storage** - Todos are stored in a MariaDB database
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Mode** - Automatic dark mode based on system preferences
- **Modern UI** - Clean, gradient-styled interface with smooth animations

## Tech Stack

**Backend:**
- Node.js
- Express.js
- MariaDB

**Frontend:**
- HTML5
- CSS3 (with CSS variables and animations)
- Vanilla JavaScript (ES6+)

## Project Structure

```
todo-app/
├── backend/
│   ├── server.js        # Express API server
│   ├── package.json     # Backend dependencies
│   ├── .env.example     # Environment variables template
│   └── .env             # Your local environment config (not committed)
├── frontend/
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Stylesheet with dark mode support
│   └── app.js           # Frontend JavaScript application
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 18.0.0 or higher
- MariaDB database

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JuiceAndTheJoe/todo-list-vibe.git
   cd todo-list-vibe
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**

   Copy the example environment file and update with your database credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your MariaDB connection details:
   ```
   DB_HOST=your-database-host
   DB_PORT=3306
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=todos
   PORT=3000
   NODE_ENV=development
   ```

## Running the Application

### Development Mode

In development, you need to run the backend and frontend separately:

1. **Start the backend API server** (runs on port 3000):
   ```bash
   cd backend
   npm run dev
   ```

2. **Serve the frontend** using any static file server. For example:
   ```bash
   cd frontend
   npx serve -p 8080
   ```
   Or simply open `frontend/index.html` directly in your browser.

3. **Access the application** at `http://localhost:8080` (or wherever your frontend server is running). The frontend will automatically connect to the backend API at `http://localhost:3000`.

### Production Mode

In production, the backend serves both the API and frontend from a single server:

```bash
cd backend
NODE_ENV=production npm start
```

Access the application at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos |
| GET | `/api/todos/:id` | Get a single todo |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |
| GET | `/api/health` | Health check endpoint |

## Usage

- **Add a todo** - Type in the input field and click "Add" or press Enter
- **Complete a todo** - Click the checkbox next to a todo
- **Delete a todo** - Hover over a todo and click the trash icon
- **Filter todos** - Use the All/Active/Completed buttons to filter the list
- **Clear completed** - Click "Clear completed" to remove all completed todos

## License

MIT
