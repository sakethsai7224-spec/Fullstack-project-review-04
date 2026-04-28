import { useState, useEffect } from "react";
import RealImageResize from "./Real Image Resize";

function Recipient({ updateDatabase, database }) {
  const [name, setName] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemImage, setItemImage] = useState("");

  const userEmail = localStorage.getItem("userEmail") || "";
  const currentUserName = localStorage.getItem("currentUser") || "";

  useEffect(() => {
    if (currentUserName && !name) {
      setName(currentUserName);
    }
  }, [currentUserName, name]);

  const generateId = () => {
    return "REQ-" + Math.floor(100000 + Math.random() * 900000);
  };

  const handleRequest = async () => {
    if (!name || !item || !quantity) {
      alert("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    const serialId = generateId();

    try {
      await updateDatabase(serialId, {
        type: "Request",
        name: name,
        item: item,
        quantity: quantity,
        itemImage: itemImage,
        status: "Requested",
        timestamp: new Date().toISOString(),
      });

      alert(`Request submitted successfully! ✅\nYour Track ID: ${serialId}`);

      // Clear form
      setItem("");
      setQuantity("");
      setItemImage("");
    } catch {
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const myRequests = Object.entries(database || {})
    .filter(([, data]) => data.type === "Request" && data.userEmail === userEmail)
    .map(([id, data]) => ({ id, ...data }));

  const donationsToMe = Object.entries(database || {})
    .filter(([, data]) => data.type === "Donation" && data.recipientName === name && name !== "")
    .map(([id, data]) => ({ id, ...data }));

  return (
    <div className="recipient-container" style={{ 
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
          background: "linear-gradient(135deg, #ff4757 0%, #646cff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Need Assistance?
        </h2>
        <p style={{ opacity: 0.8, fontSize: "1.1rem" }}>Post your requirements and let the community help you.</p>
      </div>

      <div className="responsive-grid">
        
        {/* Request Form Card */}
        <div className="card" style={{ 
          background: "#ffffff", 
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          border: "none",
          padding: "30px",
          width: "auto",
          color: "#333"
        }}>
          <h3 style={{ margin: "0 0 25px 0", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "10px", color: "#1e3c72" }}>
            <span>📝</span> Create a Request
          </h3>

          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>Your Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>What do you need?</label>
              <input
                type="text"
                placeholder="e.g., Food packets, Blankets, Water"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "5px", display: "block", color: "#666" }}>Quantity</label>
              <input
                type="number"
                placeholder="How many?"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ background: "#f8f9fa", border: "1px solid #ddd", color: "#333", margin: 0 }}
              />
            </div>

            <RealImageResize 
              onImageResized={setItemImage} 
              previewImage={itemImage} 
              label="Item Photo (Optional)"
              maxWidth={600}
              maxHeight={600}
            />

            <button 
              onClick={handleRequest} 
              disabled={isSubmitting}
              style={{ 
                marginTop: "10px", 
                background: "linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)",
                height: "50px",
                fontSize: "1.1rem",
                boxShadow: "0 10px 20px rgba(255, 71, 87, 0.2)",
                color: "#fff",
                fontWeight: "bold"
              }}
            >
              {isSubmitting ? "Submitting..." : "Post My Request 🚀"}
            </button>
          </div>
        </div>

        {/* My Requests Column */}
        <div style={{ maxHeight: "600px", overflowY: "auto", paddingRight: "10px" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", position: "sticky", top: 0, padding: "10px 0", zIndex: 5, color: "#fff" }}>
            📋 Your Active Requests
          </h3>
          <div style={{ display: "grid", gap: "15px" }}>
            {myRequests.length > 0 ? (
              myRequests.map(req => (
                <div key={req.id} style={{
                  background: "#ffffff",
                  padding: "15px",
                  borderRadius: "12px",
                  borderLeft: "4px solid #ff4757",
                  color: "#333",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  position: "relative"
                }}>
                  <div style={{ 
                    position: "absolute", 
                    top: "15px", 
                    right: "15px", 
                    fontSize: "0.7rem", 
                    color: "#ff4757", 
                    fontWeight: "bold",
                    padding: "3px 8px",
                    background: "rgba(255, 71, 87, 0.1)",
                    borderRadius: "10px"
                  }}>
                    {req.status}
                  </div>
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "1.1rem", color: "#1e3c72" }}>{req.item}</h4>
                  
                  {req.itemImage && (
                    <div style={{ margin: "10px 0", borderRadius: "8px", overflow: "hidden", maxHeight: "100px" }}>
                      <img src={req.itemImage} alt={req.item} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <p style={{ margin: "0", fontSize: "0.9rem", color: "#666" }}>
                    📧 <strong>Your Email:</strong> {userEmail}
                  </p>
                  <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", opacity: 0.8 }}>
                    Quantity: <strong>{req.quantity}</strong>
                  </p>
                  <p style={{ marginTop: "10px", fontSize: "0.75rem", opacity: 0.4 }}>ID: {req.id}</p>
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

      {/* Donations For Me Section */}
      {donationsToMe.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h3 style={{ margin: "0 0 25px 0", fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
            <span>🙌</span> Support En Route
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {donationsToMe.map(don => (
              <div key={don.id} style={{ 
                background: "#f0fff4", 
                padding: "20px", 
                borderRadius: "16px", 
                borderLeft: "5px solid #2ed573",
                boxShadow: "0 10px 25px rgba(46, 213, 115, 0.1)",
                color: "#333"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ margin: "0 0 8px 0", color: "#17a05e", fontSize: "1.2rem" }}>{don.item}</h4>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#444" }}>
                      Count: <strong>{don.quantity}</strong>
                    </p>
                    <div style={{ marginTop: "12px", padding: "10px", background: "rgba(46, 213, 115, 0.1)", borderRadius: "8px" }}>
                      <p style={{ margin: "0", fontSize: "0.85rem", fontWeight: "bold", color: "#17a05e" }}>Donor Details:</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.9rem" }}>👩‍💼 Name: <strong>{don.name}</strong></p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem" }}>📧 Email: <span style={{ color: "#1e3c72" }}>{don.donorEmail || "N/A"}</span></p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem" }}>📞 Phone: <span style={{ color: "#1e3c72" }}>{don.donorPhone || "N/A"}</span></p>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "0.7rem", 
                    color: "#2ed573", 
                    fontWeight: "bold",
                    background: "rgba(46, 213, 115, 0.1)",
                    padding: "4px 10px",
                    borderRadius: "10px"
                  }}>
                    {don.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Impact Wall (Shared) */}
      <div style={{ marginTop: "60px" }}>
        <h3 style={{ margin: "0 0 25px 0", fontSize: "1.6rem", display: "flex", alignItems: "center", gap: "12px", color: "#fff" }}>
          <span>🌈</span> Community Kindness Wall
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {Object.entries(database || {})
            .filter(([, data]) => data.type === "Donation")
            .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
            .map(([id, data]) => (
              <div key={id} style={{ 
                background: "#ffffff", 
                padding: "15px", 
                borderRadius: "12px", 
                color: "#333",
                boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
                border: "1px solid #eee"
              }}>
                <div style={{ fontWeight: "bold", color: "#646cff", marginBottom: "5px", fontSize: "1rem" }}>
                  🎁 {data.item} ({data.quantity})
                </div>
                <div style={{ opacity: 0.8, fontSize: "0.85rem", marginTop: "10px" }}>
                  <strong>Donor Information:</strong>
                  <div style={{ marginTop: "4px" }}>👤 {data.name}</div>
                  <div style={{ marginTop: "2px" }}>📧 {data.donorEmail || "Relief Community"}</div>
                  <div style={{ marginTop: "2px" }}>📞 {data.donorPhone || "Contact Office"}</div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.7rem", opacity: 0.5, borderTop: "1px solid #eee", paddingTop: "8px" }}>
                  Status: <span style={{ color: "#646cff", fontWeight: "bold" }}>{data.status}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Recipient;
