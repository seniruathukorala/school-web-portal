import TeacherUploadPortal from './components/TeacherUploadPortal';
import { useState, useEffect } from 'react';
import { client, urlFor } from './sanityClient';
import './App.css';
import Navbar from './components/Navbar';
import principalImg from './assets/principal.jpg';
import anthemAudio from './assets/anthem.mp3';
import ResultsChecker from './components/ResultsChecker';
import { motion } from 'framer-motion';

export default function App() {
  // 1. Navigation state: 'home', 'portal', or 'teacher'
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
      <div style={{ minHeight: '100vh', background: '#fdf8f6', padding: '30px 20px' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto 15px auto' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '10px 18px',
              background: '#450a11',
              color: '#facc15',
              border: '1px solid #eab308',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.88rem'
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
      <div style={{ minHeight: '100vh', background: '#fdf8f6', padding: '30px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto 15px auto' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '10px 18px',
              background: '#450a11',
              color: '#facc15',
              border: '1px solid #eab308',
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.88rem'
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
          <motion.h2
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {hero?.title || "දැනුමෙන් සපිරි හෙට දවසක් උදෙසා"}
          </motion.h2>

          <motion.p 
            className="motto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
          >
            "{hero?.motto || "විද්‍යා දදාති විනයං"}"
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
          >
            <a href="#about" className="btn">
              {hero?.buttonText || "තවත් විස්තර"}
            </a>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section">
        <div className="container">
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
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                {about?.description ||
                  "අප පාසල දශක ගණනාවක අභිමානවත් ඉතිහාසයකට උරුමකම් කියන, ගුණගරුක හා දක්ෂ දරු පරපුරක් දැයට දායාද කරන ප්‍රමුඛ පෙළේ පාසලකි."}
              </motion.p>

              <div className="vision-mission">
                <motion.div 
                  className="card"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                >
                  <h3>🎯 අපගේ දැක්ම (Vision)</h3>
                  <p>
                    {about?.vision ||
                      "දැනුමෙන් හා යහපත් ආකල්පවලින් පිරිපුන් විශිෂ්ටතම ශ්‍රී ලාංකීය පුරවැසියෙකු බිහිකිරීම."}
                  </p>
                </motion.div>

                <motion.div 
                  className="card"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                >
                  <h3>🚀 අපගේ මෙහෙවර (Mission)</h3>
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

            <motion.div 
              className="principal-text"
              initial={{ opacity: 0, x: 35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            >
              <div className="principal-header">
                <h2 className="principal-title">විදුහල්පති පණිවිඩය</h2>
                <motion.div 
                  className="title-bar"
                  initial={{ width: 0 }}
                  whileInView={{ width: '65px' }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                />
              </div>

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
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {anthem?.title || "පාසල් ගීතය"}
          </motion.h2>

          <motion.div 
            className="anthem-card"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {(anthem?.audioUrl || anthemAudio) && (
              <motion.div 
                className="anthem-audio-box"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p>🎧 පාසල් ගීතයට සවන් දෙන්න</p>
                <audio controls src={anthem?.audioUrl || anthemAudio}>
                  Your browser does not support the audio element.
                </audio>
              </motion.div>
            )}

            <div className="anthem-lyrics">
              <motion.div 
                className={`lyrics-wrapper ${showFullLyrics ? "expanded" : "collapsed"}`}
                animate={{ height: showFullLyrics ? "auto" : "140px" }}
                transition={{ duration: 0.45, ease: [0.04, 0.62, 0.23, 0.98] }}
              >
                <p style={{ whiteSpace: "pre-line" }}>
                  {anthem?.lyrics || "පාසල් ගීතයේ පද පේළි මෙතැන දිස්වේ..."}
                </p>
              </motion.div>

              <motion.button 
                className="see-more-btn"
                onClick={() => setShowFullLyrics(!showFullLyrics)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showFullLyrics ? "අඩු කරන්න ▲" : "සම්පූර්ණ ගීතය කියවන්න ▼"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="section">
        <div className="container">
          <h2 className="section-title">පාසල් ඉසව් සහ පුවත්</h2>
          <div className="events-grid">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                {event.coverImage && (
                  <div 
                    className="event-cover-wrap"
                    onClick={() => setSelectedImage(urlFor(event.coverImage).url())}
                  >
                    <img 
                      src={urlFor(event.coverImage).width(900).url()} 
                      alt={event.title} 
                      className="event-cover-img"
                    />
                  </div>
                )}
                <div className="event-body">
                  <div className="event-meta">
                    <span>📅 {event.date}</span>
                    {event.location && <span>| 📍 {event.location}</span>}
                  </div>
                  <h3 className="event-title">{event.title}</h3>
                  {event.description && (
                    <p className="event-desc">{event.description}</p>
                  )}
                  {event.gallery && event.gallery.length > 0 && (
                    <div className="event-gallery-box">
                      <span className="event-gallery-label">
                        📸 තවත් පින්තූර ({event.gallery.length}) - බැලීමට click කරන්න:
                      </span>
                      <div className="event-gallery-thumbs">
                        {event.gallery.map((photo, index) => (
                          <img 
                            key={index}
                            src={urlFor(photo).width(250).height(200).url()} 
                            alt={`Gallery ${index}`} 
                            onClick={() => setSelectedImage(urlFor(photo).url())}
                            className="event-thumb"
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
              backgroundColor: 'rgba(28, 4, 7, 0.9)',
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
                  top: '-42px',
                  right: '0',
                  background: 'none',
                  border: 'none',
                  color: '#facc15',
                  fontSize: '34px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
              <img 
                src={selectedImage} 
                alt="Full Preview" 
                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '10px', border: '2px solid #eab308', display: 'block' }} 
              />
            </div>
          </div>
        )}
      </section>

      {/* Notices Section */}
      <section id="notices" className="section bg-light">
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