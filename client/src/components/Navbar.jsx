import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, User as UserIcon, Building2, Film, Sparkles, QrCode, Clock, ShieldCheck, CheckSquare, TrendingUp } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'organiser':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
              <Ticket className="w-6 h-6" />
            </div>
            <span className="gradient-text text-2xl font-black">CinePass</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/shows"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Browse Shows
            </Link>

            {user && (
              <Link
                to="/my-bookings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                My Bookings
              </Link>
            )}

            {user && (
              <Link
                to="/my-waitlist"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                My Waitlist
              </Link>
            )}

            {user && (user.role === 'organiser' || user.role === 'admin') && (
              <Link
                to="/organiser/shows"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Film className="w-4 h-4 text-amber-400" />
                My Shows
              </Link>
            )}

            {user && (user.role === 'organiser' || user.role === 'admin') && (
              <Link
                to="/organiser/analytics"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Analytics
              </Link>
            )}

            {user && (user.role === 'organiser' || user.role === 'admin') && (
              <Link
                to="/verify-ticket"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Scan QR Ticket
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Admin Dashboard
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link
                to="/admin/venues"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Building2 className="w-4 h-4 text-rose-400" />
                Manage Venues
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">{user.name}</span>
                <span className={`text-xs uppercase px-2.5 py-0.5 rounded-full font-semibold border ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-rose-600/20 hover:border-rose-500/30 border border-slate-700/60 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
