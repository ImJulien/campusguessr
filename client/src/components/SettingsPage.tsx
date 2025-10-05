import React, { useState, useEffect } from 'react';
import AudioManager from '../utils/audioManager';
import './SettingsPage.css';

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  console.log('SettingsPage rendering...'); // Debug log
  
  const [activeSection, setActiveSection] = useState<'account' | 'language' | 'audio' | 'about'>('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'fr'>('en');
  const [musicVolume, setMusicVolume] = useState(70);
  const [sfxVolume, setSfxVolume] = useState(80);

  const audioManager = AudioManager.getInstance();

  useEffect(() => {
    // Initialize audio settings from AudioManager
    audioManager.initializeFromStorage();
    setMusicVolume(Math.round(audioManager.getMusicVolume() * 100));
    setSfxVolume(Math.round(audioManager.getSfxVolume() * 100));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordError('You must be logged in to change your password');
        return;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLanguageChange = (language: 'en' | 'fr') => {
    setSelectedLanguage(language);
    // TODO: Implement language change functionality
    console.log('Language changed to:', language);
  };

  const renderAccountSection = () => (
    <div className="settings-section">
      <h2>Account Settings</h2>
      <form onSubmit={handlePasswordChange} className="password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="settings-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="settings-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="settings-input"
          />
        </div>
        {passwordError && (
          <div className="error-message">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="success-message">
            {passwordSuccess}
          </div>
        )}
        <button type="submit" className="settings-button" disabled={isChangingPassword}>
          {isChangingPassword ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );

  const renderLanguageSection = () => (
    <div className="settings-section">
      <h2>Language Settings</h2>
      <div className="language-options">
        <div className="language-option">
          <label className="language-label">
            <input
              type="radio"
              name="language"
              value="en"
              checked={selectedLanguage === 'en'}
              onChange={() => handleLanguageChange('en')}
              className="language-radio"
            />
            <span className="language-text">
              <span className="language-flag">🇺🇸</span>
              English
            </span>
          </label>
        </div>
        <div className="language-option">
          <label className="language-label">
            <input
              type="radio"
              name="language"
              value="fr"
              checked={selectedLanguage === 'fr'}
              onChange={() => handleLanguageChange('fr')}
              className="language-radio"
            />
            <span className="language-text">
              <span className="language-flag">🇫🇷</span>
              Français
            </span>
          </label>
        </div>
      </div>
    </div>
  );

    const renderAudioSection = () => (
    <div className="settings-section">
      <h2>Audio Settings</h2>
      
      <div className="form-group">
        <label htmlFor="music-volume">Background Music Volume: {musicVolume}%</label>
        <input
          type="range"
          id="music-volume"
          min="0"
          max="100"
          value={musicVolume}
          onChange={(e) => {
            const volume = parseInt(e.target.value);
            setMusicVolume(volume);
            audioManager.setMusicVolume(volume / 100);
          }}
          className="volume-slider"
        />
      </div>

      <div className="form-group">
        <label htmlFor="sfx-volume">Sound Effects Volume: {sfxVolume}%</label>
        <input
          type="range"
          id="sfx-volume"
          min="0"
          max="100"
          value={sfxVolume}
          onChange={(e) => {
            const volume = parseInt(e.target.value);
            setSfxVolume(volume);
            audioManager.setSfxVolume(volume / 100);
            // Play test sound
            audioManager.playClick();
          }}
          className="volume-slider"
        />
      </div>

      <div className="form-group">
        <button 
          className="settings-button"
          onClick={() => {
            audioManager.playClick();
            audioManager.setMusicEnabled(!audioManager.isMusicEnabledState());
          }}
        >
          {audioManager.isMusicEnabledState() ? 'Disable' : 'Enable'} Background Music
        </button>
      </div>

      <div className="form-group">
        <button 
          className="settings-button"
          onClick={() => {
            audioManager.setSfxEnabled(!audioManager.isSfxEnabledState());
            if (audioManager.isSfxEnabledState()) {
              audioManager.playClick();
            }
          }}
        >
          {audioManager.isSfxEnabledState() ? 'Disable' : 'Enable'} Sound Effects
        </button>
      </div>
    </div>
  );

  const renderAboutSection = () => (
    <div className="settings-section">
      <h2>About CampusGuessr</h2>
      <div className="about-content">
        <div className="game-info">
          <h3>Game Information</h3>
          <p>CampusGuessr is an interactive geography game that challenges players to identify locations on various university campuses using Street View imagery.</p>
          <div className="version-info">
            <span>Version: 1.0.0</span>
          </div>
        </div>
        
        <div className="team-info">
          <h3>Development Team</h3>
          <p>This game was created with passion and dedication by our development team.</p>
          {/* TODO: Add your team information here */}
        </div>

        <div className="credits">
          <h3>Credits & Acknowledgments</h3>
          <p>Special thanks to Google Maps Platform for providing the Street View API that makes this game possible.</p>
        </div>

        <div className="contact-info">
          <h3>Contact</h3>
          <p>For feedback, suggestions, or support, please reach out to us.</p>
          {/* TODO: Add contact information */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <button className="back-button" onClick={() => {
          audioManager.playClick();
          onBack();
        }}>
            Back
          </button>
        </div>
        
        <div className="settings-body">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              <button 
                className={`nav-button ${activeSection === 'account' ? 'active' : ''}`}
                onClick={() => {
                  audioManager.playClick();
                  setActiveSection('account');
                }}
              >
                <span className="nav-icon">👤</span>
                Account
              </button>
              <button 
                className={`nav-button ${activeSection === 'language' ? 'active' : ''}`}
                onClick={() => {
                  audioManager.playClick();
                  setActiveSection('language');
                }}
              >
                <span className="nav-icon">🌐</span>
                Language
              </button>
              <button 
                className={`nav-button ${activeSection === 'audio' ? 'active' : ''}`}
                onClick={() => {
                  audioManager.playClick();
                  setActiveSection('audio');
                }}
              >
                <span className="nav-icon">🔊</span>
                Audio
              </button>
              <button 
                className={`nav-button ${activeSection === 'about' ? 'active' : ''}`}
                onClick={() => {
                  audioManager.playClick();
                  setActiveSection('about');
                }}
              >
                <span className="nav-icon">ℹ️</span>
                About
              </button>
            </nav>
          </div>
          
          <div className="settings-content">
            {activeSection === 'account' && renderAccountSection()}
            {activeSection === 'language' && renderLanguageSection()}
            {activeSection === 'audio' && renderAudioSection()}
            {activeSection === 'about' && renderAboutSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;