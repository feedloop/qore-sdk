import qoreContext from "./qoreContext";
import { useRef } from "react";

function Form() {
  const { insertRow, status } = qoreContext.view("allTasks").useInsertRow();
  const name = useRef("");

  return (
    <form action="">
      <input type="text" ref={name} />
      <button
        onClick={async e => {
          e.preventDefault();
          console.log(name);
          const data = { name: name.current.value };
          await insertRow({ ...data });
          name.current.value = "";
        }}
      >
        Insert
      </button>
    </form>
  );
}

export default Form;
