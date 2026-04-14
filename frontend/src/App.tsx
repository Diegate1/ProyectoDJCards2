import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardSetsPage } from './pages/DashboardSetsPage';
import { CardsPage } from './pages/CardsPage';
import { CardDetailPage } from './pages/CardDetailPage';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Aplicar modo noche al document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className="app-container">
        <nav className="app-navbar">
          <div className="navbar-content">
            <a href="/dashboard" className="navbar-brand">
              🎴 DJ Cards
            </a>
            <ul className="navbar-menu">
              <li>
                <a href="/dashboard">Sets</a>
              </li>
              <li>
                <a href="/dashboard/cards">Catálogo</a>
              </li>
            </ul>           
            <label className="toggle-switch" title={darkMode ? 'Modo Claro' : 'Modo Noche'}>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleToggleDarkMode}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/dashboard" element={<DashboardSetsPage />} />
            <Route path="/dashboard/cards" element={<CardsPage />} />
            <Route path="/dashboard/cards/:cardId" element={<CardDetailPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
