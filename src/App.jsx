import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import './App.css';

import heroImg from './assets/hero.jpg';
import principalImg from './assets/principal.jpg';
import anthemAudio from './assets/anthem.mp3';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('taxila_dark_mode') === 'true';
  });

  const [showPortal, setShowPortal] = useState(false);
  const [showTeacherPortal, setShowTeacherPortal] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    localStorage.setItem('taxila_dark_mode', darkMode);
  }, [darkMode]);

  return (
    <div className={`app-wrapper ${darkMode ? 'dark-mode' : ''}`}>
      {/* Navigation Bar */}
      <Navbar
        onOpenPortal={() => setShowPortal(true)}
        onOpenTeacherPortal={() => setShowTeacherPortal(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Hero Section */}
      <section
        id="home"
        className="hero"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="hero-overlay" />
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
        >
          <h2>තක්ෂිලා මහා විද්‍යාලය - හොරණ.</h2>
          <p className="motto">"ගුණාත්මක අධ්‍යාපනයක් තුළින් අසිරිමත් දරුවෙක්"</p>
          <div className="hero-actions">
            <a href="#about" className="btn">
              තවත් විස්තර
            </a>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="section">
        <div className="container">
          <h2 className="section-title">අප ගැන</h2>
          <div className="about-grid">
            <div className="about-text">
              <p>
                හොරණ තක්ෂිලා මහා විද්‍යාලය යනු දශක ගණනාවක් පුරා දැයේ දරුවන්ට නැණ ගුණ පිරි
                අධ්‍යාපනයක් ලබා දෙමින් විශිෂ්ට පුරවැසියන් රටට දායාද කළ කීර්තිමත් විද්‍යායතනයකි.
              </p>

              <div className="vision-mission">
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3>🎯 අපගේ දැක්ම</h3>
                  <p>
                    දැනුමෙන්, කුසලතාවයෙන් හා යහපත් ආකල්පවලින් පිරිපුන්, ලෝකය ජයගත හැකි
                    නිර්මාණශීලී දරු පරපුරක් බිහි කිරීම.
                  </p>
                </motion.div>

                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                >
                  <h3>🚀 අපගේ මෙහෙවර</h3>
                  <p>
                    නවීන තාක්ෂණය සහ සාරධර්ම මුසු වූ ගුණාත්මක ඉගෙනුම් පරිසරයක් තුළින් සෑම
                    දරුවෙකුගේම සැඟවුණු දක්ෂතා ඔප්නැංවීම.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principal's Message Section */}
      <section id="principal" className="section bg-light">
        <div className="container">
          <motion.div
            className="principal-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="principal-img-box">
              <img
                src={principalImg}
                alt="විදුහල්පතිතුමා"
                className="principal-img"
              />
            </div>

            <div className="principal-text">
              <div className="principal-header">
                <h2 className="principal-title">විදුහල්පති පණිවිඩය</h2>
                <div className="title-bar" />
              </div>

              <p className="principal-message">
                "අපගේ විද්‍යාලයීය නිල වෙබ් අඩවිය වෙත ඔබ සැම සාදරයෙන් පිළිගනිමු.
                විභාග ජයග්‍රහණ මෙන්ම විනය, ක්‍රීඩා සහ සෞන්දර්යය තුළින් සමබර පෞරුෂයක්
                ඇති දරුවන් නිර්මාණය කිරීම අපගේ ඒකායන අරමුණයි."
              </p>

              <div className="principal-name">
                <h4>විදුහල්පතිතුමා</h4>
                <span>තක්ෂිලා මහා විද්‍යාලය - හොරණ</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* School Anthem Section */}
      <section id="anthem" className="section anthem-section">
        <div className="container">
          <h2 className="section-title">පාසල් ගීතය</h2>

          <div className="anthem-card">
            <div className="anthem-audio-box">
              <p>🎵 පාසල් ගීතයට සවන් දෙන්න</p>
              <audio controls src={anthemAudio}>
                Your browser does not support the audio element.
              </audio>
            </div>

            <div
              className={`lyrics-wrapper ${lyricsExpanded ? 'expanded' : 'collapsed'}`}
              style={{ maxHeight: lyricsExpanded ? '1200px' : '220px' }}
            >
              <div className="anthem-lyrics">
                <p>
                  සැරදේ සැරදේ තක්ෂිලා මාතා...
                  <br />
                  නැණ ගුණ දම් දෙන අප විදු මාතා...
                  <br />
                  විදුහල් මවුනි ඔබේ නාමයෙන්...
                  <br />
                  පෙරටම යන්නෙමු අභිමානයෙන්...
                </p>
              </div>
            </div>

            <button
              type="button"
              className="see-more-btn"
              onClick={() => setLyricsExpanded((prev) => !prev)}
            >
              {lyricsExpanded ? 'හකුළන්න ▲' : 'සම්පූර්ණ ගීතය බලන්න ▼'}
            </button>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="section">
        <div className="container">
          <h2 className="section-title">පාසල් ඉසව්</h2>
          <div className="events-grid">
            <div className="event-card">
              <div
                className="event-cover-wrap"
                onClick={() => setLightboxImg(heroImg)}
              >
                <img src={heroImg} alt="වාර්ෂික ක්‍රීඩා උළෙල" className="event-cover-img" />
              </div>
              <div className="event-body">
                <div className="event-meta">
                  <span>📅 2026</span>
                  <span>•</span>
                  <span>ක්‍රීඩා හා විෂය සමගාමී</span>
                </div>
                <h3 className="event-title">වාර්ෂික නිවාසාන්තර ක්‍රීඩා උළෙල</h3>
                <p className="event-desc">
                  සිසු දරුවන්ගේ ක්‍රීඩා කුසලතා සහ කණ්ඩායම් හැඟීම වර්ධනය කරමින් පැවැත්වෙන
                  වාර්ෂික මහා ක්‍රීඩා උළෙල.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notices Section */}
      <section id="notices" className="section bg-light">
        <div className="container">
          <h2 className="section-title">විශේෂ නිවේදන</h2>
          <div className="notices-grid">
            <div className="notice-card">
              <span className="badge">අධ්‍යයන</span>
              <h3>වාර විභාග ප්‍රතිඵල නිකුත් කිරීම</h3>
              <p>
                සිසුන්ගේ වාර විභාග ප්‍රතිඵල දැන් Student Portal හරහා පරීක්ෂා කළ හැකිය.
              </p>
            </div>

            <div className="notice-card">
              <span className="badge">දැනුම්දීමයි</span>
              <h3>නව වාරය ආරම්භ වීම</h3>
              <p>
                නව පාසල් වාරය සඳහා සියලුම සිසුන් නියමිත වේලාවට පාසලට පැමිණිය යුතුය.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact">
        <div className="container footer-content">
          <div className="footer-col">
            <h3>තක්ෂිලා මහා විද්‍යාලය</h3>
            <p>ගුණාත්මක අධ්‍යාපනයක් තුළින් අසිරිමත් දරුවෙක්.</p>
          </div>

          <div className="footer-col">
            <h3>ඉක්මන් සබැඳි</h3>
            <ul>
              <li><a href="#home">මුල් පිටුව</a></li>
              <li><a href="#about">අප ගැන</a></li>
              <li><a href="#principal">විදුහල්පති පණිවිඩය</a></li>
              <li><a href="#events">ඉසව්</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>සම්බන්ධ වීමට</h3>
            <p>📍 තක්ෂිලා මහා විද්‍යාලය, හොරණ.</p>
            <p>📞 034-2261234</p>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} තක්ෂිලා මහා විද්‍යාලය - හොරණ. සියලුම හිමිකම් ඇවිරිණි.
        </div>
      </footer>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000,
              padding: '20px',
              cursor: 'zoom-out',
            }}
          >
            <img
              src={lightboxImg}
              alt="Preview"
              style={{ maxWidth: '92%', maxHeight: '88vh', borderRadius: '12px' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temporary Student / Teacher Portal Placeholders */}
      {(showPortal || showTeacherPortal) && (
        <div
          onClick={() => {
            setShowPortal(false);
            setShowTeacherPortal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: darkMode ? '#220d11' : '#ffffff',
              color: darkMode ? '#f8fafc' : '#1e293b',
              padding: '32px',
              borderRadius: '18px',
              maxWidth: '460px',
              width: '100%',
              border: '2px solid #eab308',
              textAlign: 'center',
            }}
          >
            <h3 style={{ marginBottom: '12px', color: darkMode ? '#facc15' : '#7f1d1d' }}>
              {showPortal ? '🎓 Student Results Portal' : '👨‍🏫 Teacher Upload Portal'}
            </h3>
            <p style={{ marginBottom: '20px', fontSize: '0.95rem' }}>
              ප්‍රතිඵල පද්ධතිය සඳහා දත්ත ඇතුළත් කිරීමෙන් පසු මෙම කොටස සක්‍රීය වේ.
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowPortal(false);
                setShowTeacherPortal(false);
              }}
            >
              වසන්න
            </button>
          </div>
        </div>
      )}
    </div>
  );
}