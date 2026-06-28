import React from "react";
import Transcript from "@/components/Transcript";
import { theme } from "@/config/theme";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <img
          src={theme.logoUrl}
          alt={theme.clientName}
          className="app-logo"
        />
        <h1 className="app-title">{theme.clientName}</h1>
        <div className="rec-indicator">
          <span className="rec-dot"></span>
          <span className="rec-text">Recording / Grabando</span>
        </div>
      </header>
      <Transcript />
      <footer className="app-footer">
        Powered by: <a href="https://proxy4.ai" target="_blank" rel="noopener noreferrer">proxy4.ai</a>
      </footer>
    </div>
  );
};

export default App;