'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CompanyLogo } from '@/components/CompanyLogo';

const SERVICES = [
  "Informatique", "Maintenance", "Resource Humaine", "Comptabilite",
  "Production", "Transport", "Surete", "Commercial", "Achats",
  "Service Aerien", "Regulation", "Materiel de Bord (MDB)",
  "Economat", "Audit", "Supervision",
  "Qualite Hygienne et surete Environmental (QHSE)",
  "Remote"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

export default function AdminLogin() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'rh' | 'chef' | 'dg'>('rh');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedRole === 'chef' && !department) {
      setError('Veuillez sélectionner votre département');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          department: selectedRole === 'chef' ? department : undefined,
        }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Mot de passe incorrect');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels: Record<string, string> = {
    rh: 'Ressources Humaines (RH)',
    chef: 'Chef de Service',
    dg: 'Direction Générale (DG)',
  };

  const roleColors: Record<string, string> = {
    rh: 'bg-blue-600',
    chef: 'bg-emerald-600',
    dg: 'bg-purple-600',
  };

  const roleRingColors: Record<string, string> = {
    rh: 'focus:ring-blue-500',
    chef: 'focus:ring-emerald-500',
    dg: 'focus:ring-purple-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center px-4 font-sans relative overflow-hidden transition-colors duration-500">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/30 to-purple-100/20 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 150, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/20 to-blue-100/20 dark:from-emerald-900/10 dark:to-blue-900/10 rounded-full blur-3xl"
        />
      </div>

      {/* Theme Toggle - top right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="mb-8 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-2 relative z-10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l&apos;accueil
        </Link>
      </motion.div>

      {/* Main Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-200/60 dark:border-slate-700/60 p-10 relative z-10 transition-colors duration-300"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <CompanyLogo size="md" />
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Espace Administration</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Sélectionnez votre rôle et connectez-vous</p>
        </motion.div>

        {/* Role Selector */}
        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Votre rôle</label>
          <div className="grid grid-cols-3 gap-2">
            {(['rh', 'chef', 'dg'] as const).map((role, index) => (
              <motion.button
                key={role}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedRole(role); setError(''); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border-2 transition-all text-center ${selectedRole === role
                    ? role === 'rh' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : role === 'chef' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
              >
                {role === 'rh' ? 'Resource Humaine' : role === 'chef' ? ' Chef Service' : ' Direction Generale'}
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">{roleLabels[selectedRole]}</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Department selector for chef */}
          {selectedRole === 'chef' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Votre département *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              >
                <option value="">Sélectionnez votre département</option>
                {SERVICES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50/50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm py-2.5 px-4 rounded-xl text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3 px-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 active:scale-[0.98] ${selectedRole === 'rh' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-500/25'
                : selectedRole === 'chef' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-500/25'
                  : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-purple-500/25'
              } focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authentification...
              </span>
            ) : (
              `Se connecter en tant que ${roleLabels[selectedRole]}`
            )}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
          <p className="text-center text-slate-400 dark:text-slate-500 text-xs">
            Le rôle détermine les demandes visibles et les actions disponibles dans le tableau de bord.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}