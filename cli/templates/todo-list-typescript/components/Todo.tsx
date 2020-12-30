import "todomvc-common/base.css";
import "todomvc-app-css/index.css";
import "todomvc-common/base";
import React from "react";
import qoreContext from "../utils/qoreContext";
import { QoreProjectSchema } from "../qore-generated";

const TodoItem = (props: {
  task: QoreProjectSchema["toDoDefaultView"]["read"];
}) => {
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState({
    isEditing: false
  });
  const deleteTask = qoreContext.views.toDoDefaultView.useDeleteRow();
  const updateTask = qoreContext.views.toDoDefaultView.useUpdateRow();
  return (
    <li
      key={props.task.id}
      className={`${props.task.done ? "completed" : ""} ${
        state.isEditing && "editing"
      }`}
    >
      <div className="view">
        <input
          disabled={updateTask.status === "loading"}
          onClick={() => {
            updateTask.updateRow(props.task.id, { done: !props.task.done });
          }}
          className="toggle"
          type="checkbox"
          checked={props.task.done}
        />
        <label
          onClick={() => {
            setState({ isEditing: true });
            setTimeout(() => {
              editInputRef.current?.focus();
            }, 100);
          }}
        >
          {deleteTask.status === "loading"
            ? "[Removing]"
            : deleteTask.status === "success"
            ? "[Removed]"
            : undefined}
          {props.task.task}
        </label>
        <button
          className="destroy"
          disabled={deleteTask.status !== "idle"}
          onClick={async () => {
            await deleteTask.deleteRow(props.task.id);
          }}
        ></button>
      </div>
      <input
        ref={editInputRef}
        className="edit"
        disabled={updateTask.status === "loading"}
        defaultValue={props.task.task}
        onBlur={() => {
          setState({ isEditing: false });
        }}
        onKeyPress={async e => {
          if (e.key === "Enter") {
            await updateTask.updateRow(props.task.id, {
              task: e.currentTarget.value
            });
            setState({ isEditing: false });
          }
        }}
      />
    </li>
  );
};

const Todo = () => {
  const taskInputRef = React.useRef<HTMLInputElement>(null);
  const tasks = qoreContext.views.toDoDefaultView.useListRow(
    { limit: 10, order: "desc" },
    { pollInterval: 1000 }
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
