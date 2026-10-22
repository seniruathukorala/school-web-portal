import TeacherUploadPortal from './components/TeacherUploadPortal';
import { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import './App.css';
import Navbar from './components/Navbar';
import principalImg from './assets/principal.jpg';
import anthemAudio from './assets/anthem.mp3';
import ResultsChecker from './components/ResultsChecker';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  // 1. Navigation state: 'home', 'portal', ɔ 'teacher'
  const [currentView, setCurrentView] = useState('home');

  const [notices, setNotices] = useState([]);
  useEffect(() => {
    client.fetch('*[_type == "notice"] | order(publishedAt desc)')
      .then((data) => setNotices(data))
      .catch((error) => console.error("Data fetch error: ", error));
  }, []);

  const [principal, setPrincipal] = useState(null);
  useEffect(() => {
    client.fetch('*[_type == "principal"][0]')
      .then((data) => setPrincipal(data))
      .catch((err) => console.error("Principal fetch error:", err));
  }, []);

  const [events, setEvents] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  useEffect(() => {
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
    client
      .fetch(`*[_type == "anthem"][0]{
        title,
        lyrics,
        "audioUrl": audioFile.asset->url
      }`)
      .then((data) => setAnthem(data))
      .catch((err) => console.error("Anthem fetch error:", err));
  }, []);

  // 2. Student Portal view
  if (currentView === 'portal') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '30px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 15px auto' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            ← Back to School Website
          </button>
        </div>
        <ResultsChecker />
      </div>
    );
  }

  // 3. Teacher Upload Portal view
  if (currentView === 'teacher') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '30px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto 15px auto' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            ← Back to School Website
          </button>
        </div>
        <TeacherUploadPortal />
      </div>
    );
  }

  // 4. Normal School Homepage
  return (
    <div>
      {/* Navbar we gɛt links fɔ Student Portal & Teacher Portal */}
      <Navbar 
        onOpenPortal={() => setCurrentView('portal')} 
        onOpenTeacherPortal={() => setCurrentView('teacher')} 
      />

     

{/* Hero Section */}
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
    {/* 1. Main Title - Drops down with a smooth fade */}
    <motion.h2
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {hero?.title || "දැනුමෙන් සපිරි හෙට දවසක් උදෙසා"}
    </motion.h2>

    {/* 2. Motto - Fades in softly from bottom */}
    <motion.p 
      className="motto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
    >
      {hero?.motto || "විද්‍යා දදාති විනයං"}
    </motion.p>

    {/* 3. Button - Scales up smoothly with tap & hover micro-interactions */}
    <motion.a 
      href="#about" 
      className="btn"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.06, 
        boxShadow: "0 8px 24px rgba(2, 132, 199, 0.45)" 
      }}
      whileTap={{ scale: 0.95 }}
      style={{ display: 'inline-block' }}
    >
      {hero?.buttonText || "තවත් විස්තර"}
    </motion.a>
  </div>
</section>


