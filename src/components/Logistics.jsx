import { useState } from "react";

function Logistics({ database, updateDatabase }) {
  const [serialId, setSerialId] = useState("");
  const [status, setStatus] = useState("Pending");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!serialId) {
      alert("Please enter a valid Serial ID");
      return;
    }

    if (!database[serialId]) {
      alert("Serial ID not found in our records");
      return;
    }

    setIsUpdating(true);
    try {
      await updateDatabase(serialId, {
        ...database[serialId],
        status: status,
      });

      // TRIGGER RECEIPT EMAIL IF DELIVERED OR COMPLETED
      if (status === "Delivered" || status === "Completed") {
        try {
          const rec = database[serialId];
          await fetch("/api/notify-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientEmail: rec.recipientEmail || rec.userEmail || "",
              donorEmail: rec.donorEmail || "",
              item: rec.item,
              quantity: rec.quantity,
              serialId: serialId
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send receipt:", emailErr);
        }
      }

      alert(`Status for ${serialId} updated to ${status}!`);
      setSerialId("");
    } catch (error) {
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const allRecords = Object.entries(database || {}).map(([id, data]) => ({ id, ...data }));

  return (
    <div className="logistics-container" style={{ 
      maxWidth: "1000px", 
      margin: "0 auto", 
      color: "#fff",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "800", 
          marginBottom: "10px",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Logistics Control
        </h2>
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>Manage deliveries and update real-time status.</p>
      </div>

      <div className="responsive-grid">
        
        {/* Update Form Card */}
        <div className="card" style={{ 
          background: "#ffffff", 
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          border: "none",
          padding: "30px",
          width: "auto",
          color: "#333",
          position: "sticky",
          top: "20px"
        }}>
          <h3 style={{ margin: "0 0 25px 0", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "10px", color: "#1e3c72" }}>
            <span>🚚</span> Update Status
          </h3>

          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>Record ID (Serial ID)</label>
              <input
                type="text"
                placeholder="e.g., DON-123456"
                value={serialId}
                onChange={(e) => setSerialId(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>New Delivery Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              >
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              style={{ 
                marginTop: "10px", 
                background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                height: "50px",
                fontSize: "1.1rem",
                boxShadow: "0 10px 20px rgba(30, 60, 114, 0.2)",
                color: "#fff",
                fontWeight: "bold"
              }}
            >
              {isUpdating ? "Processing..." : "Update Logistics ✨"}
            </button>
          </div>
        </div>

        {/* Inventory / Record List */}
        <div className="card" style={{ 
          background: "#ffffff", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          border: "none",
          padding: "25px",
          width: "auto",
          color: "#333",
          minHeight: "500px"
        }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "#1e3c72", borderBottom: "2px solid #f0f0f0", paddingBottom: "10px" }}>
            📋 Record Directory
          </h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#f8f9fa" }}>
                  <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Serial ID</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Type</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Item</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Email</th>
                  <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allRecords.length > 0 ? (
                  allRecords.sort((a,b) => b.id.localeCompare(a.id)).map(rec => (
                    <tr key={rec.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#1e3c72" }}>{rec.id}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          padding: "2px 8px", 
                          background: rec.type === "Donation" ? "#eef2ff" : "#fff5f5",
                          color: rec.type === "Donation" ? "#646cff" : "#ff4757",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "bold"
                        }}>
                          {rec.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>{rec.item}</td>
                      <td style={{ padding: "12px", color: "#666", fontSize: "0.8rem" }}>{rec.donorEmail || rec.userEmail || "N/A"}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ 
                          color: rec.status === "Delivered" || rec.status === "Completed" ? "#2ed573" : "#ffa502",
                          fontWeight: "bold"
                        }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: "40px", textAlign: "center", opacity: 0.5 }}>No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logistics;