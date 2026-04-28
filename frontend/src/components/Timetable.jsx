function Timetable() {
  const schedule = [
    { day: "Monday", time: "09:00 AM - 06:00 PM", task: "General Collection & Sorting", status: "Active" },
    { day: "Tuesday", time: "09:00 AM - 08:00 PM", task: "Medical Supplies Distribution", status: "Active" },
    { day: "Wednesday", time: "10:00 AM - 05:00 PM", task: "Clothing Drive & Verification", status: "Active" },
    { day: "Thursday", time: "09:00 AM - 06:00 PM", task: "Food Preservation & Delivery", status: "Active" },
    { day: "Friday", time: "08:00 AM - 09:00 PM", task: "Bulk Donation Processing", status: "Active" },
    { day: "Saturday", time: "11:00 AM - 04:00 PM", task: "Special Volunteer Drive", status: "Limited" },
    { day: "Sunday", time: "24/7 Support", task: "Emergency Response Only", status: "Emergency" }
  ];

  return (
    <div className="timetable-container" style={{ 
      maxWidth: "900px", 
      margin: "0 auto", 
      color: "#fff",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "800", 
          marginBottom: "10px",
          background: "linear-gradient(135deg, #1e3c72 0%, #646cff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Operations Schedule
        </h2>
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>Stay informed about our daily relief activities.</p>
      </div>

      <div className="card" style={{ 
        background: "#ffffff", 
        boxShadow: "0 20px 45px rgba(0,0,0,0.3)",
        border: "none",
        padding: "40px",
        width: "auto",
        color: "#333",
        borderRadius: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #f0f0f0", paddingBottom: "15px" }}>
          <span style={{ fontSize: "1.8rem" }}>📅</span>
          <h3 style={{ margin: 0, fontSize: "1.5rem", color: "#1e3c72" }}>Relief Ops Timetable</h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#666", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                <th style={{ padding: "10px 20px" }}>Day</th>
                <th style={{ padding: "10px 20px" }}>Active Hours</th>
                <th style={{ padding: "10px 20px" }}>Primary Activity</th>
                <th style={{ padding: "10px 20px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, index) => (
                <tr key={item.day} style={{ 
                  background: index % 2 === 0 ? "#f8f9fa" : "#ffffff",
                  borderRadius: "10px",
                  transition: "transform 0.2s ease"
                }}>
                  <td style={{ padding: "15px 20px", fontWeight: "700", color: "#1e3c72", borderRadius: "10px 0 0 10px" }}>
                    {item.day}
                  </td>
                  <td style={{ padding: "15px 20px", fontSize: "0.9rem", color: "#555" }}>
                    {item.time}
                  </td>
                  <td style={{ padding: "15px 20px", fontWeight: "500" }}>
                    {item.task}
                  </td>
                  <td style={{ padding: "15px 20px", borderRadius: "0 10px 10px 0" }}>
                    <span style={{ 
                      padding: "4px 12px", 
                      fontSize: "0.75rem", 
                      fontWeight: "bold",
                      borderRadius: "20px",
                      background: item.status === "Active" ? "#e6fffa" : (item.status === "Limited" ? "#fff9db" : "#fff5f5"),
                      color: item.status === "Active" ? "#047857" : (item.status === "Limited" ? "#f08c00" : "#c53030")
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ 
          marginTop: "40px", 
          padding: "20px", 
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", 
          borderRadius: "15px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          boxShadow: "0 10px 20px rgba(30,60,114,0.2)"
        }}>
          <span style={{ fontSize: "2rem" }}>🎉</span>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>
            <strong style={{ display: "block", marginBottom: "3px" }}>Festival & Emergency Season Note:</strong>
            Our donation and response services operate <strong>24/7</strong> during critical times and festivals to ensure no one is left behind.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Timetable;