{/* About Section */}
<section id="about" className="section">
  <div className="container">
    {/* 1. ප්‍රධාන මාතෘකාව (Section Title) - Scroll වෙද්දි උඩින් පහළට Fade-in වීම */}
    <motion.h2 
      className="section-title"
      initial={{ opacity: 0, y: -25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {about?.title || "පාසල පිළිබඳ කෙටියෙන්"}
    </motion.h2>

    <div className="about-grid">
      <div className="about-text">
        {/* 2. හැඳින්වීම් ඡේදය (Description) - සුමටව Fade-in වීම */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          {about?.description ||
            "අප පාසල දශක ගණනාවක අභිමානවත් ඉතිහාසයකට උරුමකම් කියන, ගුණගරුක හා දක්ෂ දරු පරපුරක් දැයට දායාද කරන ප්‍රමුඛ පෙළේ පාසලකි."}
        </motion.p>

        {/* 3. දැක්ම සහ මෙහෙවර (Vision & Mission Cards) */}
        <div className="vision-mission">
          {/* Vision Card - වම් පැත්තේ සිට Slide වෙමින් පැමිණීම & Hover Effect */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            whileHover={{ y: -6, boxShadow: "0 12px 25px rgba(0, 0, 0, 0.08)" }}
          >
            <h3>අපගේ දැක්ම (Vision)</h3>
            <p>
              {about?.vision ||
                "දැනුමෙන් හා යහපත් ආකල්පවලින් පිරිපුන් විශිෂ්ටතම ශ්‍රී ලාංකීය පුරවැසියෙකු බිහිකිරීම."}
            </p>
          </motion.div>

          {/* Mission Card - දකුණු පැත්තේ සිට Slide වෙමින් පැමිණීම & Hover Effect */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            whileHover={{ y: -6, boxShadow: "0 12px 25px rgba(0, 0, 0, 0.08)" }}
          >
            <h3>අපගේ මෙහෙවර (Mission)</h3>
            <p>
              {about?.mission ||
                "ගුණාත්මක අධ්‍යාපනයක් හා සමබර පෞරුෂ සංවර්ධනයක් තුළින් ගෝලීය අභියෝග ජයගත හැකි නිපුණතා සපිරි දරු පරපුරක් නිර්මාණය කිරීම."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
</section>

      

{/* Principal's Message */}
<section id="principal" className="section bg-light">
  <div className="container">
    <div className="principal-card">
      
      {/* 1. Principal Photo - Left Side Entrance with Subtle Hover Lift */}
      <motion.div 
        className="principal-img-box"
        initial={{ opacity: 0, x: -35 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.img 
          src={principal?.photo ? urlFor(principal.photo).width(500).url() : principalImg} 
          alt={principal?.name || "Principal"} 
          className="principal-img"
          whileHover={{ scale: 1.025 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* 2. Message Content Area - Right Side Slide-in */}
      <motion.div 
        className="principal-text"
        initial={{ opacity: 0, x: 35 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
      >
        <div className="principal-header">
          <h2 className="principal-title">විදුහල්පති පණිවිඩය</h2>
          {/* Animated Expanding Title Bar */}
          <motion.div 
            className="title-bar"
            initial={{ width: 0 }}
            whileInView={{ width: '50px' }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Message Paragraph */}
        <motion.p 
          className="principal-message" 
          style={{ whiteSpace: 'pre-line' }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          {principal?.message || "පණිවිඩය පැටවෙමින් පවතී..."}
        </motion.p>

        {/* Principal Name & Title */}
        <motion.div 
          className="principal-name"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
        >
          <h4>{principal?.name || "විදුහල්පතිතුමිය"}</h4>
          <span>{principal?.title || "විදුහල්පති, තක්ෂිලා මහා විද්‍යාලය-හොරණ"}</span>
        </motion.div>
      </motion.div>

    </div>
  </div>
</section>

     

{/* School Anthem Section */}
<section id="anthem" className="section anthem-section">
  <div className="container">
    {/* 1. Title Fade-down with Scroll Trigger */}
    <motion.h2 
      className="section-title"
      initial={{ opacity: 0, y: -20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {anthem?.title || "පාසල් ගීතය"}
    </motion.h2>

    {/* 2. Main Anthem Card - Smooth pop-in */}
    <motion.div 
      className="anthem-card"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Audio Player Box */}
      {anthem?.audioUrl && (
        <motion.div 
          className="anthem-audio-box"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p>🎧 පාසල් ගීතයට සවන් දෙන්න</p>
          <audio controls src={anthem.audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </motion.div>
      )}

      {/* Lyrics Area with Smooth Animated Height Transition */}
      <div className="anthem-lyrics">
        <motion.div 
          className={`lyrics-wrapper ${showFullLyrics ? "expanded" : "collapsed"}`}
          animate={{ height: showFullLyrics ? "auto" : "120px" }}
          transition={{ duration: 0.45, ease: [0.04, 0.62, 0.23, 0.98] }}
          style={{ overflow: "hidden" }}
        >
          <p style={{ whiteSpace: "pre-line" }}>
            {anthem?.lyrics || "පාසල් ගීතයේ පද පේළි මෙතැන දිස්වේ..."}
          </p>
        </motion.div>

        {/* 3. Interactive See More Button */}
        <motion.button 
          className="see-more-btn"
          onClick={() => setShowFullLyrics(!showFullLyrics)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {showFullLyrics ? "අඩු කරන්න ▲" : "තව කියවන්න (See More) ▼"}
        </motion.button>
      </div>
    </motion.div>
  </div>
</section>

      {/* Events Section */}
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
                              cursor: 'pointer' 
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
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', display: 'block' }} 
              />
            </div>
          </div>
        )}
      </section>

      {/* Notices Section */}
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

      {/* Footer */}
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
              <li><a href="#portal" onClick={(e) => { e.preventDefault(); setCurrentView('portal'); }}>Student Portal</a></li>
              <li><a href="#teacher" onClick={(e) => { e.preventDefault(); setCurrentView('teacher'); }}>Teacher Portal</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>සම්බන්ධ වීමට</h3>
            <p>📍 ලිපිනය: {contact?.address || "තක්ෂිලා මහා විද්‍යාලය, හොරණ"}</p>
            <p>
              📞 දුරකථන:{" "}
              {contact?.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : "034-XXXXXXX"}
            </p>
            <p>
              ✉️ Email:{" "}
              {contact?.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "info@taxilamv.lk"}
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