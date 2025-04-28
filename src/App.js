import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import PythonComplier from "./Python/PythonComplier";

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PythonComplier />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
