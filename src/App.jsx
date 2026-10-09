import { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import './App.css';
import Navbar from './components/Navbar';
import principalImg from './assets/principal.jpg';
import anthemAudio from './assets/anthem.mp3';



export default function App() {
  
  

  const [notices, setNotices] = useState([]);
  useEffect(() => {
    client.fetch('*[_type == "notice"] | order(publishedAt desc)')
    .then((data) => {
      setNotices(data); // Labuna notices tika state ekata save karanawa
    })
    .catch((error) => {
      console.error("Data fetch error: ", error);
    });
  }, []);
  const [principal, setPrincipal] = useState(null);
  useEffect(() => {
  // Principal details fetch karana GROQ query eka
    client.fetch('*[_type == "principal"][0]')
    .then((data) => setPrincipal(data))
    .catch((err) => console.error("Principal fetch error:", err));
  }, []);

  const [events, setEvents] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  useEffect(() => {
  // Principal & notices fetch karapu effect ekatama meka add karanna:
    client.fetch('*[_type == "event"] | order(date desc)')
    .then((data) => setEvents(data))
    .catch((err) => console.error("Events fetch error:", err));
  }, []);
  
  const [hero, setHero] = useState(null);

  useEffect(() => {
    client.fetch('*[_type == "hero"][0]')
      .then((data) => setHero(data))
      .catch((err) => console.error("Hero fetch error:", err));
  }, []);

  const [contact, setContact] = useState(null);

  useEffect(() => {
    client.fetch('*[_type == "contact"][0]')
      .then((data) => setContact(data))
      .catch((err) => console.error("Contact fetch error:", err));
  }, []);
  const [about, setAbout] = useState(null);

  useEffect(() => {
    client.fetch('*[_type == "about"][0]')
      .then((data) => setAbout(data))
      .catch((err) => console.error("About fetch error:", err));
  }, []);

  const [anthem, setAnthem] = useState(null);
  const [showFullLyrics, setShowFullLyrics] = useState(false);

  useEffect(() => {
    // Anthem Fetch Query (Audio URL එකත් එක්කම ගන්නවා)
    client
      .fetch(`*[_type == "anthem"][0]{
        title,
        lyrics,
        "audioUrl": audioFile.asset->url
      }`)
      .then((data) => setAnthem(data))
      .catch((err) => console.error("Anthem fetch error:", err));
  }, []);

  

  return (
    <div>
      {/* 1. Header / Navbar Component */}
      <Navbar />

      
{/* 2. Dynamic Hero Section */}
<section 
  id="home" 
  className="hero"
  style={
    hero?.bannerImage 
      ? { backgroundImage: `url(${urlFor(hero.bannerImage).width(1920).url()})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {}
  }
>
  <div className="hero-overlay"></div>
  <div className="hero-content">
    <h2>{hero?.title || "දැනුමෙන් සපිරි හෙට දවසක් උදෙසා"}</h2>
    <p className="motto">{hero?.motto || "විද්‍යා දදාති විනයං"}</p>
    <a href="#about" className="btn">
      {hero?.buttonText || "තවත් විස්තර"}
    </a>
  </div>
</section>

      {/* 3. About Section */}
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">
            {about?.title || "පාසල පිළිබඳ කෙටියෙන්"}
          </h2>
          <div className="about-grid">
            <div className="about-text">
              <p>
                {about?.description ||
                  "අප පාසල දශක ගණනාවක අභිමානවත් ඉතිහාසයකට උරුමකම් කියන, ගුණගරුක හා දක්ෂ දරු පරපුරක් දැයට දායාද කරන ප්‍රමුඛ පෙළේ පාසලකි."}
              </p>
              <div className="vision-mission">
                <div className="card">
                  <h3>අපගේ දැක්ම (Vision)</h3>
                  <p>
                    {about?.vision ||
                      "දැනුමෙන් හා යහපත් ආකල්පවලින් පිරිපුන් විශිෂ්ටතම ශ්‍රී ලාංකීය පුරවැසියෙකු බිහිකිරීම."}
                  </p>
                </div>
                <div className="card">
                  <h3>අපගේ මෙහෙවර (Mission)</h3>
                  <p>
                    {about?.mission ||
                      "ගුණාත්මක අධ්‍යාපනයක් හා සමබර පෞරුෂ සංවර්ධනයක් තුළින් ගෝලීය අභියෝග ජයගත හැකි නිපුණතා සපිරි දරු පරපුරක් නිර්මාණය කිරීම."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 4. Principal's Message */}
<section id="principal" className="section bg-light">
  <div className="container principal-container">
    <div className="principal-img-box">
      <img 
        src={principal?.photo ? urlFor(principal.photo).width(500).url() : principalImg} 
        alt={principal?.name || "Principal"} 
        className="principal-img" 
      />
    </div>
    <div className="principal-text">
      <h2 className="section-title text-left">විදුහල්පතිතුමාගේ පණිවිඩය</h2>
      <p style={{ whiteSpace: 'pre-line' }}>
        {principal?.message || "පණිවිඩය පැටවෙමින් පවතී..."}
      </p>
      <div className="principal-name">
        <h4>{principal?.name || "විදුහල්පතිතුමා"}</h4>
        <span>{principal?.title || "විදුහල්පති, තක්ෂිලා මහා විද්‍යාලය-හොරණ"}</span>
      </div>
    </div>
  </div>
</section>
    {/* School Anthem Section */}
<section id="anthem" className="section anthem-section">
  <div className="container">
    <h2 className="section-title">{anthem?.title || "පාසල් ගීතය"}</h2>
    <div className="anthem-card">
      
      {anthem?.audioUrl && (
        <div className="anthem-audio-box">
          <p>🎧 පාසල් ගීතයට සවන් දෙන්න</p>
          <audio controls src={anthem.audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <div className="anthem-lyrics">
        <div className={`lyrics-wrapper ${showFullLyrics ? "expanded" : "collapsed"}`}>
          <p style={{ whiteSpace: "pre-line" }}>
            {anthem?.lyrics || "පාසල් ගීතයේ පද පේළි මෙතැන දිස්වේ..."}
          </p>
        </div>

        {/* See More / See Less Toggle Button */}
        <button 
          className="see-more-btn"
          onClick={() => setShowFullLyrics(!showFullLyrics)}
        >
          {showFullLyrics ? "අඩු කරන්න ▲" : "තව කියවන්න (See More) ▼"}
        </button>
      </div>

    </div>
  </div>
</section>

{/* School Events Section with Lightbox / Image Preview */}
<section id="events" className="section">
  <div className="container">
    <h2 className="section-title text-center" style={{ marginBottom: '30px' }}>පාසල් ඉසව් සහ පුවත්</h2>
    
    <div 
      className="events-grid" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
        gap: '30px' 
      }}
    >
      {events.map((event) => (
        <div 
          key={event._id} 
          style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #eee'
          }}
        >
          {/* Main Cover Image - Fully responsive, no awkward cropping */}
          {event.coverImage && (
            <div 
              style={{ background: '#f8f9fa', cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setSelectedImage(urlFor(event.coverImage).url())}
            >
              <img 
                src={urlFor(event.coverImage).width(900).url()} 
                alt={event.title} 
                style={{ 
                  width: '100%', 
                  maxHeight: '380px', 
                  objectFit: 'contain', 
                  display: 'block',
                  margin: '0 auto'
                }} 
              />
            </div>
          )}

          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.88rem', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅 {event.date}</span>
              {event.location && <span>| 📍 {event.location}</span>}
            </div>

            <h3 style={{ fontSize: '1.35rem', margin: '10px 0', color: '#1a1a1a', fontWeight: 'bold' }}>
              {event.title}
            </h3>

            {event.description && (
              <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: '1.6', marginBottom: '18px' }}>
                {event.description}
              </p>
            )}

            {/* Additional Photo Gallery - Loku thumbnails & Click to View */}
            {event.gallery && event.gallery.length > 0 && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                  📸 තවත් පින්තූර ({event.gallery.length}) - බැලීමට click කරන්න:
                </span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {event.gallery.map((photo, index) => (
                    <img 
                      key={index}
                      src={urlFor(photo).width(250).height(200).url()} 
                      alt={`Gallery ${index}`} 
                      onClick={() => setSelectedImage(urlFor(photo).url())}
                      style={{ 
                        width: '95px', 
                        height: '70px', 
                        objectFit: 'cover', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'transform 0.2s, border-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.borderColor = '#0066cc';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Modal / Popup for Full-Size Image Preview */}
  {selectedImage && (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
      onClick={() => setSelectedImage(null)}
    >
      <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
        <button 
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '32px',
            cursor: 'pointer'
          }}
        >
          &times;
        </button>
        <img 
          src={selectedImage} 
          alt="Full Preview" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '85vh', 
            borderRadius: '8px', 
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'block'
          }} 
        />
      </div>
    </div>
  )}
</section>
      {/* 5. Dynamic Notices Section */}
<section id="notices" className="section">
  <div className="container">
    <h2 className="section-title">නවතම පුවත් සහ නිවේදන</h2>
    <div className="notices-grid">
      {notices.map((item) => (
        <div className="notice-card" key={item._id}>
          <span className="badge">{item.badge || 'සාමාන්‍ය'}</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>

     {/* 6. Footer */}
      <footer id="contact">
        <div className="container footer-content">
          <div className="footer-col">
            <h3>{contact?.schoolName || "තක්ෂිලා මහා විද්‍යාලය-හොරණ"}</h3>
            <p>{contact?.shortDescription || "දැනුමෙන් සපිරි ගුණගරුක දරු පරපුරක් දැයට දායාද කරන තක්ෂිලාව."}</p>
          </div>
          <div className="footer-col">
            <h3>ඉක්මන් සබැඳි</h3>
            <ul>
              <li><a href="#home">මුල් පිටුව</a></li>
              <li><a href="#about">පාසල ගැන</a></li>
              <li><a href="#notices">නිවේදන</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>සම්බන්ධ වීමට</h3>
            <p>📍 ලිපිනය: {contact?.address || "තක්ෂිලා මහා විද්‍යාලය, හොරණ"}</p>
            <p>
              📞 දුරකථන:{" "}
              {contact?.phone ? (
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              ) : (
                "034-XXXXXXX"
              )}
            </p>
            <p>
              ✉️ Email:{" "}
              {contact?.email ? (
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              ) : (
                "info@taxilamv.lk"
              )}
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 {contact?.schoolName || "තක්ෂිලා මහා විද්‍යාලය-හොරණ"}. All Rights Reserved. | Developed with MoE & TRCSL Volunteer Program</p>
        </div>
      </footer>
    </div>
  );
}