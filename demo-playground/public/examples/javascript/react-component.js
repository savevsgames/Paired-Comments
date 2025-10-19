import React from 'react';

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

export default TodoList;