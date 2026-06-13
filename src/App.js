import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Calculadora from './pages/Calculadora';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/calculadora" element={<Calculadora />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;