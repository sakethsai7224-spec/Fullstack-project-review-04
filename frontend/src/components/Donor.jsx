import { useState, useEffect } from "react";
import { apiUrl } from "../api";

function Donor({ updateDatabase, database }) {
  const [name, setName] = useState("");
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [recipient, setRecipient] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userEmail = localStorage.getItem("userEmail") || "";
  const currentUserName = localStorage.getItem("currentUser") || "";

  useEffect(() => {
    if (currentUserName && !name) {
      setName(currentUserName);
    }
  }, [currentUserName, name]);

  const generateId = () => "DON-" + Math.floor(100000 + Math.random() * 900000);

  // Filter requests from the database
  const requests = database 
    ? Object.entries(database)
        .filter(([, data]) => data.type === "Request" && data.status !== "Completed")
        .map(([id, data]) => ({ id, ...data }))
    : [];

  const submitDonation = async () => {
    if (!name || !item || !qty) {
      alert("Please fill all required fields (Name, Item, and Quantity)");
      return;
    }

    setIsSubmitting(true);
    const id = generateId();

    const donorEmail = localStorage.getItem("userEmail") || "";
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const donorPhone = userData.phone || "Not Provided";

    try {
      await updateDatabase(id, {
        type: "Donation",
        name,
        donorEmail: donorEmail,
        donorPhone: donorPhone,
        item,
        quantity: qty,
        status: "Pending Verification",
        recipientName: recipient || "General Donation",
        recipientEmail: recipientEmail || "",
        timestamp: new Date().toISOString(),
      });

      alert(`Thank you for your kindness! ❤️\nDonation Serial ID: ${id}`);
      
      // Reset form
      setItem("");
      setQty("");
      setRecipient("");
      setRecipientEmail("");
    } catch {
      alert("Failed to record donation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFulfill = async (req) => {
    // Availability check logic
    const similarDonations = Object.values(database || {}).filter(
      d => d.type === "Donation" && d.item.toLowerCase() === req.item.toLowerCase()
    );

    const totalInTransit = similarDonations.reduce((sum, d) => sum + (parseInt(d.quantity) || 0), 0);

    let availabilityMsg = "";
    if (totalInTransit === 0) {
      availabilityMsg = `✨ This is a high-priority need! No active donations of ${req.item} are currently in the relief network. Your support would be the first!`;
    } else if (totalInTransit < parseInt(req.quantity)) {
      availabilityMsg = `🚚 Progress Update: ${totalInTransit} units of ${req.item} are already on the way for this need, but ${parseInt(req.quantity) - totalInTransit} more are still required.`;
    } else {
      availabilityMsg = `✅ Notice: There are already ${totalInTransit} units of ${req.item} donated for this category. However, additional support is always welcome for future needs!`;
    }

    alert(`🔍 Availability Check for ${req.item}:\n\n${availabilityMsg}\n\n📢 We are also sending an instant notification to ${req.name} to let them know support is coming!`);

    // 🔥 Send Email Notification to Recipient
    try {
      await fetch(apiUrl("/api/notify-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: req.userEmail,
          donorName: name || "A kind donor",
          itemName: req.item,
          quantity: req.quantity
        }),
      });
      console.log("✅ Recipient notified successfully.");
    } catch (error) {
      console.error("❌ Failed to notify recipient:", error);
    }

    setRecipient(req.name);
    setRecipientEmail(req.userEmail || "");
    setItem(req.item);
    setQty(req.quantity);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="donor-container" style={{ 
      maxWidth: "1000px", 
      margin: "0 auto", 
      color: "#fff",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "800", 
          marginBottom: "10px",
          background: "linear-gradient(135deg, #646cff 0%, #ff4757 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Today is your day
        </h2>
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>Your small contribution can change someone's life.</p>
      </div>

      <div className="responsive-grid">
        
        {/* Donation Form Card */}
        <div className="card" style={{ 
          background: "#ffffff", 
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          border: "none",
          padding: "30px",
          width: "auto",
          color: "#333"
        }}>
          <h3 style={{ margin: "0 0 25px 0", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "10px", color: "#1e3c72" }}>
            <span>💝</span> Make a Donation
          </h3>

          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>Your Name</label>
              <input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>What are you donating?</label>
              <input
                placeholder="e.g., Rice, Clothes, Medicines"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>Quantity</label>
              <input
                type="number"
                placeholder="Number of units"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>Assign to Special Request (Optional)</label>
              <select 
                value={recipient} 
                onChange={(e) => setRecipient(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              >
                <option value="">-- Select a Recipient Name --</option>
                {requests.map(req => (
                  <option key={req.id} value={req.name}>
                    {req.name} (Needs {req.item})
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={submitDonation} 
              disabled={isSubmitting}
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
              {isSubmitting ? "Processing..." : "Submit Donation ✨"}
            </button>
          </div>
        </div>

        {/* Requests Side Column */}
        <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "10px" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", position: "sticky", top: 0, padding: "10px 0", zIndex: 5, color: "#fff" }}>
            🚨 Direct Requests
          </h3>
          <div style={{ display: "grid", gap: "15px" }}>
            {requests.length > 0 ? (
              requests.map(req => (
                <div key={req.id} className="request-card" style={{
                  background: "#ffffff",
                  padding: "15px",
                  borderRadius: "12px",
                  borderLeft: "4px solid #ff4757",
                  transition: "all 0.3s ease",
                  color: "#333",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "1rem", color: "#1e3c72" }}>{req.name}</strong>
                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(255,71,87,0.1)", color: "#ff4757", borderRadius: "10px", height: "fit-content", fontWeight: "bold" }}>URGENT</span>
                  </div>
                  <p style={{ margin: "0 0 5px 0", fontSize: "0.9rem", color: "#666" }}>
                    📧 <strong>Email:</strong> {req.userEmail || "Anonymous"}
                  </p>
                  
                  {req.itemImage && (
                    <div style={{ margin: "10px 0", borderRadius: "8px", overflow: "hidden", maxHeight: "100px" }}>
                      <img src={req.itemImage} alt={req.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", opacity: 0.8 }}>
                    Needs <span style={{ color: "#333", fontWeight: "bold" }}>{req.quantity} {req.item}</span>
                  </p>
                  <button 
                    onClick={() => handleFulfill(req)}
                    style={{
                      width: "auto",
                      padding: "5px 15px",
                      fontSize: "0.8rem",
                      background: "#f1f2f6",
                      border: "1px solid #ddd",
                      color: "#1e3c72",
                      fontWeight: "600"
                    }}
                  >
                    Order Item
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px", opacity: 0.5, color: "#fff" }}>
                <p>No active requests found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div style={{ marginTop: "60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "25px" }}>
          <h3 style={{ margin: 0, fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
            <span>🌍</span> Community Impact Wall
          </h3>
          <div style={{ fontSize: "0.9rem", color: "#646cff", fontWeight: "bold" }}>
            {Object.values(database || {}).filter(d => d.type === "Donation").length} Lives Impacted
          </div>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "20px" 
        }}>
          {Object.entries(database || {})
            .filter(([, data]) => data.type === "Donation")
            .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
            .map(([id, data]) => {
              const isMine = data.userEmail === userEmail;
              return (
                <div key={id} style={{
                  background: isMine ? "#eef2ff" : "#ffffff",
                  padding: "20px",
                  borderRadius: "16px",
                  border: isMine ? "1px solid #646cff" : "1px solid #eee",
                  position: "relative",
                  transition: "transform 0.3s ease",
                  color: "#333",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.05)"
                }}>
                  {isMine && (
                    <div style={{ 
                      position: "absolute", 
                      top: "15px", 
                      right: "15px", 
                      fontSize: "0.65rem", 
                      background: "#646cff", 
                      color: "#fff",
                      padding: "3px 8px", 
                      borderRadius: "20px",
                      fontWeight: "bold"
                    }}>
                      MY IMPACT
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "1.5rem" }}>🎁</div>
                    <div>
                      <h4 style={{ margin: "0 0 5px 0", fontSize: "1.1rem", color: "#1e3c72" }}>{data.item}</h4>
                      <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.7, color: "#666" }}>
                        By <strong>{isMine ? "You" : data.name}</strong> ({data.donorEmail || data.userEmail || "N/A"}) • Qty: {data.quantity}
                      </p>
                      <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", opacity: 0.5 }}>
                        To: {data.recipientName || "Community"}
                      </p>
                      <div style={{ 
                        marginTop: "12px", 
                        display: "inline-block", 
                        fontSize: "0.75rem", 
                        color: data.status === "Completed" ? "#2ed573" : "#ffa502",
                        padding: "4px 10px",
                        background: "#f8f9fa",
                        borderRadius: "6px",
                        fontWeight: "bold"
                      }}>
                        ● {data.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

    </div>
  );
}

export default Donor;
