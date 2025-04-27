import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import CodeLearningPlatform from "./Python_complier/Ide";

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CodeLearningPlatform />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
