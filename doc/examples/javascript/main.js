 import client from "./qoreContext.js";

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

 async function handleLoadMore() {
   const operation = client
     .view("allTasks")
     .readRows(
       { offset: 0, limit: 10, order: "desc" },
       { networkPolicy: "network-and-cache", pollInterval: 5000 }
     );

   operation.subscribe(({ data }) => {
     tasks = data.nodes;
   });

   await operation.fetchMore({ offset: tasks.length, limit: 10 });
   // new items are being pushed to allTasks
   render();
 }

 window.addEventListener("load", async function () {
   await getData();
   const operation = client
     .view("allTasks")
     .readRows(
       { offset: 0, limit: 10, order: "desc" },
       { networkPolicy: "cache-only", pollInterval: 5000 }
     );

   const subscription = operation.subscribe(({ data, error, stale }) => {
     if (data && !stale) {
       tasks = data.nodes;
       // subscription.unsubscribe();
     }
   });
   render();
 });
 async function render() {
   const template = document.querySelector("#tasks");
   const app = document.querySelector("#app");
   const loadMoreButton = document.querySelector("#loadMoreButton");

   loadMoreButton.addEventListener("click", handleLoadMore);

   removeLis();

   const clonedTemplate = template.content.cloneNode(true);
   for (let i = 0; i < tasks.length; i++) {
     const li = document.createElement("li");
     li.textContent = tasks[i].name;
     clonedTemplate.firstElementChild.appendChild(li);
   }
   app.appendChild(clonedTemplate);
 }

 function removeLis() {
   const lis = document.querySelectorAll("li");
   let li = null;
   for (let i = 0; (li = lis[i]); i += 1) {
     li.parentNode.removeChild(li);
   }
 }

 async function getTask(id) {
   const { data, error } = await client.view("allTasks").readRow(id).toPromise();
   console.log(data);
 }

 getTask("b82234fd-3b10-4831-b9d8-eef3275328a2");

 async function newTask(task) {
   const { data, error } = await client
     .view("allTasks")
     .readRows(
       { offset: 0, limit: 10, order: "desc" },
       { networkPolicy: "cache-only" }
     )
     .toPromise();

   const newRow = await client.view("allTasks").insertRow({ ...task });
   render();
 }
 async function updateTask(id, task) {
   const { data, error } = await client
     .view("allTasks")
     .readRows(
       { offset: 0, limit: 10, order: "desc" },
       { networkPolicy: "cache-only" }
     )
     .toPromise();

   await client.view("allTasks").updateRow(id, {
     ...task
   });
   render();
 }

 const newTaskButton = document.querySelector("#newTask");
 newTaskButton.addEventListener("click", newTask({ name: "New Task" }));
