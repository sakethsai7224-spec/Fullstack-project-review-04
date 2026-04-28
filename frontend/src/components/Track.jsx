import { useState } from "react";

function Track({ database }) {
  const [serialId, setSerialId] = useState("");
  const [result, setResult] = useState(null);

  const handleTrack = () => {
    if (!serialId) {
      alert("Please enter a valid Serial ID");
      return;
    }

    if (database && database[serialId]) {
      setResult({ id: serialId, ...database[serialId] });
    } else {
      setResult("not-found");
    }
  };

  const statuses = ["Pending", "Verified", "In Transit", "Out for Delivery", "Delivered", "Completed"];
  const currentStatusIndex = result && result !== "not-found" ? statuses.indexOf(result.status) : -1;

  return (
    <div className="track-container" style={{ 
      maxWidth: "800px", 
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
          background: "linear-gradient(135deg, #646cff 0%, #1e3c72 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Track Your Impact
        </h2>
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>Stay updated on the progress of your contribution.</p>
      </div>

      {/* Tracker Search Card */}
      <div className="card" style={{ 
        background: "#ffffff", 
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        border: "none",
        padding: "40px",
        width: "auto",
        color: "#333",
        textAlign: "center"
      }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Enter your Serial ID (e.g., DON-123456)"
            value={serialId}
            onChange={(e) => setSerialId(e.target.value)}
            style={{ 
              flex: 1, 
              background: "#f8f9fa", 
              border: "2px solid #eee", 
              padding: "15px", 
              fontSize: "1.1rem", 
              borderRadius: "12px", 
              margin: 0,
              transition: "border-color 0.3s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "#646cff"}
            onBlur={(e) => e.target.style.borderColor = "#eee"}
          />
          <button 
            onClick={handleTrack}
            style={{ 
              width: "120px", 
              background: "#1e3c72", 
              fontSize: "1.1rem", 
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(30, 60, 114, 0.3)" 
            }}
          >
            Track 🔍
          </button>
        </div>

        {result && result !== "not-found" && (
          <div style={{ marginTop: "40px", animation: "fadeIn 0.5s ease" }}>
            <div style={{ 
              background: "#f8f9fa", 
              padding: "20px", 
              borderRadius: "15px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "30px",
              border: "1px solid #eee"
            }}>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "bold", textTransform: "uppercase" }}>Tracking ID</span>
                <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#1e3c72" }}>{result.id}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "#666", fontWeight: "bold", textTransform: "uppercase" }}>Current Status</span>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2ed573" }}>● {result.status}</div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ position: "relative", padding: "20px 0 40px" }}>
              <div style={{ height: "4px", background: "#eee", width: "100%", position: "absolute", top: "40px", left: 0 }}></div>
              <div style={{ 
                height: "4px", 
                background: "#646cff", 
                width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%`, 
                position: "absolute", 
                top: "40px", 
                left: 0,
                transition: "width 0.8s ease-out"
              }}></div>
              
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                {statuses.map((s, idx) => (
                  <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "16%" }}>
                    <div style={{ 
                      width: "14px", 
                      height: "14px", 
                      borderRadius: "50%", 
                      background: idx <= currentStatusIndex ? "#646cff" : "#fff", 
                      border: "3px solid #646cff",
                      boxShadow: idx <= currentStatusIndex ? "0 0 10px rgba(100, 108, 255, 0.5)" : "none",
                      transition: "all 0.3s ease"
                    }}></div>
                    <span style={{ 
                      fontSize: "0.65rem", 
                      fontWeight: "bold", 
                      color: idx <= currentStatusIndex ? "#1e3c72" : "#999",
                      textAlign: "center"
                    }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", textAlign: "left", marginTop: "20px" }}>
              <div style={{ background: "#fff", padding: "15px", borderRadius: "10px", border: "1px solid #f0f0f0" }}>
                <label style={{ fontSize: "0.75rem", opacity: 0.6 }}>Recipient/Target</label>
                <div style={{ fontWeight: "bold" }}>{result.recipientName || "General Community"}</div>
              </div>
              <div style={{ background: "#fff", padding: "15px", borderRadius: "10px", border: "1px solid #f0f0f0" }}>
                <label style={{ fontSize: "0.75rem", opacity: 0.6 }}>Item & Quantity</label>
                <div style={{ fontWeight: "bold" }}>{result.item} ({result.quantity})</div>
              </div>
              <div style={{ background: "#fff", padding: "15px", borderRadius: "10px", border: "1px solid #f0f0f0", gridColumn: "span 2" }}>
                <label style={{ fontSize: "0.75rem", opacity: 0.6 }}>Contact Email</label>
                <div style={{ fontWeight: "bold", color: "#646cff" }}>{result.donorEmail || result.userEmail || "N/A"}</div>
              </div>
            </div>
          </div>
        )}

        {result === "not-found" && (
          <div style={{ marginTop: "30px", padding: "20px", background: "#fff5f5", borderRadius: "12px", border: "1px solid #fecaca" }}>
            <p style={{ margin: 0, color: "#ef4444", fontWeight: "bold" }}>
              ❌ Serial ID not found. Please double-check the ID or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Track;