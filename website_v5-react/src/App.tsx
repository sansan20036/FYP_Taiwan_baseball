import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import LegacyPage from './components/LegacyPage';

type LegacyRoute = {
  path: string;
  file: string;
  label: string;
  description?: string;
};

const legacyRoutes: LegacyRoute[] = [
  { path: '/', file: 'app.html', label: 'Home', description: 'Landing experience from website_v4' },
  { path: '/dashboard', file: 'index.html', label: 'Dashboard', description: 'Scoreboards and live metrics' },
  { path: '/matches', file: 'matches.html', label: 'Matches', description: 'Match schedule and filters' },
  { path: '/teams', file: 'team.html', label: 'Teams', description: 'Team breakdowns' },
  { path: '/players', file: 'players.html', label: 'Players', description: 'Player directory' },
  { path: '/all-players', file: 'all_players_render.html', label: 'All Players', description: 'Player list renderer' },
  { path: '/compare', file: 'player_compare.html', label: 'Compare', description: 'Player comparison view' },
  { path: '/profile', file: 'show_player_profile.html', label: 'Profile', description: 'Profile deep-dive' },
  { path: '/news', file: 'news.html', label: 'News', description: 'News and updates feed' },
  { path: '/chatbot', file: 'chatbot.html', label: 'Chatbot', description: 'Chat assistant UI' },
  { path: '/loading', file: 'loading_animation.html', label: 'Loading', description: 'Loading animation demo' },
  { path: '/test', file: 'test.html', label: 'Test', description: 'Auxiliary test harness' },
];

export default function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="brand">
          <span className="brand__dot" />
          <div>
            <p className="brand__eyebrow">React Wrapper</p>
            <h1 className="brand__title">ProBall Analytics</h1>
          </div>
        </div>

        <nav className="nav">
          {legacyRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}
              end={route.path === '/'}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>

        <div className="status">
          <span className="status__pill">legacy assets: /legacy/*</span>
          <span className="status__path">{location.pathname}</span>
        </div>
      </header>

      <main className="app-shell__main">
        <Routes>
          {legacyRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<LegacyPage title={route.label} file={route.file} description={route.description} />}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
