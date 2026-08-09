import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TABS = [
  { to: '', key: 'nav.home', icon: '🏠', ready: true },
  { to: 'health', key: 'nav.health', icon: '❤️', ready: true },
  { to: 'training', key: 'nav.training', icon: '🎓', ready: true },
  { to: 'map', key: 'nav.map', icon: '📍', ready: false },
  { to: 'coach', key: 'nav.coach', icon: '💬', ready: false },
] as const;

export function TabBar({ dogId }: { dogId: string }) {
  const { t } = useTranslation();

  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          end={tab.to === ''}
          to={tab.to ? `/dog/${dogId}/${tab.to}` : `/dog/${dogId}`}
          className={({ isActive }) => (isActive ? 'tab tab-active' : 'tab')}
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tab-label">{t(tab.key)}</span>
          {tab.ready ? null : <span className="tab-badge">{t('nav.soon')}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
