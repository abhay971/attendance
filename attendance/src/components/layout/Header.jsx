import { useAuth } from '../../context/AuthContext';

export function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Menu button (mobile) */}
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title (mobile) / Spacer (desktop) */}
        <div className="lg:hidden">
          <span className="font-bold text-lg text-gray-900">Attendance</span>
        </div>
        <div className="hidden lg:block" />

        {/* User menu */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
