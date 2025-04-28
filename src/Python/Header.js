import React from 'react';
import { Code } from 'lucide-react';

function Header() {
  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center">
        <Code className="h-8 w-8 mr-2" />
        <h1 className="text-2xl font-bold">CodeMentor - Python</h1>
      </div>
    </header>
  );
}

export default Header;