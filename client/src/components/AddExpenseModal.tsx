import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: string[];
  groupId: string;
  onSuccess: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, members, groupId, onSuccess }: AddExpenseModalProps) {
  const { getToken } = useAuth();
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal");
  const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (members.length > 0) {
      setPayerId(members[0]);
      // Pre-populate custom split inputs
      const initialSplits: { [memberId: string]: string } = {};
      members.forEach((m) => {
        initialSplits[m] = "";
      });
      setCustomSplits(initialSplits);
    }
  }, [members, isOpen]);

  if (!isOpen) return null;

  const handleCustomSplitChange = (memberId: string, val: string) => {
    setCustomSplits({
      ...customSplits,
      [memberId]: val,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    const parsedAmount = parseFloat(amountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    const totalCents = Math.round(parsedAmount * 100);
    let splitsPayload: { memberId: string; amount: number }[] = [];

    if (splitMethod === "custom") {
      let sumCents = 0;
      for (const memberId of members) {
        const splitVal = parseFloat(customSplits[memberId] || "0");
        if (isNaN(splitVal) || splitVal < 0) {
          setError(`Invalid split amount for member ${memberId}`);
          return;
        }
        const splitCents = Math.round(splitVal * 100);
        sumCents += splitCents;
        splitsPayload.push({ memberId, amount: splitCents });
      }

      if (sumCents !== totalCents) {
        const diffStr = ((totalCents - sumCents) / 100).toFixed(2);
        setError(`Sum of splits must equal total amount. Difference: $${diffStr}`);
        return;
      }
    }

    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:5000/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: description.trim(),
          totalAmount: totalCents,
          payerId,
          splitMethod,
          splits: splitMethod === "custom" ? splitsPayload : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add expense");
      }

      // Reset form
      setDescription("");
      setAmountStr("");
      setSplitMethod("equal");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Add expense error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" style={{ maxWidth: "550px" }}>
        <div className="modal-header">
          <h2>Log Shared Expense</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--color-accent)", marginBottom: "16px", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="expense-desc">
              Description / Title
            </label>
            <input
              id="expense-desc"
              type="text"
              className="form-input"
              placeholder="e.g., Gas, Groceries, Dinner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="expense-amount">
                Total Amount ($)
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-payer">
                Paid By (Payer)
              </label>
              <select
                id="expense-payer"
                className="form-input"
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                disabled={loading}
              >
                {members.map((m) => {
                  const name = m.startsWith("user_invite_")
                    ? m.replace("user_invite_email_", "").replace(/_/g, ".")
                    : m;
                  return (
                    <option key={m} value={m}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Split Method</label>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="splitMethod"
                  value="equal"
                  checked={splitMethod === "equal"}
                  onChange={() => setSplitMethod("equal")}
                  disabled={loading}
                />
                Split Equally
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="splitMethod"
                  value="custom"
                  checked={splitMethod === "custom"}
                  onChange={() => setSplitMethod("custom")}
                  disabled={loading}
                />
                Custom Shares
              </label>
            </div>
          </div>

          {splitMethod === "custom" && (
            <div className="form-group">
              <label className="form-label">Customize Member Shares ($)</label>
              <div 
                className="invite-emails-container" 
                style={{ 
                  maxHeight: "180px", 
                  border: "1px solid var(--border-light)", 
                  padding: "12px", 
                  borderRadius: "10px",
                  background: "rgba(0,0,0,0.1)"
                }}
              >
                {members.map((m) => {
                  const name = m.startsWith("user_invite_")
                    ? m.replace("user_invite_email_", "").replace(/_/g, ".")
                    : m;
                  return (
                    <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexGrow: 1 }}>
                        {name}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        style={{ width: "120px" }}
                        className="form-input"
                        placeholder="0.00"
                        value={customSplits[m] || ""}
                        onChange={(e) => handleCustomSplitChange(m, e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Log Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
