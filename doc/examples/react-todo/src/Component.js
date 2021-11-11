import { useState } from "react";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";

import qoreContext from "./qoreContext";
import Form from "./Form";

const Component = () => {
  const client = qoreContext.useClient();
  const { user } = qoreContext.useCurrentUser();

  async function handleLogin() {
    const token = await client.authenticate("rizafahmi@gmail.com", "rahasia");
    Cookies.set("token", token);
    console.log(token);
  }

  const {
    data: allTasks,
    status,
    fetchMore,
    revalidate
  } = qoreContext.view("allTasks").useListRow(
    {
      offset: 0,
      limit: 10
    },
    { networkPolicy: "network-and-cache", pollInterval: 5000 }
  );
  return (
    <>
      <Form />
      {!user && <button onClick={handleLogin}>Click here to login</button>}
      <hr />
      <button onClick={revalidate}>Refresh</button>
      <ul>
        {allTasks.map(task => (
          <li>
            <Link to={`/detail/${task.id}`}>{task.name}</Link>
          </li>
        ))}
        <button
          onClick={() => {
            // new items are being pushed to allTasks
            fetchMore({ offset: allTasks.length, limit: 10 });
          }}
        >
          Load more
        </button>
      </ul>
    </>
  );
};

export default Component;
