import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [emails, setEmails] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      // Filter out empty emails
      const inviteEmails = emails.filter((email) => email.trim() !== "");

      const res = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          inviteEmails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create group");
      }

      onSuccess(data.id);
      onClose();
    } catch (err: any) {
      console.error("Create group error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window">
        <div className="modal-header">
          <h2>Create New Group</h2>
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
            <label className="form-label" htmlFor="group-name">
              Group / Trip Name
            </label>
            <input
              id="group-name"
              type="text"
              className="form-input"
              placeholder="e.g., Road Trip 2026, Summer Cabin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invite Members (Emails)</label>
            <div className="invite-emails-container">
              {emails.map((email, index) => (
                <div key={index} className="invite-email-row">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    disabled={loading}
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-email"
                      onClick={() => handleRemoveEmail(index)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: "12px", width: "100%", padding: "8px" }}
              onClick={handleAddEmail}
              disabled={loading}
            >
              + Add Participant
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
