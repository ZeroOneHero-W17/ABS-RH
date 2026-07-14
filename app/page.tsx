'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CompanyLogo } from '@/components/CompanyLogo';
import { getServiceOptionsForSelect } from '@/lib/departmentCatalog';
import { 
  User, Mail, Briefcase, Calendar, Clock, FileText, 
  UploadCloud, Paperclip, Trash2, Send, CheckCircle2, 
  AlertCircle, Shield, HelpCircle
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    email: '',
    service: '',
    requesterType: 'employee',
    function: '',
    type: '',
    reason: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const services = getServiceOptionsForSelect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (attachment) {
      data.append('attachment', attachment);
    }

    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        body: data,
      });

      if (res.ok) {
        const result = await res.json();
        setMessage(`Demande soumise avec succès. Matricule: ${result.matricule}`);
        setFormData({
          name: '',
          firstName: '',
          email: '',
          service: '',
          requesterType: 'employee',
          function: '',
          type: '',
          reason: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
        });
        setAttachment(null);
      } else {
        const err = await res.json().catch(() => ({}));
        setMessage(`Erreur: ${err.details || err.error || 'Erreur lors de la soumission'}`);
      }
    } catch (error) {
      setMessage('Erreur réseau - vérifiez que le serveur est démarré');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculer le nombre de jours
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
      return diffDays;
    }
    return 0;
  };

  // Calculer le nombre d'heures
  const calculateHours = () => {
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;
      const diffMin = endTotalMin - startTotalMin;
      const hours = Math.ceil(diffMin / 60);
      return hours > 0 ? hours : 0;
    }
    return 0;
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Fond de page dégradé avec transition douce (cross-fade) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-700 z-0" />
      
      {/* Orbes animés décoratifs (Thème aviation/ciel) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-sky-300/10 to-transparent dark:from-blue-600/10 dark:via-sky-500/5 dark:to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 60, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-400/15 via-purple-300/10 to-transparent dark:from-indigo-600/10 dark:via-purple-500/5 dark:to-transparent blur-3xl"
        />

        {/* ✈ Avion — Service aérien */}
        <motion.div
          animate={{ x: [0, 40, -40, 0], y: [0, -30, 20, 0], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 right-8 w-[22rem] h-[22rem] text-blue-500/[0.09] dark:text-blue-400/[0.05] drop-shadow-[0_0_25px_rgba(59,130,246,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
          </svg>
        </motion.div>

        {/* ⚓ Ancre & vagues — Service offshore */}
        <motion.div
          animate={{ y: [0, 12, -12, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-36 right-16 w-[16rem] h-[16rem] text-cyan-500/[0.09] dark:text-cyan-400/[0.05] drop-shadow-[0_0_25px_rgba(6,182,212,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            {/* Ancre */}
            <circle cx="12" cy="5" r="2"/>
            <path d="M12 7v10"/>
            <path d="M8 12l4 5 4-5"/>
            <path d="M5 17c1-1 2.5-1 4 0s2.5 1 4 0 2.5-1 4 0"/>
            {/* Vagues en bas */}
            <path d="M2 21c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/>
          </svg>
        </motion.div>

        {/* 🏢 Bâtiment & route — Service onshore */}
        <motion.div
          animate={{ x: [0, 20, -20, 0], y: [0, -10, 10, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-4 w-[14rem] h-[14rem] text-slate-500/[0.09] dark:text-slate-400/[0.05] drop-shadow-[0_0_25px_rgba(100,116,139,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            {/* Bâtiment industriel */}
            <rect x="3" y="8" width="7" height="13" rx="0.5"/>
            <rect x="5" y="10" width="1.5" height="1.5"/>
            <rect x="7.5" y="10" width="1.5" height="1.5"/>
            <rect x="5" y="13" width="1.5" height="1.5"/>
            <rect x="7.5" y="13" width="1.5" height="1.5"/>
            {/* Entrepôt */}
            <path d="M14 21V10l4-3 4 3v11"/>
            <rect x="16" y="13" width="2" height="2.5"/>
            {/* Sol / route */}
            <line x1="1" y1="21" x2="23" y2="21"/>
          </svg>
        </motion.div>

        {/* 🍽 Couverts & cloche — Cantine / Restauration */}
        <motion.div
          animate={{ y: [0, -15, 15, 0], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-1/3 w-[18rem] h-[18rem] text-amber-500/[0.09] dark:text-amber-400/[0.05] drop-shadow-[0_0_25px_rgba(245,158,11,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            {/* Cloche de service */}
            <path d="M6 18h12"/>
            <path d="M4 18c0-5 2-9 8-9s8 4 8 9"/>
            <line x1="12" y1="9" x2="12" y2="6"/>
            <circle cx="12" cy="5" r="1"/>
            {/* Fourchette à gauche */}
            <path d="M7 1v4c0 1 .5 2 1 2v5"/>
            {/* Couteau à droite */}
            <path d="M17 1v5c0 1-.5 1.5-1 1.5V12"/>
          </svg>
        </motion.div>

        {/* ⭐ Étoile & fauteuil — Salon VIP */}
        <motion.div
          animate={{ x: [0, -25, 25, 0], y: [0, 15, -15, 0], rotate: [0, 1, -1, 0] }}
          transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 w-[16rem] h-[16rem] text-purple-500/[0.09] dark:text-purple-400/[0.05] drop-shadow-[0_0_25px_rgba(168,85,247,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            {/* Étoile VIP */}
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            {/* Fauteuil confort */}
            <path d="M5 20h14"/>
            <path d="M7 20v-3c0-.5.5-1 1-1h8c.5 0 1 .5 1 1v3"/>
          </svg>
        </motion.div>

        {/* Trajectoire de vol en pointillés */}
        <motion.div
          animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.03, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-5 w-[32rem] h-[20rem] text-blue-500/[0.08] dark:text-blue-400/[0.04] filter blur-[0.5px]"
        >
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="3 3" className="w-full h-full">
            <path d="M10 85 Q 50 15 90 85" />
            <path d="M20 85 Q 50 25 80 85" />
          </svg>
        </motion.div>
      </div>

      {/* Top Header Controls */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 relative z-10">
        <ThemeToggle />
        <Link 
          href="/admin/login" 
          className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-3.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all flex items-center gap-1.5 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
        >
          <Shield className="w-4 h-4" />
          Administration
        </Link>
      </div>

      {/* Main Glassmorphic Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-2xl shadow-blue-500/5 border border-white/20 dark:border-slate-800/60 rounded-3xl overflow-hidden transition-colors duration-300 relative z-10"
      >
        <div className="p-6 sm:p-10 md:p-12">
          {/* Logo & Banner */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <CompanyLogo size="lg" className="hover:scale-[1.02] transition-transform duration-300" />
          </motion.div>
          
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Portail Collaborateurs Doualair
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight transition-colors duration-300">
              Demande d'autorisation d'absence
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm transition-colors duration-300">
              Veuillez remplir le formulaire ci-dessous pour soumettre votre demande d'absence.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Type de demandeur */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-50/20 dark:bg-blue-950/10 p-5 rounded-2xl border border-blue-100/40 dark:border-blue-900/20"
            >
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3.5 text-center">
                Vous êtes :
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setFormData({ ...formData, requesterType: 'employee' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                    formData.requesterType === 'employee'
                      ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-md shadow-blue-500/5 text-blue-900 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl transition-colors ${formData.requesterType === 'employee' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm">Employé</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Pour les agents et collaborateurs</p>
                  </div>
                  {formData.requesterType === 'employee' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setFormData({ ...formData, requesterType: 'chef_service' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${
                    formData.requesterType === 'chef_service'
                      ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-md shadow-blue-500/5 text-blue-900 dark:text-blue-100'
                      : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl transition-colors ${formData.requesterType === 'chef_service' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm">Chef de Service</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Pour les responsables d'équipe</p>
                  </div>
                  {formData.requesterType === 'chef_service' && (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Informations personnelles */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <User className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors duration-300">
                  Informations personnelles
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                {/* Nom */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nom *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      placeholder="Votre nom" 
                    />
                  </div>
                </div>

                {/* Prénom */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Prénom *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      name="firstName" 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      required 
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      placeholder="Votre prénom" 
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="sm:col-span-2 relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email professionnel *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      placeholder="prenom.nom@doualair.com" 
                    />
                  </div>
                </div>

                {/* Service */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Service *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <select 
                      name="service" 
                      value={formData.service} 
                      onChange={handleChange} 
                      required 
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium appearance-none"
                    >
                      <option value="">Sélectionnez un service</option>
                      {services.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Fonction */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Fonction</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      name="function" 
                      value={formData.function} 
                      onChange={handleChange} 
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      placeholder="Ex: Hôtesse, Agent d'escale..." 
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Détails de l'absence */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors duration-300">
                  Détails de l'absence
                </h2>
              </div>
              
              <div className="space-y-5">
                {/* Type d'absence */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Type d'absence *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleChange} 
                      required 
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium appearance-none"
                    >
                      <option value="">Sélectionnez un motif</option>
                      <option value="congé annuel">Congé annuel</option>
                      <option value="congé maladie">Congé maladie</option>
                      <option value="congé maternité">Congé maternité</option>
                      <option value="autre">Autre</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                {/* Motif */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Motif détaillé</label>
                  <textarea 
                    name="reason" 
                    value={formData.reason} 
                    onChange={handleChange} 
                    rows={3} 
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm resize-none font-medium" 
                    placeholder="Précisez la raison de votre absence..." 
                  />
                </div>

                {/* Dates de début et fin */}
                <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date de début *</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="startDate" 
                        value={formData.startDate} 
                        onChange={handleChange} 
                        required 
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date de fin *</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="endDate" 
                        value={formData.endDate} 
                        onChange={handleChange} 
                        required 
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>

                  {/* Estimation Jours */}
                  {formData.startDate && formData.endDate && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="sm:col-span-2 px-4 py-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-between"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2.5 font-medium">
                        <Calendar className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
                        Durée estimée :
                      </p>
                      <span className="text-xs font-bold px-3 py-1 bg-blue-600 text-white rounded-full shadow-md shadow-blue-500/10">
                        {calculateDays()} jour(s)
                      </span>
                    </motion.div>
                  )}

                  {/* Heures début et fin */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Heure de début</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        name="startTime" 
                        value={formData.startTime} 
                        onChange={handleChange} 
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Heure de fin</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        name="endTime" 
                        value={formData.endTime} 
                        onChange={handleChange} 
                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>

                  {/* Estimation Heures */}
                  {formData.startTime && formData.endTime && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="sm:col-span-2 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-955/30 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-between"
                    >
                      <p className="text-sm text-indigo-800 dark:text-indigo-300 flex items-center gap-2.5 font-medium">
                        <Clock className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                        Volume horaire estimé :
                      </p>
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-600 text-white rounded-full shadow-md shadow-indigo-500/10">
                        {calculateHours()} heure(s)
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Pièce jointe */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 transition-colors duration-300">
                  Document justificatif
                </h2>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pièce jointe (facultatif)</label>
                
                <div 
                  className="group relative flex flex-col items-center justify-center px-6 py-8 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-2xl bg-slate-50/20 dark:bg-slate-950/10 hover:bg-slate-50/50 dark:hover:bg-slate-950/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer text-center"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    accept=".pdf,image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 12 * 1024 * 1024) {
                        alert("Le fichier est trop volumineux (12 Mo maximum).");
                        e.target.value = '';
                        setAttachment(null);
                      } else {
                        setAttachment(file || null);
                      }
                    }} 
                  />
                  <div className="space-y-2">
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400"
                    >
                      <UploadCloud className="w-6 h-6" />
                    </motion.div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                      <span className="text-blue-600 dark:text-blue-400 hover:underline">Téléchargez un fichier</span> ou glissez-déposez
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">PDF, PNG, JPG jusqu'à 12 Mo</p>
                  </div>
                </div>
                
                <AnimatePresence>
                  {attachment && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-medium truncate pr-4">
                        <Paperclip className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span className="truncate">{attachment.name}</span>
                        <span className="text-xs text-slate-400 font-normal">({(attachment.size / (1024 * 1024)).toFixed(2)} Mo)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachment(null);
                          const input = document.getElementById('file-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Bouton d'envoi */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-5 border-t border-slate-100 dark:border-slate-800/80 transition-colors duration-300"
            >
              <motion.button 
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/10 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Soumission en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Soumettre la demande
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Messages de retour */}
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
                  message.includes('succès') 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {message.includes('succès') ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {message.includes('succès') ? 'Opération réussie' : 'Une erreur est survenue'}
                  </p>
                  <p className="text-xs mt-0.5 opacity-90">{message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}