import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center border border-slate-800 space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">403 - Forbidden</h1>
          <p className="text-slate-400 text-sm">
            You do not have permission to access this page. This resource requires elevated role privileges.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
