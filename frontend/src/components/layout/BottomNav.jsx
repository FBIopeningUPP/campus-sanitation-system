import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, AlertCircle, QrCode } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/rankings', icon: Trophy, label: 'Rankings' },
    { to: '/issues', icon: AlertCircle, label: 'Issues' },
    { to: '/scan', icon: QrCode, label: 'Scan QR' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : ''}`} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
