import { useEffect, useState, useCallback } from "react";
import { UserButton, useAuth } from "@clerk/clerk-react";
import AddExpenseModal from "../components/AddExpenseModal";

interface ExpenseData {
  _id: string;
  description: string;
  totalAmount: number;
  payerId: string;
  date: string;
  splitMethod: "equal" | "custom";
  isSettlement: boolean;
}

interface GroupData {
  id: string;
  name: string;
  members: string[];
  creatorId: string;
  expenses: ExpenseData[];
}

interface SettlementPlan {
  balances: { [memberId: string]: number };
  transactions: { from: string; to: string; amount: number }[];
  durationMs: number;
}

interface GroupDashboardProps {
  groupId: string;
}

export default function GroupDashboard({ groupId }: GroupDashboardProps) {
  const { getToken } = useAuth();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [settlement, setSettlement] = useState<SettlementPlan | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const cleanName = (memberId: string) => {
    if (memberId.startsWith("user_invite_")) {
      return memberId.replace("user_invite_email_", "").replace(/_/g, ".");
    }
    if (memberId === "user_mock_rushi") {
      return "Rushi (Admin)";
    }
    return memberId.substring(0, 15);
  };

  // Fetch all state - memoized so we can reuse for hard refetch (AD-5)
  const loadWorkspaceData = useCallback(async () => {
    try {
      const token = await getToken();
      
      // 1. Fetch group details and expenses list
      const groupRes = await fetch(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusCode(groupRes.status);
      const groupData = await groupRes.json();
      
      if (!groupRes.ok) {
        throw new Error(groupData.error || "Failed to load group");
      }

      // 2. Fetch balances and simplified debt transactions
      const balanceRes = await fetch(`http://localhost:5000/api/groups/${groupId}/balances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const balanceData = await balanceRes.json();

      setGroup(groupData);
      setSettlement(balanceData);
      setError("");
    } catch (err: any) {
      console.error("Workspace loading error:", err);
      setError(err.message || "Failed to retrieve group workspace");
    } finally {
      setLoading(false);
    }
  }, [groupId, getToken]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Handle bill deletion (FR-8)
  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/groups/${groupId}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete expense");
      }

      // Hard refetch state (AD-5)
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to delete expense");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle marking transaction as paid/settled (FR-12)
  const handleRecordSettlement = async (fromMemberId: string, toMemberId: string, amount: number) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/groups/${groupId}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromMemberId,
          toMemberId,
          amount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record settlement");
      }

      // Hard refetch state (AD-5)
      await loadWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to settle payment");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout" style={{ justifyContent: "center", alignItems: "center" }}>
        <h3 className="glow-text">Loading group workspace...</h3>
      </div>
    );
  }

  if (statusCode === 403) {
    return (
      <div className="dashboard-layout fade-in" style={{ justifyContent: "center", alignItems: "center", padding: "24px" }}>
        <div className="hero-card" style={{ maxWidth: "480px", border: "1px solid var(--color-accent)" }}>
          <div className="hero-content">
            <span className="brand-badge" style={{ backgroundColor: "rgba(244, 63, 94, 0.15)", borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
              ACCESS DENIED (403)
            </span>
            <h2 style={{ marginBottom: "16px" }}>Restricted Workspace</h2>
            <p className="hero-subtitle" style={{ marginBottom: "24px" }}>
              You do not have permission to view this group. Access is restricted to invited and authenticated members only.
            </p>
            <button className="btn btn-primary" onClick={() => (window.location.href = "/")}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group || !settlement) {
    return (
      <div className="dashboard-layout fade-in" style={{ justifyContent: "center", alignItems: "center", padding: "24px" }}>
        <div className="hero-card" style={{ maxWidth: "480px" }}>
          <div className="hero-content">
            <span className="brand-badge">ERROR</span>
            <h2 style={{ marginBottom: "16px" }}>Workspace Not Found</h2>
            <p className="hero-subtitle" style={{ marginBottom: "24px" }}>
              {error || "The group you are looking for does not exist or has been deleted."}
            </p>
            <button className="btn btn-secondary" onClick={() => (window.location.href = "/")}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout fade-in">
      <nav className="navbar">
        <div className="container navbar-container">
          <div className="logo glow-text" style={{ cursor: "pointer" }} onClick={() => (window.location.href = "/")}>
            <span>💸</span> cpk
          </div>
          <div className="nav-user">
            <button 
              className="btn btn-secondary" 
              style={{ padding: "8px 16px", fontSize: "0.85rem" }} 
              onClick={() => (window.location.href = "/")}
            >
              &larr; Back
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      <main className="dashboard-main container">
        <div className="welcome-banner">
          <div className="user-welcome">
            <span className="brand-badge">GROUP WORKSPACE</span>
            <h1 style={{ fontSize: "2.5rem" }}>{group.name}</h1>
            <p>Track payments, log expenses, and simplify balances.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setIsExpenseModalOpen(true)}
              disabled={actionLoading}
            >
              <span>+</span> Add Expense
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px", marginTop: "16px" }}>
          {/* Left Column: Members & Net Balances */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Members List */}
            <div className="stat-card">
              <div className="stat-label" style={{ marginBottom: "16px" }}>GROUP MEMBERS ({group.members.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {group.members.map((member, i) => {
                  const isCreator = member === group.creatorId;
                  const balance = settlement.balances[member] || 0;
                  const isOwed = balance > 0;
                  const absBalance = Math.abs(balance / 100).toFixed(2);
                  
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        display: "flex", 
                        flexDirection: "column",
                        gap: "6px",
                        padding: "10px 14px", 
                        background: "rgba(255, 255, 255, 0.02)", 
                        border: "1px solid var(--border-light)", 
                        borderRadius: "10px" 
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <span style={{ fontSize: "1.1rem" }}>👤</span>
                          <span style={{ fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-bright)", fontWeight: 600 }}>
                            {cleanName(member)}
                          </span>
                        </div>
                        {isCreator && (
                          <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(139, 92, 246, 0.15)", color: "#c084fc", padding: "1px 6px", borderRadius: "9999px", fontWeight: 600 }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 500, color: balance === 0 ? "var(--text-muted)" : isOwed ? "var(--color-secondary)" : "var(--color-accent)" }}>
                        {balance === 0 ? "Balanced" : isOwed ? `is owed $${absBalance}` : `owes $${absBalance}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Settlement plan & Expenses list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Settlement Plan */}
            <div className="stat-card">
              <div className="stat-label" style={{ marginBottom: "16px" }}>SIMPLIFIED SETTLEMENT PLAN (GREEDY ALGORITHM)</div>
              
              {settlement.transactions.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", minHeight: "60px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  <p>🎉 All group accounts are settled and balanced! No transfers needed.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {settlement.transactions.map((tx, idx) => {
                    const amountUSD = (tx.amount / 100).toFixed(2);
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "14px 18px", 
                          background: "rgba(139, 92, 246, 0.04)", 
                          border: "1px solid rgba(139, 92, 246, 0.15)", 
                          borderRadius: "12px" 
                        }}
                      >
                        <div style={{ fontSize: "0.95rem" }}>
                          <strong style={{ color: "var(--text-bright)" }}>{cleanName(tx.from)}</strong>
                          <span style={{ color: "var(--text-muted)" }}> pays </span>
                          <strong style={{ color: "var(--text-bright)" }}>{cleanName(tx.to)}</strong>
                          <span style={{ color: "var(--color-secondary)", fontWeight: 700 }}> ${amountUSD}</span>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: "6px 14px", fontSize: "0.78rem", borderRadius: "8px" }}
                          disabled={actionLoading}
                          onClick={() => handleRecordSettlement(tx.from, tx.to, tx.amount)}
                        >
                          Mark as Paid
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expenses list */}
            <div className="stat-card" style={{ flexGrow: 1 }}>
              <div className="stat-label" style={{ marginBottom: "20px" }}>EXPENSES LOG</div>
              
              {group.expenses.length === 0 ? (
                <div className="empty-state" style={{ border: "none", padding: "32px 16px" }}>
                  <div className="empty-state-icon">💸</div>
                  <h3>No Expenses Logged</h3>
                  <p>Click "Add Expense" to start splitting bills and tracking debts.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {group.expenses.map((exp) => {
                    const amountUSD = (exp.totalAmount / 100).toFixed(2);
                    const formattedDate = new Date(exp.date).toLocaleDateString();
                    
                    return (
                      <div 
                        key={exp._id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "16px", 
                          background: exp.isSettlement ? "rgba(6, 182, 212, 0.03)" : "rgba(255, 255, 255, 0.01)", 
                          border: exp.isSettlement ? "1px dashed rgba(6, 182, 212, 0.25)" : "1px solid var(--border-light)", 
                          borderRadius: "14px" 
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 600 }}>{exp.description}</h3>
                            {exp.isSettlement && (
                              <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(6, 182, 212, 0.15)", color: "var(--color-secondary)", padding: "1px 6px", borderRadius: "9999px", fontWeight: 600 }}>
                                Settlement
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            Paid by <strong style={{ color: "var(--text-main)" }}>{cleanName(exp.payerId)}</strong> on {formattedDate}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: exp.isSettlement ? "var(--color-secondary)" : "var(--text-bright)" }}>
                            ${amountUSD}
                          </span>
                          <button 
                            style={{ 
                              background: "transparent", 
                              border: "none", 
                              color: "var(--color-accent)", 
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              fontWeight: 500
                            }}
                            disabled={actionLoading}
                            onClick={() => handleDeleteExpense(exp._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        members={group.members}
        groupId={groupId}
        onSuccess={loadWorkspaceData}
      />
    </div>
  );
}
