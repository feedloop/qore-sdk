import "todomvc-common/base.css";
import "todomvc-app-css/index.css";
import "todomvc-common/base";
import React from "react";
import qoreContext from "../utils/qoreContext";
import TodoItem from "./TodoItem";

const Todo = () => {
  const taskInputRef = React.useRef<HTMLInputElement>(null);
  const tasks = qoreContext.views.toDoDefaultView.useListRow(
    { limit: 10, order: "desc" },
    { pollInterval: 5000 }
  );
  const insertTask = qoreContext.views.toDoDefaultView.useInsertRow();
  const handleAddTask = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        await insertTask.insertRow({
          task: e.currentTarget.value,
          done: false,
          description: e.currentTarget.value,
          deadline: new Date(),
          points: 0
        });
        tasks.revalidate();
        if (taskInputRef.current) taskInputRef.current.value = "";
      }
    },
    []
  );
  return (
    <>
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>
          <input
            onKeyPress={handleAddTask}
            className="new-todo"
            placeholder="What needs to be done?"
            autoFocus
            disabled={insertTask.status === "loading"}
            ref={taskInputRef}
          />
        </header>
        <section className="main">
          <input id="toggle-all" className="toggle-all" type="checkbox" />
          <label htmlFor="toggle-all">Mark all as complete</label>
          <ul className="todo-list">
            {tasks.data.map(task => (
              <TodoItem task={task} key={task.id} />
            ))}
          </ul>
        </section>
        <footer className="footer">
          <span className="todo-count">
            <strong>0</strong> item left
          </span>
          <ul className="filters">
            <li>
              <a className="selected" href="#/">
                All
              </a>
            </li>
            <li>
              <a href="#/active">Active</a>
            </li>
            <li>
              <a href="#/completed">Completed</a>
            </li>
          </ul>
          <button className="clear-completed">Clear completed</button>
        </footer>
      </section>
      <footer className="info">
        <p>Double-click to edit a todo</p>
        <p>
          Template by <a href="http://sindresorhus.com">Sindre Sorhus</a>
        </p>
        <p>
          Created by <a href="http://todomvc.com">you</a>
        </p>
        <p>
          Part of <a href="http://todomvc.com">TodoMVC</a>
        </p>
      </footer>
    </>
  );
};

export default Todo;
