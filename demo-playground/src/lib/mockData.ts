import { FileNode } from './types';

export const mockFiles: FileNode[] = [
  {
    id: 'js-folder',
    name: 'JavaScript',
    type: 'folder',
    path: 'javascript',
    children: [
      {
        id: 'react-component',
        name: 'react-component.js',
        type: 'file',
        path: 'javascript/react-component.js',
        language: 'javascript',
        hasComments: true,
        content: `import React from 'react';

class TodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { todos: [] };
  }

  componentDidMount() {
    // Fetch todos from API
    this.fetchTodos();
  }

  async fetchTodos() {
    const response = await fetch('/api/todos');
    const todos = await response.json();
    this.setState({ todos });
  }

  render() {
    return (
      <div className="todo-list">
        {this.state.todos.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    );
  }
}

export default TodoList;`,
      },
      {
        id: 'express-api',
        name: 'express-api.js',
        type: 'file',
        path: 'javascript/express-api.js',
        language: 'javascript',
        hasComments: true,
        content: `const express = require('express');
const router = express.Router();

// GET /api/todos
router.get('/todos', async (req, res) => {
  const todos = await db.query('SELECT * FROM todos');
  res.json(todos);
});

// POST /api/todos
router.post('/todos', async (req, res) => {
  const { text } = req.body;
  const todo = await db.query('INSERT INTO todos (text) VALUES ($1) RETURNING *', [text]);
  res.status(201).json(todo);
});

module.exports = router;`,
      },
    ],
  },
  {
    id: 'ts-folder',
    name: 'TypeScript',
    type: 'folder',
    path: 'typescript',
    children: [
      {
        id: 'auth-service',
        name: 'auth-service.ts',
        type: 'file',
        path: 'typescript/auth-service.ts',
        language: 'typescript',
        hasComments: true,
        content: `interface User {
  id: string;
  email: string;
  name: string;
}

class AuthService {
  async login(email: string, password: string): Promise<User> {
    const user = await this.validateCredentials(email, password);
    const token = this.generateToken(user);
    await this.storeSession(user.id, token);
    return user;
  }

  private async validateCredentials(email: string, password: string): Promise<User> {
    // Validate against database
    throw new Error('Not implemented');
  }

  private generateToken(user: User): string {
    // Generate JWT token
    return 'token';
  }

  private async storeSession(userId: string, token: string): Promise<void> {
    // Store in Redis
  }
}

export default AuthService;`,
      },
    ],
  },
  {
    id: 'py-folder',
    name: 'Python',
    type: 'folder',
    path: 'python',
    children: [
      {
        id: 'ml-model',
        name: 'ml-model.py',
        type: 'file',
        path: 'python/ml-model.py',
        language: 'python',
        hasComments: true,
        content: `import numpy as np
from sklearn.model_selection import train_test_split

def train_model(X, y):
    """Train a machine learning model"""
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    # Initialize model
    model = RandomForestClassifier(n_estimators=100)

    # Train
    model.fit(X_train, y_train)

    # Evaluate
    score = model.score(X_test, y_test)
    print(f'Accuracy: {score:.2f}')

    return model`,
      },
    ],
  },
];
