import React from "react";
import qoreContext from "../utils/qoreContext";
import { QoreProjectSchema } from "../qore-generated";

export default function TodoItem(props: {
  task: QoreProjectSchema["toDoDefaultView"]["read"];
}) {
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState({
    isEditing: false
  });
  const { data: task, status } = qoreContext.views.toDoDefaultView.useGetRow(
    props.task.id
  );
  const deleteTask = qoreContext.views.toDoDefaultView.useDeleteRow();
  const updateTask = qoreContext.views.toDoDefaultView.useUpdateRow();
  if (status === "loading" || !task)
    return (
      <li key={props.task.id}>
        <div className="view">
          <input className="toggle" type="checkbox" />
          <label>Loading</label>
          <button className="destroy"></button>
        </div>
        <input className="edit" />
      </li>
    );
  return (
    <li
      key={task.id}
      className={`${task.done ? "completed" : ""} ${
        state.isEditing && "editing"
      }`}
    >
      <div className="view">
        <input
          disabled={updateTask.status === "loading"}
          onClick={() => {
            updateTask.updateRow(task.id, { done: !task.done });
          }}
          className="toggle"
          type="checkbox"
          checked={task.done}
        />
        <label
          onClick={() => {
            if (deleteTask.status == "success") return;
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
          {task.task}
        </label>
        <button
          className="destroy"
          disabled={deleteTask.status !== "idle"}
          onClick={async () => {
            await deleteTask.deleteRow(task.id);
          }}
        ></button>
      </div>
      <input
        ref={editInputRef}
        className="edit"
        disabled={updateTask.status === "loading"}
        defaultValue={task.task}
        onBlur={() => {
          setState({ isEditing: false });
        }}
        onKeyPress={async e => {
          if (e.key === "Enter") {
            await updateTask.updateRow(task.id, {
              task: e.currentTarget.value
            });
            setState({ isEditing: false });
          }
        }}
      />
    </li>
  );
}
