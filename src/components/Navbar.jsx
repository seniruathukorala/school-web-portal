import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import crest from '../assets/logo.jpg';
import './Nav.css';

export default function Navbar({ onOpenPortal, onOpenTeacherPortal, darkMode, onToggleDarkMode }) {
  const [activeHref, setActiveHref] = useState('#home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { title: 'මුල් පිටුව', href: '#home' },
    { title: 'අප ගැන', href: '#about' },
    { title: 'විදුහල්පති පණිවිඩය', href: '#principal' },
    { title: 'පාසල් ගීතය', href: '#anthem' },
    { title: 'ඉසව්', href: '#events' },
    { title: 'නිවේදන', href: '#notices' },
    { title: 'සම්බන්ධ වීමට', href: '#contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

      if (isAtBottom) {
        setActiveHref('#contact');
        return;
      }

      const scrollPos = window.scrollY + 140;
      for (const link of navLinks) {
        const el = document.querySelector(link.href);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveHref(link.href);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (href) => {
    setActiveHref(href);
    setTimeout(() => {
      setMobileMenuOpen(false);
    }, 100);
  };

  return (
    <motion.header
      className="navbar"
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="nav-container">
        <a
          href="#home"
          className="logo-area"
          onClick={() => handleLinkClick('#home')}
        >
          <motion.div
            className="crest-badge"
            whileHover={{ scale: 1.07, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <img src={crest} alt="Taxila Crest" className="crest-img" />
          </motion.div>
          <div className="school-title">
            <h1>තක්ෂිලා මහා විද්‍යාලය - හොරණ</h1>
            <span>TAXILA MAHA VIDYALAYA - HORANA</span>
          </div>
        </a>

        <div className="nav-right-group">
          <nav className="desktop-nav">
            <div className="nav-pill-wrapper">
              <ul className="nav-links">
                {navLinks.map((item) => {
                  const isActive = activeHref === item.href;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={`nav-pill-link ${isActive ? 'active' : ''}`}
                        onClick={() => handleLinkClick(item.href)}
                      >
                        {item.title}
                        {isActive && (
                          <motion.span
                            layoutId="navIndicator"
                            className="active-indicator"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="nav-divider" />

              <div className="portal-actions">
                <motion.button
                  className="pill-btn student-btn"
                  onClick={onOpenPortal}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  🎓 Student Portal
                </motion.button>

                <motion.button
                  className="pill-btn teacher-btn"
                  onClick={onOpenTeacherPortal}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  👨‍🏫 Teacher Portal
                </motion.button>
              </div>
            </div>
          </nav>

          <motion.button
            className="theme-toggle-btn"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>

          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <ul className="mobile-nav-links">
            {navLinks.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={activeHref === item.href ? 'active' : ''}
                  onClick={() => handleLinkClick(item.href)}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mobile-portal-buttons">
            <button
              type="button"
              className="pill-btn student-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPortal();
              }}
            >
              🎓 Student Portal
            </button>
            <button
              type="button"
              className="pill-btn teacher-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTeacherPortal();
              }}
            >
              👨‍🏫 Teacher Portal
            </button>
          </div>
        </div>
      )}
    </motion.header>
  );
}