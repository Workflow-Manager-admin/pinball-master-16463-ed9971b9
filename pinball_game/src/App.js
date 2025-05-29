import React from 'react';
import './App.css';
import PinballMaster from './PinballMaster';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app" style={{ background: "#1a1a2e" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> Pinball Master
            </div>
            <a
              href="https://github.com"
              className="btn"
              style={{ background: "#e94560", color: "#fff", textDecoration: 'none' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source Code
            </a>
          </div>
        </div>
      </nav>
      <main>
        <PinballMaster />
      </main>
    </div>
  );
}

export default App;