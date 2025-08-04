import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import PythonCompiler from "./Python/PythonCompiler";

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PythonCompiler />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
