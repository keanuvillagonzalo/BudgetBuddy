import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import Dashboard from '../pages/Dashboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="header">
          <h1 className="header-title">BudgetBuddy</h1>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="primary-btn" style={{ width: 'auto', padding: '8px 20px' }}>Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </header>

        <Routes>
          {/* Default route renders the Dashboard for signed-in users */}
          <Route path="/" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}