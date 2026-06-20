import { useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import CreateGroupModal from "../components/CreateGroupModal";

export default function Dashboard() {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (groupId: string) => {
    window.location.href = `/groups/${groupId}`;
  };

  return (
    <div className="dashboard-layout fade-in">
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="logo glow-text">
            <span>💸</span> cpk
          </div>
          <div className="nav-user">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {user?.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="dashboard-main container">
        <div className="welcome-banner">
          <div className="user-welcome">
            <h1>Welcome back, {user?.firstName || 'User'}!</h1>
            <p>Here is an overview of your active expense groups.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Create Group
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">TOTAL NET BALANCE</div>
            <div className="stat-value" style={{ color: 'var(--text-bright)' }}>$0.00</div>
            <div className="stat-desc">All accounts balanced</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">YOU ARE OWED</div>
            <div className="stat-value" style={{ color: 'var(--color-secondary)' }}>$0.00</div>
            <div className="stat-desc">From 0 groups</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">YOU OWE</div>
            <div className="stat-value" style={{ color: 'var(--color-accent)' }}>$0.00</div>
            <div className="stat-desc">To 0 groups</div>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-state-icon">✈️</div>
          <h3>No Active Groups</h3>
          <p>You aren't a member of any expense group yet. Create one or get invited by email to start splitting bills.</p>
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>Create a Group</button>
        </div>
      </main>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
