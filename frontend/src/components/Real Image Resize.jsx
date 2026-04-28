import { useState, useRef } from "react";

/**
 * RealImageResize Component
 * A reusable component for uploading and resizing images to specific dimensions.
 * Useful for profile photos (passport size) and item photos.
 */
const RealImageResize = ({ 
  onImageResized, 
  maxWidth = 800, 
  maxHeight = 800, 
  label = "Upload Image", 
  previewImage = null 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const resizeImage = (img) => {
    const canvas = document.createElement("canvas");
    let width = img.width;
    let height = img.height;

    // 🔥 Maintain aspect ratio correctly
    if (width > height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    
    // Draw with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0, width, height);

    // 🔥 Convert to compressed JPEG (0.7 quality is a good balance)
    return canvas.toDataURL("image/jpeg", 0.7);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("❌ Invalid file type. Please upload an image.");
      return;
    }

    setError(null);
    setIsResizing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const resizedBase64 = resizeImage(img);
          onImageResized(resizedBase64);
        } catch (err) {
          setError("❌ Error resizing image.");
          console.error(err);
        } finally {
          setIsResizing(false);
        }
      };
      img.onerror = () => {
        setError("❌ Failed to load image.");
        setIsResizing(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="image-resize-container" style={{ margin: "10px 0" }}>
      <label style={{ 
        display: "block", 
        fontSize: "0.85rem", 
        fontWeight: "bold", 
        color: "#666", 
        marginBottom: "8px" 
      }}>
        {label}
      </label>
      
      <div 
        onClick={() => fileInputRef.current.click()}
        style={{
          width: "100%",
          height: "150px",
          border: "2px dashed #ddd",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: "#f8f9fa",
          overflow: "hidden",
          transition: "all 0.3s ease",
          position: "relative"
        }}
        onMouseOver={(e) => e.currentTarget.style.borderColor = "#646cff"}
        onMouseOut={(e) => e.currentTarget.style.borderColor = "#ddd"}
      >
        {previewImage ? (
          <img 
            src={previewImage} 
            alt="Preview" 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain" 
            }} 
          />
        ) : (
          <div style={{ textAlign: "center", color: "#999" }}>
            <span style={{ fontSize: "2rem", marginBottom: "5px", display: "block" }}>📷</span>
            <span style={{ fontSize: "0.8rem" }}>{isResizing ? "Processing..." : "Select or Drop Image"}</span>
          </div>
        )}
        
        {isResizing && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: "#646cff"
          }}>
            Processing...
          </div>
        )}
      </div>

      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        style={{ display: "none" }}
      />
      
      {error && <p style={{ color: "#ff4757", fontSize: "0.75rem", marginTop: "5px" }}>{error}</p>}
    </div>
  );
};

export default RealImageResize;
