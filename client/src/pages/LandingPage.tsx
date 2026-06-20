import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export default function LandingPage() {
  return (
    <div className="container hero-section fade-in">
      <div className="hero-card">
        <div className="hero-content">
          <span className="brand-badge">INTRODUCING CPK</span>
          <h1 style={{ fontSize: '3rem', marginBottom: '16px' }} className="glow-text">
            Smart Expense Splitter
          </h1>
          <p className="hero-subtitle">
            Simplify group debts, resolve trip expenses, and settle accounts with the minimum number of transactions. Secure and automatic.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignInButton mode="modal">
              <button className="btn btn-primary">Sign In to Dashboard</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-secondary">Create Account</button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </div>
  );
}
