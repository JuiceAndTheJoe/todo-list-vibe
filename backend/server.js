require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend')));
}

// Database connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  acquireTimeout: 30000
});

// Initialize database table
async function initializeDatabase() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

// API Routes

// GET all todos
app.get('/api/todos', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT id, title, completed, created_at FROM todos ORDER BY created_at DESC'
    );
    // Convert BigInt to Number and boolean
    const todos = rows.map(row => ({
      id: Number(row.id),
      title: row.title,
      completed: Boolean(row.completed),
      created_at: row.created_at
    }));
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  } finally {
    if (conn) conn.release();
  }
});

// GET single todo
app.get('/api/todos/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT id, title, completed, created_at FROM todos WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    const todo = {
      id: Number(rows[0].id),
      title: rows[0].title,
      completed: Boolean(rows[0].completed),
      created_at: rows[0].created_at
    };
    res.json(todo);
  } catch (err) {
    console.error('Error fetching todo:', err);
    res.status(500).json({ error: 'Failed to fetch todo' });
  } finally {
    if (conn) conn.release();
  }
});

// POST create new todo
app.post('/api/todos', async (req, res) => {
  let conn;
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO todos (title, completed) VALUES (?, FALSE)',
      [title.trim()]
    );
    const newTodo = {
      id: Number(result.insertId),
      title: title.trim(),
      completed: false,
      created_at: new Date()
    };
    res.status(201).json(newTodo);
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT update todo
app.put('/api/todos/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    conn = await pool.getConnection();

    // Check if todo exists
    const existing = await conn.query('SELECT * FROM todos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.push('title = ?');
      values.push(title.trim());
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await conn.query(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated todo
    const rows = await conn.query(
      'SELECT id, title, completed, created_at FROM todos WHERE id = ?',
      [id]
    );
    const updatedTodo = {
      id: Number(rows[0].id),
      title: rows[0].title,
      completed: Boolean(rows[0].completed),
      created_at: rows[0].created_at
    };
    res.json(updatedTodo);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    conn = await pool.getConnection();

    const result = await conn.query('DELETE FROM todos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  } finally {
    if (conn) conn.release();
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  } finally {
    if (conn) conn.release();
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
