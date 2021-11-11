import { Routes, Route } from "react-router-dom";

import Component from "./Component.js";
import Detail from "./Detail.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/detail/:id" element={<Detail />} />
    </Routes>
  );
}

function Main() {
  return (
    <>
      <header>
        <h1>Qore TODO</h1>
      </header>
      <Component />
    </>
  );
}

export default App;
