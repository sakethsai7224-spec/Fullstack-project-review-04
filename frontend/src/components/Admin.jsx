function Admin({ database }) {
  const entries = Object.entries(database || {});
  
  // Calculate Stats
  const totalDonations = entries.filter(([, data]) => data.type === "Donation").length;
  const totalRequests = entries.filter(([, data]) => data.type === "Request").length;
  const pendingItems = entries.filter(([, data]) => data.status === "Pending" || data.status === "Requested").length;
  const completedItems = entries.filter(([, data]) => data.status === "Delivered" || data.status === "Completed").length;

  const stats = [
    { label: "Total Donations", count: totalDonations, icon: "🎁", color: "#646cff" },
    { label: "Active Requests", count: totalRequests, icon: "📝", color: "#ff4757" },
    { label: "Pending Logistics", count: pendingItems, icon: "⏳", color: "#ffa502" },
    { label: "Completed Impact", count: completedItems, icon: "✅", color: "#2ed573" }
  ];

  return (
    <div className="admin-container" style={{ 
      maxWidth: "1100px", 
      margin: "0 auto", 
      color: "#fff",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "800", 
          color: "#fff", 
          margin: 0,
          background: "linear-gradient(135deg, #fff 0%, #646cff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          System Command Center
        </h2>
        <p style={{ opacity: 0.7 }}>Real-time overview of the relief network.</p>
      </div>

      {/* Stats Matrix (Side by Side Cards) */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
        gap: "20px", 
        marginBottom: "40px" 
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="card" style={{ 
            background: "#ffffff", 
            padding: "25px", 
            borderRadius: "20px", 
            textAlign: 'center',
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            color: '#333',
            borderBottom: `5px solid ${stat.color}`,
            width: "auto"
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{stat.icon}</div>
            <div style={{ fontSize: "0.9rem", color: "#666", fontWeight: "600", textTransform: "uppercase" }}>{stat.label}</div>
            <div style={{ fontSize: "2.5rem", fontWeight: "900", color: stat.color, marginTop: "5px" }}>{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Main Activity Card */}
      <div className="card" style={{ 
        background: "#ffffff", 
        padding: "30px", 
        borderRadius: "20px", 
        boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
        color: '#333',
        width: "auto"
      }}>
        <h3 style={{ margin: "0 0 25px 0", fontSize: "1.4rem", color: "#1e3c72", borderBottom: "2px solid #f0f0f0", paddingBottom: "10px" }}>
          📡 Network Activity Log
        </h3>
        
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", opacity: 0.5 }}>
            <p>Scanning network... No data packets detected yet.</p>
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}>
            {entries.reverse().map(([id, data]) => (
              <div key={id} style={{ 
                background: "#f8f9fa", 
                padding: "15px", 
                borderRadius: "12px", 
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #eee"
              }}>
                <div>
                  <div style={{ fontWeight: "700", color: data.type === "Donation" ? "#646cff" : "#ff4757" }}>
                    {data.type === "Donation" ? "🎁 DONATION" : "📝 REQUEST"} - {data.item} ({data.quantity})
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>
                    By: <strong>{data.name}</strong> ({data.donorEmail || data.userEmail || "N/A"}) • ID: {id}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ 
                    padding: "4px 12px", 
                    fontSize: "0.75rem", 
                    fontWeight: "bold",
                    borderRadius: "20px",
                    background: data.status === "Delivered" || data.status === "Completed" ? "#e6fffa" : "#fff5f5",
                    color: data.status === "Delivered" || data.status === "Completed" ? "#047857" : "#c53030"
                  }}>
                    {data.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
