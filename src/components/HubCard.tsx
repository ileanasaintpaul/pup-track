import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Props = {
  icon: string;
  title: string;
  value?: string | null;
  to?: string;
};

export function HubCard({ icon, title, value, to }: Props) {
  const { t } = useTranslation();

  const body = (
    <>
      <span className="hub-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="hub-title">{title}</span>
      <span className="hub-value">{to ? (value ?? t('common.empty')) : t('nav.soon')}</span>
    </>
  );

  if (!to) return <div className="hub-card hub-card-disabled">{body}</div>;
  return (
    <Link to={to} className="hub-card">
      {body}
    </Link>
  );
}
