import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminVenues from './pages/AdminVenues';
import AdminDashboard from './pages/AdminDashboard';
import OrganiserShows from './pages/OrganiserShows';
import OrganiserAnalytics from './pages/OrganiserAnalytics';
import BrowseShows from './pages/BrowseShows';
import ShowDetail from './pages/ShowDetail';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import MyWaitlist from './pages/MyWaitlist';
import VerifyTicket from './pages/VerifyTicket';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shows" element={<BrowseShows />} />
              <Route path="/shows/:id" element={<ShowDetail />} />

              {/* Protected Customer Routes */}
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'organiser', 'admin']}>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-waitlist"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'organiser', 'admin']}>
                    <MyWaitlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/confirmation/:id"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'organiser', 'admin']}>
                    <BookingConfirmation />
                  </ProtectedRoute>
                }
              />

              {/* Protected Role-Based Routes */}
              <Route
                path="/verify-ticket"
                element={
                  <ProtectedRoute allowedRoles={['organiser', 'admin']}>
                    <VerifyTicket />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/venues"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVenues />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/organiser/shows"
                element={
                  <ProtectedRoute allowedRoles={['organiser', 'admin']}>
                    <OrganiserShows />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/organiser/analytics"
                element={
                  <ProtectedRoute allowedRoles={['organiser', 'admin']}>
                    <OrganiserAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to /shows */}
              <Route path="/" element={<Navigate to="/shows" replace />} />
              <Route path="*" element={<Navigate to="/shows" replace />} />
            </Routes>
          </main>

          <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>© 2026 CinePass Ticket Booking Platform. Built with Express, React & Redis.</p>
              <div className="flex items-center gap-6 text-slate-400">
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                <span className="hover:text-white transition-colors cursor-pointer">Support</span>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
