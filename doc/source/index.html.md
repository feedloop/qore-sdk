---
title: Qore Client SDK

language_tabs: # must be one of https://git.io/vQNgJ
  - jsx: React
  - javascript: JavaScript

toc_footers:
  - <a href='https://dashboard.qorebase.io' target='_blank'>Sign up to get started.</a>

search: true

code_clipboard: true
---

# Introduction

Welcome to Qore Client SDK documentation page, this document will guide you to start hacking with Qore. As of now, Qore Client SDK is only accessible in JavaScript Environment, React and vanilla JavaScript for now.

## Prerequisites

1. Node.js 12+.
2. `npm` or `yarn` executable.
3. Qore account, signup [here](https://dashboard.qorebase.io) & don't forget to verify your account.
4. Then login to your account to setup your data.

## Features

### Document caching

Each read operation is cached by default, any _similar_ read request will share the same data. With qore client you might not need additional state management.

### TypeScript Support

Qore cli can generate the schema of your project in TypeScript, meaning that you'll know what to insert and what to read from your qore client.

# Getting Started

Run through this getting started guide to get your feet wet in 7 steps.

## Step 1: Install Qore CLI

Install `@feedloop/qore-cli` globally via npm or yarn.

> Installing via npm

```shell
npm install --global @feedloop/qore-cli
```

> Installing via yarn

```shell
yarn global add @feedloop/qore-cli
```

This will install the cli in your system. Try run qore-cli with `--help` flag to make sure it's installed properly.

```shell
qore --help
```

If you can see the help page, you're good to go!

```text

qore cli

VERSION
  @feedloop/qore-cli/0.1.29 darwin-x64 node-v15.3.0

USAGE
  $ qore [COMMAND]

COMMANDS
  codegen         Generate qore project files
  create-project  create a project from template
  export-schema   export the schema of a given project
  help            display help for qore
  login           Login to qore cli
  set-project     Set project target
```

## Step 2: Authenticate yourself

You need to login into the system via the cli. In case you're not registered yet, [you can do it first over here](https://console.qore.sh/register/form) and activate your account before logging in.
You will be asked to input your email & password. Then you can choose your default project afterward.

```shell
qore login
```

Input your email and password.

```text
✔ Enter your email … esdeke@feeloop.io
? Enter your password › ******
Logged in as esdeke@feedloop.io
```

Now, you're good to go!

## Step 3: Setup a new project

Before we jump into code, let's create a new project via [qore dashboard](https://dashboard.qorebase.io)

<p>
<iframe src="https://drive.google.com/file/d/1PJLqDiwEXjo0tmVuHKqAyk1rxHZudeo6/preview" width="100%" height="320"></iframe>
</p>

## Step 4: Setup your code

Go to your code project directory.

```shell
cd my-new-project
```

Or if you don't have one yet, you can create your project using [React](https://reactjs.org), [Next](https://nextjs.org), or even Vanilla Javascript.

Inside your project directory, install the required dependencies below.

```shell
npm install @feedloop/qore-client
```

```shell
npm install --save-dev @feedloop/qore-cli
```

> For ReactJS/NextJS : install @feedloop/qore-react to your project.

```shell
npm install @feedloop/qore-react
```

## Step 5: Set your project as the Qore project.

Run `set-project` command to set your project as the Qore project.

```shell
qore set-project
```

Then choose organization and desired project using your keyboard arrow key and enter key to select.

```text
✔ Select organization › Qore Screencast
? Select project › - Use arrow-keys. Return to submit.
❯   todo-list
    Qore Video Course
    Starbaks App
    Galeri Alert
Successfully set project to todo-list of the Qore organization
```

## Step 6: Generate configuration file

On your root project directory, run the codegen command to generate the required config files. If your code resides inside `src/` directory, like almost JavaScript frameworks do, then you need to use `--path` flag.

```text
$ tree .
.
├── public/
├── src/
│   ├── App.js
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
├── README.md
├── package-lock.json
└── package.json
```

```shell
qore codegen --path src
```

Codegen command will ensure that you will have the latest version of your configuration files on your project. Run this command when:

1. **The following files don't exist** on your root project directory.
2. **Every time there are changes** to your project structure (includes views, fields, tables, and forms).

| File name          | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `qore.schema.json` | Contains the schema required to run qore client.         |
| `qore.config.json` | Contains the config required to connect to your project. |
| `qore-env.d.ts`    | TypeScript type definitions of your project schema.      |

<aside class="notice">
  This command will look for an existing config to infer from it. If you want to reset the config, remove the files mentioned above.
</aside>

```text
$ tree .
.
├── public/
├── src/
│   ├── App.js
│   ├── index.js
│   ├── logo.svg
│   ├── qore-env.d.ts                 # generated config
│   ├── qore.config.json              # generated config
│   ├── qore.schema.json              # generated config
│   ├── reportWebVitals.js
│   └── setupTests.js
├── README.md
├── package-lock.json
└── package.json
```

But in case, somehow your code is on the root directory, running `codegen` command without any flag will do.

```shell
qore codegen
```

Or you also can add `qoreconfig` to your `package.json` file to only store your configuration files to your desired path (.i.e `src`);

> package.json

```json
{
...
  "qoreconfig": {
    "path": "src"
  }
}
```

## Step 7: Initialize Qore Client

Initialize qore client by creating the following file.

### `qoreContext.js`

```javascript
import { QoreClient } from "@feedloop/qore-client";
import config from "./qore.config.json";
import schema from "./qore.schema.json";

const client = new QoreClient(config);
client.init(schema);

export default client;
```

```jsx
import { QoreClient } from "@feedloop/qore-client";
import createQoreContext from "@feedloop/qore-react";
import config from "./qore.config.json";
import schema from "./qore.schema.json";

const client = new QoreClient(config);
client.init(schema);

const qoreContext = createQoreContext(client);
export default qoreContext;
```

### TypeScript support

The [codegen](#codegen) command will also generate type definitions based on your project schema, exported as `ProjectSchema` interface from `"@feedloop/qore-client"`. All you need to do is feed this interface to the `QoreClient` class initialization.

```typescript
import { QoreClient, ProjectSchema } from "@feedloop/qore-client";
import config from "./qore.config.json";
import schema from "./qore-schema.json";

const client = new QoreClient<ProjectSchema>(config);
client.init(schema as any);
```

With this file created, you are ready to:

1. [Reading data](#reading-data)
2. [Writing data](#writing-data)
3. [Authenticating your user](#authenticating-your-user)

# Reading data

Once initialized, your project views will be accessible via the client instance. Let's start reading the data of your view.

<aside class="notice">
Just make sure your view, "allTasks" in this case has some data in it.
</aside>

```javascript
import client from "./qoreContext.js";

let tasks = [];

async function getData() {
  const { data, error } = await client
    .view("allTasks")
    .readRows({ offset: 0, limit: 10, order: "desc" })
    .toPromise();
  tasks = data.nodes;
}

async function render() {
  await getData();
  const template = document.querySelector("#tasks");
  const app = document.querySelector("#app");

  const clonedTemplate = template.content.cloneNode(true);
  for (let i = 0; i < tasks.length; i++) {
    const li = document.createElement("li");
    li.textContent = tasks[i].name;
    clonedTemplate.appendChild(li);
  }
  app.appendChild(clonedTemplate);
}

render();
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { data: allTasks, status } = qoreContext.view("allTasks").useListRow({
    offset: 0,
    limit: 10,
    order: "asc"
  });
  return (
    <ul>
      {allTasks.map(task => (
        <li>{task.name}</li>
      ))}
    </ul>
  );
};
export default Component;
```

Method `readRow()` in JavaScript SDK or `useListRow()` in React SDK will return `data` that contain rows of your `allTasks` view. In case an error occurs, `data` can be null and `error` should contain the cause of the error.

You can also specify `offset`, `limit`, and `order` when performing a read view operation as an option that you can put in the object argument.

## Pagination

Fetching more rows can be done by calling the `fetchMore` method as demonstrated below. It accepts a pagination config to match your desired items size of the next page data to be fetched.

```javascript
async function handleLoadMore() {
  const operation = client.view("allTasks").readRows({ offset: 0, limit: 10 });

  operation.subscribe(({ data }) => {
    tasks = data.nodes;
  });

  await operation.fetchMore({ offset: tasks.length, limit: 10 });
  // new items are being pushed to allTasks
  render();
}
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const {
    data: allTasks,
    status,
    fetchMore
  } = qoreContext.view("allTasks").useListRow({
    offset: 0,
    limit: 10
  });
  return (
    <ul>
      {allTasks.map(task => (
        <li>{task.name}</li>
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
  );
};

export default Component;
```

## Reading individual row

Some other times we want to get the detail of a specific row by the ID. You can use `readRow()` for JavaScript SDK or `useGetRow()` for React SDK. Assuming the id is _some-task-id_, you can fetch it this way:

```javascript
async function getTask(id) {
  const { data, error } = await client.view("allTasks").readRow(id).toPromise();
  console.log(data);
}

getTask("b82234fd-3b10-4831-b9d8-eef3275328a2");
```

```jsx
import qoreContext from "./qoreContext";

function Detail() {
  const { id } = useParams();

  const {
    data: task,
    status,
    error
  } = qoreContext.view("allTasks").useGetRow(id);

  return (
    <>
      {task && (
        <>
          <header>
            <h1>Detail TODO: {task.name}</h1>
          </header>
          <div>Status: {task.done ? `✅` : `❌`}</div>
        </>
      )}
      <Link to="/">Back</Link>
    </>
  );
}

export default Detail;
```

Both methods will return `data` that contain either a single row or null. If an error has occurred, `error` object will tell you the cause.

## Caching data

A qore client has internal storage that acts as a cache that is turned on by default to minimize http request.

By setting the `networkPolicy` option to `cache-only`, you are telling qore client to only get the data from the cache instead of getting it from the server.

```javascript
let tasks = [];

async function getData() {
  const { data, error } = await client
    .view("allTasks")
    .readRows(
      { offset: 0, limit: 10, order: "desc" },
      { networkPolicy: "cache-only" }
    )
    .toPromise();
  tasks = data.nodes;
}
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const {
    data: allTasks,
    status,
    error
  } = qoreContext.view("allTasks").useListRow(
    {
      offset: 0,
      limit: 10,
      order: "asc"
    },
    { networkPolicy: "cache-only" }
  );
  return (
    <ul>
      {allTasks.map(task => (
        <li>{task.name}</li>
      ))}
    </ul>
  );
};
```

The `networkPolicy` option accepts the following values:

| Value             | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| cache-only        | Read data only from the cache                                      |
| network-only      | Read data only from the network                                    |
| network-and-cache | Read data from the cache first, then a network request will follow |

Reading data from `network-and-cache` may require you to subscribe to the read operation because there will be a follow-up result from the network after the operation hits the cache.

<aside class="notice">
You don't need to subscribe to anything if you use the React Hooks as it does this for you internally.
</aside>

```javascript
const operation = client
  .view("allTasks")
  .readRows(
    { offset: 0, limit: 10, order: "desc" },
    { networkPolicy: "network-and-cache" }
  );

const subscription = operation.subscribe(({ data, error, stale }) => {
  if (data && !stale) {
    doSomething(data);
    subscription.unsubscribe();
  }
});
```

Property `stale` will be `true` when it hits the cache, `false` when it hits the network. This indicating that the data might be obsolete due to a follow-up network request.

## Revalidating data

```javascript
const operation = client
  .view("allTasks")
  .readRows(
    { offset: 0, limit: 10, order: "desc" },
    { networkPolicy: "network-and-cache" }
  );

const subscription = operation.subscribe(({ data, error, stale }) => {
  doSomething(data);
});

operation.revalidate();
```

```jsx
import qoreContext from "./qoreContext";
import { Link } from "react-router-dom";

const Component = () => {
  const {
    data: allTasks,
    status,
    fetchMore,
    revalidate
  } = qoreContext.view("allTasks").useListRow({
    offset: 0,
    limit: 10
  });
  return (
    <>
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
```

Oftentimes you want to get the most up-to-date state of your data from the network.

By calling `revalidate()` method, you are asking qore client to send a `network-only` mode to your operation, giving you the most recent state of the data. Think of it as a reload button of your browser tab.

## Polling interval

Instead of calling `operation.revalidate()` periodically, you can ask qore client to send request periodically by specifying a polling interval option in a millisecond. This method is known as polling. Add `pollInterval` option followed with number as millisecond will gather data periodically.

```javascript
const operation = client
  .view("allTasks")
  .readRows(
    { offset: 0, limit: 10, order: "desc" },
    { networkPolicy: "network-and-cache", pollInterval: 5000 }
  );

const subscription = operation.subscribe(({ data, error, stale }) => {
  doSomething(data);
});
```

```jsx
import qoreContext from "./qoreContext";
import { Link } from "react-router-dom";

const Component = () => {
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
      <button onClick={revalidate}>Refresh</button>
      <ul>
        {allTasks.map(task => (
          <li>
            <Link to={`/detail/${task.id}`}>{task.name}</Link>
          </li>
        ))}
        <button
          onClick={() => {
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
```

By doing this, the data will refresh every 5 seconds, a nice near-realtime effect to your users.

# Writing data

Similar to reading data, writing data is accessible from each view object.

## Insert a new row

To insert data to `allTasks` view, we can use `insertRow()` method followed by `data` as a parameter and must be compliant to the schema of the view, excluding the `id` field.

```javascript
const newRow = await client.view("allTasks").insertRow({ ...data });
```

```jsx
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
```

## Update a row

To do an update operation, data parameter of `allTasks` view with an id of _some-task-id_.

And also `data` object must be compliant with the schema of the view, excluding the `id` field similar to the insert operation above.

```javascript
await client.view("allTasks").updateRow("some-task-id", {
  ...data
});
```

```jsx
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
```

## Add & remove relationships

You can also add an additional relationship to your data. For example, if some tasks need to delegate to some member, we can add relation tasks with the member entity. On the other hand, if the relationship is no longer needed, we can remove it.

Both `addRelation` and `removeRelation` methods accept the `id` of the target row, followed by an object with the key being the relation name and the value is an array of reference id of the relationship.

```javascript
await client.view("allTasks").addRelation(taskId, {
  person: [member.id],
  links: links.map(link => link.id)
});

await client.view("allTasks").removeRelation(taskId, {
  person: [member.id]
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { addRelation, removeRelation, statuses, errors } = qoreContext
    .view("allTasks")
    .useRelation(taskId);
  return (
    <div>
      <button
        disabled={statuses.addRelation === "loading"}
        onClick={async () => {
          await addRelation({
            person: [member.id],
            links: links.map(link => link.id)
          });
        }}
      >
        add relation
      </button>
      <button
        disabled={statuses.removeRelation === "loading"}
        onClick={async () => {
          await removeRelation({ person: [member.id] });
        }}
      >
        remove relation
      </button>
    </div>
  );
};
```

In this example we are adding `member.id` to the relationship of a specific row on the `allTasks` view and then removing it.

## Upload a file

One of the great features of Qore is the ability to upload a file such as an image, audio, video, text, document, and other types. To accept a file, make sure your view has a file as the field type. For example below, field avatar has a file as the field type.

We need two simple steps. Step one, upload some file from HTML form using `upload()` method. Step two, update the view to attach the file uploaded into the desired field.

```javascript
const file =  document.getElementById('fileInput').files[0];
const url = await client.view("allTasks").upload(file);
await client.view("allTasks").updateRow("some-task-id", {
  ...data
  avatar: url
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { updateRow, status } = qoreContext.view("allTasks").useUpdateRow();
  const handleUpload = async event => {
    const file = e.currentTarget.files?.item(0);
    if (!file) return;
    const url = await client.view("allTasks").upload(file);
    await updateRow("some-task-id", { ...data, avatar: url });
  };
  return <input type="file" onChange={handleUpload} />;
};
```

Adding files to a row requires you to upload the file first. The file type of the uploaded files must match with the field target, unwanted file types will be ignored.

The `upload()` method accepts a `file` variable that is a [File](https://developer.mozilla.org/en-US/docs/Web/API/File) item of a [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList) object from a file input html element.

```html
<input type="file" id="fileInput" />
```

## Delete a row

To remove a data of `allTasks` view with an id of _some-task-id_ using `deleteRow()` method for JavaScript or `useDeleteRow()` method for React SDK.

```javascript
await client.view("allTasks").deleteRow("some-task-id");
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { deleteRow, status } = qoreContext.view("allTasks").useDeleteRow();
  return (
    <button
      onClick={async () => {
        await deleteRow("some-task-id", { ...data });
      }}
    >
      delete
    </button>
  );
};
```

## Trigger actions

Each Qore row can have one or more action triggers. An action trigger may require parameters.
To use trigger, there is `trigger()` method for JavaScript SDK and `useActions()` method for React SDK.

```javascript
await client.view("allTasks").action("archiveTask").trigger("some-task-id", {
  someParams: "someValue"
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { action, statuses } = qoreContext
    .view("allTasks")
    .useActions("some-task-id");
  return (
    <button
      onClick={async () => {
        await action("archiveTask").trigger({
          someParams: "someValue"
        });
      }}
    >
      archive task
    </button>
  );
};
```

## Send form inputs

If you have form view, you can use form to insert some data with paramters using `SendForm()` for JavaScript SDK or `useForm()` React SDK.

```javascript
await client
  .view("allTasks")
  .form("newTask")
  .sendForm({ task: "Some task", done: true });
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { send, status } = qoreContext.view("allTasks").useForm("newTask");
  return (
    <button
      onClick={async () => {
        await send({ task: "Some task", done: true });
      }}
    >
      Add new task
    </button>
  );
};
```

# Authenticating your user

One more feature that Qore has is the authentication feature. You can use it for registration and login user to use your application. First off, you need to initiate Qore Client with token configuration.

Then you can authenticate the user with `authenticate()` method. It uses cookie, so for de-authenticate or logout, do remove the cookie.

```javascript

// give qore client a way to access user token
const client = new QoreClient({..config, getToken: () => cookies.get("token")})

const token = await client.authenticate(
  "email@yourcompany.com",
  "plain password"
);

// save token to somewhere safe
cookies.set("token", token);

// log a user out by removing the token from your storage
cookies.remove("token");
```

```jsx

// qoreContext.js
// give qore client a way to access user token
const client = new QoreClient({..config, getToken: () => cookies.get("token")})

// YourComponent.js
const YourComponent = () => {
  const client = qoreContext.useClient();
  const handleLogout = () => {
    // log a user out by removing the token from your storage
    cookies.remove("token");
  }
  const handleLogin = async (email, password) => {
    const token = await client.authenticate(
      "email@yourcompany.com",
      "plain password"
    );

    // save token to somewhere safe
    cookies.set("token", token);
  };
  // call handleLogin whenever your form is ready
  return <form onSubmit={handleLogin}>Some form</form>;
};
```

## Get current user

To get current user logged in, use `currentUser()` or `useCurrentUser()` method for JavaScript or React respectively. If the token is valid, an object that describes the current user will be returned from this call.

```javascript
const currentUser = await client.currentUser();
```

```jsx
const Component = () => {
  const { user } = qoreContext.useCurrentUser();
  return <div>{user ? user.email : "Loading..."}</div>;
};
```

# Error handling

One of the best practices for providing a good user experience for users is a good and helpful error message.
Any error that occurs along the lifetime of a Qore client will be emitted via the `onError` callback supplied during initialization.

```typescript
const client = new QoreClient({..config, onError: (error) => {
  switch (error.message) {
    case "Request failed with status code 500":
      modal.message("An error has occured");
      break;
    case "Request failed with status code 401":
      router.push("/login");
      break;
  }
})})

```
