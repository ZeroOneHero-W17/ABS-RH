'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CompanyLogo } from '@/components/CompanyLogo';
import { getServiceOptionsForSelect } from '@/lib/departmentCatalog';
import { Lock, Shield, ShieldAlert, ArrowLeft, Briefcase, UserCheck, Eye, EyeOff } from 'lucide-react';

const SERVICES = getServiceOptionsForSelect();

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
      duration: 0.5,
      ease: 'easeOut'
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

export default function AdminLogin() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'rh' | 'chef' | 'dg'>('rh');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
          rememberMe,
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 font-sans relative overflow-hidden">
      
      {/* Fond de page dégradé avec transition douce (cross-fade) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-700 z-0" />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

        {/* ✈ Avion — Service aérien */}
        <motion.div
          animate={{ x: [0, 30, -30, 0], y: [0, -25, 15, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 left-10 w-[16rem] h-[16rem] text-blue-500/[0.06] dark:text-blue-400/[0.03] blur-[2px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
          </svg>
        </motion.div>

        {/* ⚓ Ancre — Service offshore */}
        <motion.div
          animate={{ y: [0, 10, -10, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-16 right-10 w-[12rem] h-[12rem] text-cyan-500/[0.05] dark:text-cyan-400/[0.025] blur-[2px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <circle cx="12" cy="5" r="2"/>
            <path d="M12 7v10"/>
            <path d="M8 12l4 5 4-5"/>
            <path d="M5 17c1-1 2.5-1 4 0s2.5 1 4 0 2.5-1 4 0"/>
            <path d="M2 21c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>
          </svg>
        </motion.div>

        {/* 🏢 Bâtiment — Service onshore */}
        <motion.div
          animate={{ x: [0, 15, -15, 0], y: [0, -8, 8, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-6 w-[10rem] h-[10rem] text-slate-500/[0.05] dark:text-slate-400/[0.025] blur-[2px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <rect x="3" y="8" width="7" height="13" rx="0.5"/>
            <rect x="5" y="10" width="1.5" height="1.5"/>
            <rect x="7.5" y="10" width="1.5" height="1.5"/>
            <rect x="5" y="13" width="1.5" height="1.5"/>
            <rect x="7.5" y="13" width="1.5" height="1.5"/>
            <path d="M14 21V10l4-3 4 3v11"/>
            <rect x="16" y="13" width="2" height="2.5"/>
            <line x1="1" y1="21" x2="23" y2="21"/>
          </svg>
        </motion.div>

        {/* 🍽 Cloche — Cantine / Restauration */}
        <motion.div
          animate={{ y: [0, -12, 12, 0], rotate: [0, -1.5, 1.5, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-8 w-[13rem] h-[13rem] text-amber-500/[0.05] dark:text-amber-400/[0.025] blur-[2px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <path d="M6 18h12"/>
            <path d="M4 18c0-5 2-9 8-9s8 4 8 9"/>
            <line x1="12" y1="9" x2="12" y2="6"/>
            <circle cx="12" cy="5" r="1"/>
            <path d="M7 1v4c0 1 .5 2 1 2v5"/>
            <path d="M17 1v5c0 1-.5 1.5-1 1.5V12"/>
          </svg>
        </motion.div>

        {/* ⭐ Étoile — Salon VIP */}
        <motion.div
          animate={{ x: [0, -20, 20, 0], y: [0, 10, -10, 0] }}
          transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 right-1/3 w-[11rem] h-[11rem] text-purple-500/[0.05] dark:text-purple-400/[0.025] blur-[2px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            <path d="M5 20h14"/>
            <path d="M7 20v-3c0-.5.5-1 1-1h8c.5 0 1 .5 1 1v3"/>
          </svg>
        </motion.div>

        {/* Trajectoire de vol en pointillés */}
        <motion.div
          animate={{ opacity: [0.03, 0.05, 0.03] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 right-5 w-[20rem] h-[12rem] text-blue-500/[0.04] dark:text-blue-400/[0.02] blur-[1.5px]"
        >
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="3 3" className="w-full h-full">
            <path d="M10 85 Q 50 15 90 85" />
          </svg>
        </motion.div>
      </div>

      {/* Theme Toggle - top right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-6"
      >
        <Link 
          href="/" 
          className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-3.5 py-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </motion.div>

      {/* Main Card */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/5 border border-white/20 dark:border-slate-800/60 p-8 sm:p-10 relative z-10 transition-colors duration-300"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <CompanyLogo size="md" />
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Espace Administration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Sélectionnez votre rôle et connectez-vous
          </p>
        </motion.div>

        {/* Role Selector Card */}
        <motion.div variants={itemVariants} className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Votre rôle
          </label>
          
          <div className="relative grid grid-cols-3 gap-1 bg-slate-100/80 dark:bg-slate-950/60 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
            {(['rh', 'chef', 'dg'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setError(''); }}
                className={`relative py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center z-10 ${
                  selectedRole === role
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {selectedRole === role && (
                  <motion.div
                    layoutId="activeRoleBg"
                    className={`absolute inset-0 rounded-xl -z-10 ${
                      role === 'rh' ? 'bg-blue-600 shadow-md shadow-blue-500/20' :
                      role === 'chef' ? 'bg-emerald-600 shadow-md shadow-emerald-500/20' :
                      'bg-purple-600 shadow-md shadow-purple-500/20'
                    }`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {role === 'rh' ? 'RH' : role === 'chef' ? 'Chef' : 'DG'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 text-center font-medium flex items-center justify-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
            {roleLabels[selectedRole]}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Department selector for chef */}
          <AnimatePresence mode="wait">
            {selectedRole === 'chef' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Votre département *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-sm font-medium appearance-none"
                  >
                    <option value="">Sélectionnez votre département</option>
                    {SERVICES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password field */}
          <motion.div variants={itemVariants}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-11 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-xl"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Rester connecté (App)
          </label>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs py-2.5 px-4 rounded-xl text-center font-medium flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3.5 px-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              selectedRole === 'rh' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
              selectedRole === 'chef' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
              'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authentification...
              </span>
            ) : (
              `Se connecter`
            )}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-center text-slate-400 dark:text-slate-500 text-xs font-medium leading-relaxed">
            Le rôle détermine les demandes d'absence visibles et les actions de validation autorisées.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}