import { Link } from 'react-router-dom';
import { Droplets, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-primary-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Droplets className="w-8 h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">Bennett Sanitation</span>
              <span className="text-xs text-primary-200 leading-tight">SDG 6 Initiative</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-primary-200 transition-colors">
              Home
            </Link>
            <Link to="/rankings" className="hover:text-primary-200 transition-colors">
              Rankings
            </Link>
            <Link to="/issues" className="hover:text-primary-200 transition-colors">
              Issue Tracker
            </Link>
            <Link
              to="/admin/login"
              className="bg-white text-primary-800 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              Admin
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-primary-700 px-4 py-4 space-y-3">
          <Link
            to="/"
            className="block py-2 hover:text-primary-200 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/rankings"
            className="block py-2 hover:text-primary-200 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Rankings
          </Link>
          <Link
            to="/issues"
            className="block py-2 hover:text-primary-200 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Issue Tracker
          </Link>
          <Link
            to="/admin/login"
            className="block bg-white text-primary-800 px-4 py-2 rounded-lg font-medium text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            Admin Login
          </Link>
        </nav>
      )}
    </header>
  );
}
