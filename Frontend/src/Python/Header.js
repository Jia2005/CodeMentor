import Logo from './../Images/logo.png'

function Header() {
  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center">
        <img src={Logo} alt="CodeMentor Logo" className="h-8 mr-3" />
        <h1 className="text-2xl font-bold">CodeMentor - Python</h1>
      </div>
    </header>
  );
}

export default Header;