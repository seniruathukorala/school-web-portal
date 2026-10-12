import crest from '../assets/logo.jpg';

export default function Navbar({ onOpenPortal }) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <div className="logo-area">
          <img src={crest} alt="School Crest" className="crest-img" />
          <div className="school-title">
            <h1>තක්ෂිලා මහා විද්‍යාලය-හොරණ</h1>
            <span>Taxila Maha Vidyalaya - Horana</span>
          </div>
        </div>
        <nav>
          <ul className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <li><a href="#home">මුල් පිටුව</a></li>
            <li><a href="#about">අප ගැන</a></li>
            <li><a href="#principal">විදුහල්පති පණිවිඩය</a></li>
            <li><a href="#notices">නිවේදන</a></li>
            <li><a href="#contact">සම්බන්ධ වීමට</a></li>
            <li><a href="#anthem">පාසල් ගීතය</a></li>
            
            {/* Student Portal Button eka */}
            <li>
              <button
                onClick={onOpenPortal}
                style={{
                  padding: '7px 14px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
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