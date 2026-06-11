import { Link } from 'react-router-dom';

export default function Logo({ to = '/', size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { img: 'h-7 w-7', text: 'text-base' },
    md: { img: 'h-9 w-9', text: 'text-lg' },
    lg: { img: 'h-14 w-14', text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/logo.svg" alt="" className={`${s.img} shrink-0`} aria-hidden="true" />
      {showText && (
        <span className={`${s.text} font-bold text-indigo-600 dark:text-indigo-400`}>
          English Flashcard
        </span>
      )}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300">
        {content}
      </Link>
    );
  }

  return content;
}
