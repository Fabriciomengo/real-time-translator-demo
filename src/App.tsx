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
      </header>
      <Transcript />
    </div>
  );
};

export default App;