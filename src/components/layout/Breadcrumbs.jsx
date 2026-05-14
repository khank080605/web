import { Link } from 'react-router-dom';

const Breadcrumbs = ({ items = [], className = '' }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span className="material-symbols-outlined text-[16px] flex-shrink-0">chevron_right</span>
              )}

              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-on-surface font-semibold' : ''}
                >
                  {item.label}
                </span>
              ) : (
                <Link className="hover:text-secondary transition-colors" to={item.to}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;