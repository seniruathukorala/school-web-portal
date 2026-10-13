import React from 'react';
import crest from '../assets/logo.jpg';
import './Nav.css'; // Nav.css eka methanata import karanna

export default function Navbar({ onOpenPortal }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="logo-area">
          <img src={crest} alt="School Crest" className="crest-img" />
          <div className="school-title">
            <h1>තක්ෂිලා මහා විද්‍යාලය-හොරණ</h1>
            <span>Taxila Maha Vidyalaya - Horana</span>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            <li><a href="#home">මුල් පිටුව</a></li>
            <li><a href="#about">අප ගැන</a></li>
            <li><a href="#principal">විදුහල්පති පණිවිඩය</a></li>
            <li><a href="#notices">නිවේදන</a></li>
            <li><a href="#contact">සම්බන්ධ වීමට</a></li>
            <li><a href="#anthem">පාසල් ගීතය</a></li>
            
            {/* Student Portal Button */}
            <li>
              <button 
                className="portal-btn"
                onClick={onOpenPortal}
              >
                Student Portal
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}