import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import qoreContext from "./qoreContext";

function Detail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const { data } = qoreContext.view("allTasks").useGetRow(id);
  const { updateRow } = qoreContext.view("allTasks").useUpdateRow();

  const client = qoreContext.useClient();

  const handleUpload = async event => {
    const file = event.currentTarget.files?.item(0);
    if (!file) return;
    const url = await client.view("allTasks").upload(file);
    await updateRow(id, { ...data, attachment: url });
  };

  useEffect(() => {
    function fetchData() {
      setTask(data);
      if (data) {
        setName(data.name);
        setDone(data.done);
      }
    }
    fetchData();
  }, [data]);
  return (
    <>
      {task && (
        <>
          <header>
            <h1>Detail TODO</h1>
          </header>
          <form>
            <input
              type="text"
              placeholder="Something to do..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              type="checkbox"
              checked={done}
              onChange={() => setDone(!done)}
            />
            <input type="file" onChange={handleUpload} />
            <div style={{ paddingTop: 6, paddingBottom: 6 }}>
              <button
                onClick={async e => {
                  e.preventDefault();
                  const data = {
                    name,
                    done
                  };
                  await updateRow(task.id, { ...data });
                }}
              >
                Update
              </button>
            </div>
          </form>
        </>
      )}
      <Link to="/">Back</Link>
    </>
  );
}

export default Detail;
