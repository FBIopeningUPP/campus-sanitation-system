import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  AlertCircle, 
  BarChart3, 
  QrCode, 
  LogOut,
  Menu,
  X,
  Droplets,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/buildings', icon: Building2, label: 'Buildings' },
  { to: '/admin/issues', icon: AlertCircle, label: 'Issues' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/qrcodes', icon: QrCode, label: 'QR Codes' },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-primary-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-primary-800">
          <Link to="/admin" className="flex items-center gap-3">
            <Droplets className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-primary-300">Sanitation System</p>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.to, item.exact)
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-800">
          <div className="flex items-center gap-3 mb-3 px-4">
            <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center">
              {admin?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.fullName || 'Admin'}</p>
              <p className="text-xs text-primary-300 truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-primary-200 hover:text-white hover:bg-primary-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold text-gray-800 lg:hidden">
                Admin Panel
              </h2>
            </div>
            <Link
              to="/"
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              View Student Site →
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
