'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Plus, Clock, CheckCircle2, XCircle, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Absence {
  _id: string;
  absence: {
    type: string;
    startDate: string;
    endDate: string;
  };
  status: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approuvé</span>;
    case 'rejected':
      return <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Refusé</span>;
    default:
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> En attente</span>;
  }
};

const calculateRemainingDays = (startDate: string, endDate: string, status: string) => {
  if (status !== 'approved') return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  if (today < start) {
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return `Commence dans ${diff} jour(s)`;
  } else if (today >= start && today <= end) {
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return `Expire dans ${diff} jour(s)`;
  } else {
    return 'Terminé';
  }
};

export default function EmployeeDashboard() {
  const router = useRouter();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbsences = async () => {
      try {
        const res = await fetch('/api/absences/me');
        if (res.ok) {
          const data = await res.json();
          setAbsences(data);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAbsences();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white transition-colors duration-500">
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <CompanyLogo size="sm" />
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mon Tableau de Bord</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Suivez l'état de vos demandes d'absence.</p>
          </div>
          <Link href="/demander">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Demande
            </motion.button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : absences.length === 0 ? (
          <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-10 text-center border border-slate-200/50 dark:border-slate-800/50">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Aucune demande trouvée</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vous n'avez pas encore soumis de demande d'absence.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {absences.map((abs, idx) => {
              const remainingInfo = calculateRemainingDays(abs.absence.startDate, abs.absence.endDate, abs.status);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={abs._id} 
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{abs.absence.type || 'Absence'}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Du {new Date(abs.absence.startDate).toLocaleDateString()} au {new Date(abs.absence.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    {getStatusBadge(abs.status)}
                  </div>
                  
                  {remainingInfo && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {remainingInfo}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
