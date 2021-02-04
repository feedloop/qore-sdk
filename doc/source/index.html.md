---
title: Qore Client SDK

language_tabs: # must be one of https://git.io/vQNgJ
  - jsx: React
  - javascript: JavaScript

toc_footers:
  - <a href='https://dashboard.qorebase.io' target='_blank'>Sign up to get started hacking with Qore</a>

search: true

code_clipboard: true
---

# Introduction

Welcome to Qore Client SDK documentation page, this document will guide you to start hacking with Qore. As of now, Qore Client SDK is only accessible in JavaScript Environment, we will add more soon.

## Prerequisites

1. Node.js 12+.
1. `npx` and `npm` executable.
1. Qore account, signup [here](https://dashboard.qorebase.io) & don't forget to verify your account.

## Features

### Document caching

Each read operation is cached by default, any _similar_ read request will share the same data. With qore client you might not need an additional state management.

### TypeScript Support

Qore cli can generate the schema of your project in TypeScript, meaning that you'll know what to insert and what to read from your qore client.

# Getting Started

## Install Qore CLI

Install @feedloop/qore-cli globally via npm or yarn.

> Installing via npm

```shell
npm install --global @feedloop/qore-cli
```

> Installing via yarn

```shell
yarn global add @feedloop/qore-cli
```

You can also run qore-cli via `npx` if you prefer not to pollute your global path.

```shell
npx @feedloop/qore-cli --help

# example: login to qore via npx
npx @feedloop/qore-cli login
```

## Authenticate yourself

You will be asked to input your email & password. Choose your default project afterwards.

```shell
npx @feedloop/qore-cli login
```

## Setup

```shell
npx @feedloop/qore-cli create-project --template https://github.com/feedloop/qore-next-template.git <your-new-project-name>
```

If you start a new project, this is the recommended way to setup a qore project.

This command will create a new project for you, including a starter-kit project selected (in this case, [feedloop/qore-next-template](https://github.com/feedloop/qore-next-template.git)) on your current working directory. This starter project includes common SDK initialization that should get you started.

Once created, navigate to your project from your terminal to install the dependencies using `$ npm install`.
Hit `$ npx next dev` to start running your project locally.

Open this url from your browser and you should see your email being printed [http://localhost:3000](http://localhost:3000). Browse the template code to see how it is done.

![](/images/localhost-3000.png)

Now you are ready to:

1. [Reading data](#reading-data)
2. [Writing data](#writing-data)
3. [Authenticating your user](#authenticating-your-user)

## Setup manually

If you prefer to setup qore manually to an existing project, please follow this guide all the way through.

**1)** Create a new qore project from your [qore dashboard](https://dashboard.qorebase.io).

<p>
<iframe src="https://drive.google.com/file/d/1PJLqDiwEXjo0tmVuHKqAyk1rxHZudeo6/preview" width="100%" height="320"></iframe>
</p>

**2)** Create a new directory for your project.

```shell
mkdir my-new-project
cd ./my-new-project
```

**3)** Initialize `package.json` file on your root project directory by triggering `npm init -y`, followed by installing required dependencies.

```shell
npm install --save @feedloop/qore-client
```

```shell
npm install --save-dev @feedloop/qore-cli
```

> React users: install @feedloop/qore-react to your project.

```shell
npm install --save @feedloop/qore-react
```

**4)** Set your newly-created project as the current project.

```shell
npx qore set-project
```

**5)** On your root project directory, run the codegen command to generate required config files. [See codegen](#codegen)

```shell
npx qore codegen
```

**6)** Initialize qore client by creating the following file.

```javascript
// Create a new file called client.js that contains the following lines

import { QoreClient } from "@feedloop/qore-client";
import config from "./qore.config.json";
import schema from "./qore.schema.json";

const client = new QoreClient(config);
client.init(schema);

export default client;
```

```jsx
// Create a new file called qoreContext.js that contains the following lines

import { QoreClient } from "@feedloop/qore-client";
import createQoreContext from "@feedloop/qore-react";
import config from "./qore.config.json";
import schema from "./qore.schema.json";

const client = new QoreClient(config);
client.init(schema);

const qoreContext = createQoreContext(client);
export default qoreContext;
```

```jsx
// Add qore context provider to your root component.

const Root = () => {
  return (
    <qoreContext.context.Provider
      value={{
        client: qoreContext.client
      }}
    >
      <YourApp />
    </qoreContext.context.Provider>
  );
};
```

With this file created, you are ready to:

1. [Reading data](#reading-data)
2. [Writing data](#writing-data)
3. [Authenticating your user](#authenticating-your-user)

## TypeScript support

The [codegen](#codegen) command will also generate type definitions based on your project schema, exported as `ProjectSchema` interface from `"@feedloop/qore-client"`. All you need to do is feeding this interface to the `QoreClient` class initialization.

```typescript
import { QoreClient, ProjectSchema } from "@feedloop/qore-client";
import config from "./qore.config.json";
import schema from "./qore-schema.json";

const client = new QoreClient<ProjectSchema>(config);
client.init(schema as any);
```

## Codegen

> Generate configuration files

```shell
qore codegen
```

To ensure that you will have your configuration files on your root project, run this command when:

1. **The following files doesn't exist** on your root project directory.
2. **Everytime there are changes** on your project structure (includes views, fields, tables and forms).

| File name          | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `qore.schema.json` | Contains the schema required to run qore client.         |
| `qore.config.json` | Contains the config required to connect to your project. |
| `qore-env.d.ts`    | TypeScript type definitions of your project schema.      |

# Reading data

Once initialized, your project views will be accessible via the client instance. You can start reading the data of your view.

```javascript
const { data, error } = await client
  .view("allTasks")
  .readRows({ offset: 10, limit: 10, order: "desc" })
  .toPromise();
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { data: allTasks, status } = qoreContext.view("allTasks").useListRow({
    offset: 10,
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
```

`data` will contain rows of your `allTasks` view. In case an error occured, `data` can be null and `error` should contain the cause of error.

You can also specify `offset`, `limit` and `order` when performing a read view operation.

## Reading individual row

```javascript
const { data, error } = await client
  .view("allTasks")
  .readRow("some-task-id")
  .toPromise();
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { data: someTask, status, error } = qoreContext
    .view("allTasks")
    .useGetRow("some-task-id");
  return (
    <ul>
      {allTasks.map(task => (
        <li>{task.name}</li>
      ))}
    </ul>
  );
};
```

Oftentimes we want to get the detail of a specific row by the ID. Assuming the id is _some-task-id_, you can fetch it this way:

`data` will contain either a single row or null if an error has occured, `error` object will tell you the cause.

## Caching data

```javascript
const { data, error } = await client
  .view("allTasks")
  .readRows(
    { offset: 10, limit: 10, order: "desc" },
    { networkPolicy: "cache-only" }
  )
  .toPromise();
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { data: allTasks, status, error } = qoreContext
    .view("allTasks")
    .useListRow(
      {
        offset: 10,
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

A qore client has an internal storage that acts as a cache that is turned on by default to minimize http request.

By setting the `networkPolicy` option to `cache-only`, you are telling qore client to only get the data from the cache instead of getting it from the server.

`networkPolicy` option accepts the following values:

| Value             | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| cache-only        | Read data only from the cache                                      |
| network-only      | Read data only from the network                                    |
| network-and-cache | Read data from the cache first, then a network request will follow |

Reading data from `network-and-cache` may require you to subscribe to the read operation because there will be a follow up result from the network after the operation hits the cache.

<aside class="notice">
You don't need to subscribe to anything if you use the React Hooks as it does this for you internally.
</aside>

```javascript
const operation = client
  .view("allTasks")
  .readRows(
    { offset: 10, limit: 10, order: "desc" },
    { networkPolicy: "network-and-cache" }
  );

const subscription = operation.subscribe(({ data, error, stale }) => {
  if (data && !stale) {
    doSomething(data);
    subscription.unsubscribe();
  }
});
```

`stale` will be `true` when it hits the cache, `false` when it hits the network. Indicating that the data might be obsolete due to a follow up network request.

## Revalidating data

```javascript
const operation = client
  .view("allTasks")
  .readRows(
    { offset: 10, limit: 10, order: "desc" },
    { networkPolicy: "network-and-cache" }
  );

const subscription = operation.subscribe(({ data, error, stale }) => {
  doSomething(data);
});

operation.revalidate();
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { data: allTasks, revalidate } = qoreContext.view("allTasks").useListRow(
    {
      offset: 10,
      limit: 10,
      order: "asc",
    },
    { networkPolicy: "network-and-cache" }
  );
  return (
    <>
    <button onClick={revalidate}>refresh</button>
    <ul>
      {allTasks.map((task) => (
        <li>{task.name}</li>
      ))}
    </ul>
    <>
  );
};
```

Oftentimes you want to get the most up-to-date state of your data from the network.

By calling `revalidate()`, you are asking qore client to send a `network-only` mode to your operation, giving you the most recent state of the data. Think of it as a reload button of your browser tab.

## Polling interval

```javascript
const operation = client
  .view("allTasks")
  .readRows(
    { offset: 10, limit: 10, order: "desc" },
    { networkPolicy: "network-and-cache", pollInterval: 5000 }
  );

const subscription = operation.subscribe(({ data, error, stale }) => {
  doSomething(data);
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { data: allTasks, revalidate } = qoreContext.view("allTasks").useListRow(
    {
      offset: 10,
      limit: 10,
      order: "asc",
    },
    { networkPolicy: "network-and-cache", pollInterval: 5000 }
  );
  return (
    <>
    <button onClick={revalidate}>refresh</button>
    <ul>
      {allTasks.map((task) => (
        <li>{task.name}</li>
      ))}
    </ul>
    <>
  );
};
```

Instead of calling `operation.revalidate()` periodically, you can ask qore client to send request periodically by specifying a polling interval option in milisecond.

This operation will be refreshed every 5 seconds, a nice near-realtime effect to your users.

# Writing data

Similar to reading data, writing data is accessible from each view object.

## Insert a new row

```javascript
const newRow = await client.view("allTasks").insertRow({ ...data });
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { insertRow, status } = qoreContext.view("allTasks").useInsertRow();
  return (
    <button
      onClick={async () => {
        await insertRow({ ...data });
      }}
    >
      insert
    </button>
  );
};
```

Insert a data to `allTasks` view.

`data` must be compliant to the schema of the view, excluding the `id` field.

## Update a row

```javascript
await client.view("allTasks").updateRow("some-task-id", {
  ...data
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { updateRow, status } = qoreContext.view("allTasks").useUpdateRow();
  return (
    <button
      onClick={async () => {
        await updateRow("some-task-id", { ...data });
      }}
    >
      update
    </button>
  );
};
```

Update a data of `allTasks` view with an id of _some-task-id_.

`data` must be compliant to the schema of the view, excluding the `id` field.

## Add & remove relationships

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

Both `addRelation` and `removeRelation` accept the `id` of the target row, followed by an object with the key being the relation name and the value is an array of reference id of the relationship.

In this example we are adding `member.id` to the relationship of a specific row on the `allTasks` view and then removing it.

## Update a row

```javascript
await client.view("allTasks").updateRow("some-task-id", {
  ...data
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { updateRow, status } = qoreContext.view("allTasks").useUpdateRow();
  return (
    <button
      onClick={async () => {
        await updateRow("some-task-id", { ...data });
      }}
    >
      update
    </button>
  );
};
```

Update a data of `allTasks` view with an id of _some-task-id_.

`data` must be compliant to the schema of the view, excluding the `id` field.

## Upload a file

```javascript
const files = await client.view("allTasks").upload(event.target.files);
await client.view("allTasks").updateRow("some-task-id", {
  ...data
  avatar: files
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { updateRow, status } = qoreContext.view("allTasks").useUpdateRow();
  const handleUpload = async event => {
    const files = await client.upload(event.target.files);
    await updateRow("some-task-id", { ...data, avatar: files });
  };
  return <input type="file" onChange={handleUpload} />;
};
```

Adding files to a row requires you to upload the file first. The file type of the uploaded files must match with the field target, unwanted file types will be ignored.

## Delete a row

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

Remove a data of `allTasks` view with an id of _some-task-id_.

## Trigger actions

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

Each qore row can have one or more action triggers, an action trigger may require parameters.

## Send form inputs

```javascript
await client.view("allTasks").forms.newTaskForm.send({
  someParams: "someValue"
});
```

```jsx
import qoreContext from "./qoreContext";

const Component = () => {
  const { forms, status } = qoreContext.view("allTasks").useForms();
  return (
    <button
      onClick={async () => {
        await forms.newTaskForm.send({
          someParams: "someValue"
        });
      }}
    >
      Add new task
    </button>
  );
};
```

Each qore view has one or more forms, sending forms may require parameters.

# Authenticating your user

```typescript

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

As you can register new users to qore, you might need to log them in to your application.

# Error handling

```typescript
const client = new QoreClient({..config, onError: (error) => {
  switch(error.code) {
    case 500:
      modal.message("An error has occured");
      break;
    case 401:
      router.push("/login");
      break;
  }
})})

```

Any error that occurs along the lifetime of a qore client will be emitted via the `onError` callback supplied during initialization.
