import React, { useState, useEffect } from 'react';
import './RecentGamesDropdown.css';

interface RecentGame {
  id: string;
  username: string;
  level: number;
  emailVerified: boolean;
  studentVerified: boolean;
  school?: {
    name: string;
    acronym: string;
    badge: string;
  };
  campus: string;
  totalPoints: number;
  averageScore: number;
  averageDistance: number;
  grade: string;
  completedAt: string;
}

interface RecentGamesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecentGamesDropdown: React.FC<RecentGamesDropdownProps> = ({ isOpen }) => {
  const [games, setGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchRecentGames();
    }
  }, [isOpen]);

  const fetchRecentGames = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      console.log('Fetching recent games...');
      const response = await fetch('/api/db/games/recent?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Recent games data:', data);
        setGames(data);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setError(`Failed to fetch recent games: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching recent games:', err);
      setError('Failed to fetch recent games');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)}km`;
    }
    return `${Math.round(distance)}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'S': return '#ffd700';
      case 'A': return '#4ecca3';
      case 'B': return '#45b7d1';
      case 'C': return '#f39c12';
      case 'D': return '#e67e22';
      case 'F': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="recent-games-dropdown">
      <div className="dropdown-header">
        <h3>Recent Games</h3>
        <p>Latest community activity</p>
      </div>
      
      <div className="games-container">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading recent games...</p>
          </div>
        )}
        
        {error && (
          <div className="error-state">
            <p>{error}</p>
          </div>
        )}
        
        {!loading && !error && games.length === 0 && (
          <div className="empty-state">
            <p>No recent games found</p>
          </div>
        )}
        
        {!loading && !error && games.length > 0 && (
          <div className="games-list">
            {games.map((game) => (
              <div key={game.id} className="game-item">
                <div className="game-header">
                  <div className="player-info">
                    <div className="username-with-level">
                      <span className="username">{game.username}</span>
                      <span className="level-text">Lv.{game.level}</span>
                      {game.school && game.emailVerified && game.studentVerified && (
                        <img 
                          src={game.school.badge} 
                          alt={`${game.school.name} badge`}
                          className="player-school-badge"
                          title={`Verified ${game.school.name} student`}
                        />
                      )}
                    </div>
                    <span className="campus">{game.campus}</span>
                  </div>
                  <div className="grade-badge" style={{ backgroundColor: getGradeColor(game.grade) }}>
                    {game.grade}
                  </div>
                </div>
                
                  <div className="game-stats">
                    <div className="stat">
                      <span className="stat-label">Total Score:</span>
                      <span className="stat-value">{game.totalPoints.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Avg Score:</span>
                      <span className="stat-value">{game.averageScore}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Avg Distance:</span>
                      <span className="stat-value">{formatDistance(game.averageDistance)}</span>
                    </div>
                  </div>                <div className="game-time">
                  {formatDate(game.completedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentGamesDropdown;