import { Link } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';

/**
 * AuthLayout — centred card layout for login / register / forgot-password pages.
 */
export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app px-4 py-12">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 mb-8 font-serif text-2xl font-semibold text-primary">
        <FiBookOpen size={26} className="text-accent" />
        IUEA Library
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-card shadow-card px-8 py-10">
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title    && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © {new Date().getFullYear()} International University of East Africa
      </p>
    </div>
  );
}
