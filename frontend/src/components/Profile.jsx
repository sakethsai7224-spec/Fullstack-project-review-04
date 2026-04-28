import { useState, useEffect } from 'react';
import RealImageResize from './Real Image Resize';
import { apiUrl } from '../api';

const Profile = () => {
  const [formData, setFormData] = useState({
    name: '', age: '', job: '', phone: '', location: '', purpose: '', rating: '', about: '', email: '', profileImage: ''
  });
  const [msg, setMsg] = useState('');
  const [user, setUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const PASSPORT_WIDTH = 413;
  const PASSPORT_HEIGHT = 531;

  useEffect(() => {
    const savedUserData = localStorage.getItem("userData");
    if (savedUserData) {
      const parsedUser = JSON.parse(savedUserData);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        age: parsedUser.age || '',
        job: parsedUser.job || '',
        phone: parsedUser.phone || '',
        location: parsedUser.location || '',
        purpose: parsedUser.purpose || '',
        rating: parsedUser.rating || '',
        about: parsedUser.about || '',
        profileImage: parsedUser.profileImage || ''
      });
      if (parsedUser.profileImage) {
        setImagePreview(parsedUser.profileImage);
      }
    }
  }, []);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onImageResized = (resizedBase64) => {
    setImagePreview(resizedBase64);
    setFormData(prev => ({ ...prev, profileImage: resizedBase64 }));
    setMsg('✅ Photo updated! Save to persist.');
    setTimeout(() => setMsg(''), 3000);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMsg('✨ Profile Updated Successfully!');
        localStorage.setItem("userData", JSON.stringify(data.user));
        localStorage.setItem("currentUser", data.user.name);
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(data.error || 'Failed to update.');
      }
    } catch {
      setMsg('Error connecting to server.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '100px', color: '#fff' }}>Verifying Authentication...</div>;

  return (
    <div className="profile-container" style={{ 
      maxWidth: "900px", 
      margin: "0 auto", 
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
          color: '#fff', 
          margin: 0,
          background: "linear-gradient(135deg, #fff 0%, #646cff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Personal Workspace
        </h2>
        <p style={{ color: '#fff', opacity: 0.7 }}>Manage your identity and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        
        {/* Left Side: Photo & Quick Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ 
            background: "#ffffff", 
            padding: "30px", 
            borderRadius: "20px", 
            textAlign: 'center',
            boxShadow: "0 15px 35px rgba(0,0,0,0.2)"
          }}>
            <div style={{ 
              position: 'relative', 
              width: '160px', 
              height: '160px', 
              margin: '0 auto 20px',
              borderRadius: '50%',
              padding: '5px',
              background: 'linear-gradient(135deg, #1e3c72 0%, #646cff 100%)'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                background: '#eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {imagePreview ? (
                  <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                ) : (
                  <span style={{ fontSize: '3rem' }}>👤</span>
                )}
              </div>
            </div>
            
            <RealImageResize 
              onImageResized={onImageResized}
              previewImage={imagePreview}
              label="Update Photo"
              maxWidth={413}
              maxHeight={531}
            />
            
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#1e3c72' }}>{formData.name || 'Anonymous'}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', opacity: 0.8 }}>{formData.email}</p>
            
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Trust Rating</span>
                <span style={{ fontWeight: 'bold', color: '#646cff' }}>{"⭐".repeat(parseInt(formData.rating) || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Form */}
        <form onSubmit={onSubmit} className="card" style={{ 
          background: "#ffffff", 
          padding: "40px", 
          borderRadius: "20px", 
          boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
          color: '#333'
        }}>
          {msg && (
            <div style={{ 
              padding: '12px', 
              background: msg.includes('✨') ? '#e6fffa' : '#fff5f5', 
              color: msg.includes('✨') ? '#047857' : '#c53030',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {msg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1e3c72', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
                📍 Basic Information
              </h4>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Full Name</label>
              <input name="name" value={formData.name} onChange={onChange} style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Age</label>
              <input name="age" value={formData.age} onChange={onChange} style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Occupation</label>
              <input name="job" value={formData.job} onChange={onChange} style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Phone</label>
              <input name="phone" value={formData.phone} onChange={onChange} style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1e3c72', borderBottom: '2px solid #f0f0f0', paddingBottom: '8px' }}>
                🌍 Mission & Bio
              </h4>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Location</label>
              <input name="location" value={formData.location} onChange={onChange} style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Purpose of Donation</label>
              <input name="purpose" value={formData.purpose} onChange={onChange} style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px' }} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>About Yourself</label>
              <textarea name="about" value={formData.about} onChange={onChange} rows="3" style={{ background: '#f8f9fa', border: '1px solid #ddd', marginTop: '5px', width: '100%', borderRadius: '8px' }} />
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '30px' }}>
              <button 
                type="submit" 
                disabled={isSaving}
                style={{ 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
                  color: '#fff', 
                  height: '50px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 10px 20px rgba(30,60,114,0.3)'
                }}
              >
                {isSaving ? "Synchronizing..." : "Save Profile Details ✨"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
