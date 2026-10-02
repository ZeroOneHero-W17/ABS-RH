'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CompanyLogo } from '@/components/CompanyLogo';
import AdminPieChart from '@/components/AdminPieChart';
import { getServiceOptionsForSelect } from '@/lib/departmentCatalog';
import { 
  Bell, FileText, CheckCircle2, XCircle, Clock, 
  Search, FileSpreadsheet, Trash2, LogOut, Calendar, 
  User, Mail, ArrowRight, Shield, Check, X, Building,
  Briefcase, Plus, AlertCircle, Eye, RefreshCw
} from 'lucide-react';

interface Approval {
  status: 'approved' | 'rejected' | null;
  comment: string;
  date: string;
}

interface Absence {
  _id: string;
  matricule: string;
  employee: {
    name: string;
    firstName: string;
    email: string;
    service: string;
    function: string;
  };
  requesterType: 'employee' | 'chef_service';
  absence: {
    type: string;
    reason: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  status: 'pending_chef' | 'pending_dg' | 'pending_rh' | 'approved' | 'rejected';
  chefApproval: Approval;
  dgApproval: Approval;
  rhOpinion: Approval;
  adminResponse: string;
  aPayer?: boolean;
  retenir?: boolean;
  aPayerNote?: string;
  retenirNote?: string;
  createdAt: string;
  attachment?: string;
}

const formatDate = (date: string | Date | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (time: string | undefined) => {
  if (!time) return '';
  return time;
};

const playNotificationSound = async () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    // Resume context in case of suspended state (browser autoplay policy)
    try { await ctx.resume(); } catch (e) {}

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

    const duration = 5; // seconds
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);

    // Close context after finished to free resources
    setTimeout(() => {
      try { ctx.close(); } catch (e) {}
    }, (duration + 0.2) * 1000);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [response, setResponse] = useState('');
  const [rhAPayer, setRhAPayer] = useState(false);
  const [rhRetenir, setRhRetenir] = useState(false);
  const [rhAPayerNote, setRhAPayerNote] = useState('');
  const [rhRetenirNote, setRhRetenirNote] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [period, setPeriod] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDept, setNewDept] = useState('');
  const [selectedStatusCard, setSelectedStatusCard] = useState<'all' | 'actionNeeded' | 'approved' | 'rejected'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const previousActionNeeded = useRef(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAuthenticated(true);
          setUserRole(data.role);
          setUserDepartment(data.department);
          fetchAbsences();
          fetchDepartments();
        } else {
          router.push('/admin/login');
        }
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  };

  const fetchAbsences = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/absences');
      if (res.ok) {
        const data = await res.json();
        setAbsences(data);
      }
    } catch {
      console.error('Erreur chargement');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      fetchAbsences(false);
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [authenticated]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.map((d: any) => d.name));
      }
    } catch (err) {
      console.error('Erreur chargement départements', err);
    }
  };

  const addDepartment = async () => {
    const name = newDept.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (res.ok) {
        setNewDept('');
        fetchDepartments();
      } else {
        const j = await res.json();
        alert('Erreur création: ' + (j.error || res.status));
      }
    } catch (err) {
      console.error('Ajouter département failed', err);
    }
  };

  const deleteDepartment = async (name: string) => {
    if (!confirm(`Supprimer le département "${name}" ?`)) return;
    try {
      const all = await fetch('/api/departments');
      const list = await all.json();
      const doc = list.find((d: any) => d.name === name);
      if (!doc) return alert('Département introuvable');
      const res = await fetch(`/api/departments/${doc._id}`, { method: 'DELETE' });
      if (res.ok) fetchDepartments();
      else alert('Erreur suppression');
    } catch (err) {
      console.error('Erreur suppression département', err);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/absences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionStatus: status,
          actionComment: response,
          aPayer: rhAPayer,
          aPayerNote: rhAPayer ? rhAPayerNote : '',
          retenir: rhRetenir,
          retenirNote: rhRetenir ? rhRetenirNote : ''
        }),
      });
      if (res.ok) {
        fetchAbsences();
        setSelectedAbsence(null);
        setResponse('');
      }
    } catch {
      console.error('Erreur mise à jour');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;
    try {
      const res = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAbsences();
        if (selectedAbsence && selectedAbsence._id === id) setSelectedAbsence(null);
      } else {
        console.error('Erreur suppression', await res.text());
      }
    } catch (err) {
      console.error('Erreur suppression', err);
    }
  };

  const handlePurge = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement TOUTES les demandes terminées (approuvées ou refusées) ? Cette action est irréversible.")) return;
    try {
      const res = await fetch('/api/absences/purge', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.deletedCount} demande(s) supprimée(s) avec succès.`);
        await fetchAbsences();
        setSelectedAbsence(null);
      } else {
        console.error('Erreur purge', await res.text());
        alert('Erreur lors de la purge');
      }
    } catch (err) {
      console.error('Erreur purge', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const canApprove = (absence: Absence) => {
    if (userRole === 'chef' && absence.status === 'pending_chef') return true;
    if (userRole === 'dg' && absence.status === 'pending_dg') return true;
    if (userRole === 'rh' && absence.status === 'pending_rh') return true;
    return false;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_chef': return 'Attente Chef Service';
      case 'pending_dg': return 'Attente DG';
      case 'pending_rh': return 'Attente RH';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Refusé';
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    if (status === 'pending_rh') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  };

  // Merge catalog departments + DB departments + departments extracted from absences data
  const allDepartments = useMemo(() => {
    const catalogDepartments = getServiceOptionsForSelect();
    const fromAbsences = absences.map(a => a.employee.service).filter(Boolean);
    const merged = new Set([...catalogDepartments, ...departments, ...fromAbsences]);
    return Array.from(merged).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [departments, absences]);

  const filteredAbsences = useMemo(() => {
    return absences.filter((abs) => {
      if (userRole === 'chef') {
        if (abs.employee.service !== userDepartment) return false;
        if (abs.status !== 'pending_chef') return false;
      }
      if (userRole === 'dg') {
        if (!['pending_dg', 'approved', 'rejected'].includes(abs.status)) return false;
        if (selectedDept !== 'all' && abs.employee.service !== selectedDept) return false;
      }
      if (userRole === 'rh') {
        if (!['pending_rh', 'pending_dg', 'approved', 'rejected'].includes(abs.status)) return false;
        if (selectedDept !== 'all' && abs.employee.service !== selectedDept) return false;
      }

      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        abs.employee.email?.toLowerCase().includes(q) ||
        abs.employee.name?.toLowerCase().includes(q) ||
        abs.employee.firstName?.toLowerCase().includes(q) ||
        abs.matricule?.toLowerCase().includes(q)
      );
    });
  }, [absences, searchQuery, userRole, userDepartment, selectedDept]);

  const displayedAbsences = useMemo(() => {
    return filteredAbsences.filter((abs) => {
      if (selectedStatusCard === 'all') return true;
      if (selectedStatusCard === 'actionNeeded') return canApprove(abs);
      if (selectedStatusCard === 'approved') return abs.status === 'approved';
      if (selectedStatusCard === 'rejected') return abs.status === 'rejected';
      return true;
    });
  }, [filteredAbsences, selectedStatusCard]);

  const stats = useMemo(() => ({
    actionNeeded: filteredAbsences.filter(a => canApprove(a)).length,
    total: filteredAbsences.length,
    approved: filteredAbsences.filter(a => a.status === 'approved').length,
    rejected: filteredAbsences.filter(a => a.status === 'rejected').length,
  }), [filteredAbsences]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousActionNeeded.current = stats.actionNeeded;
      return;
    }

    if (stats.actionNeeded > previousActionNeeded.current) {
      playNotificationSound();
    }
    previousActionNeeded.current = stats.actionNeeded;
  }, [stats.actionNeeded]);

  const isInPeriod = (abs: Absence, p: string) => {
    if (p === 'all') return true;
    const d = abs.createdAt ? new Date(abs.createdAt) : new Date(abs.absence.startDate);
    const now = new Date();
    if (p === 'day') return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (p === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (p === 'year') return d.getFullYear() === now.getFullYear();
    return true;
  };

  const periodAbsences = useMemo(() => filteredAbsences.filter(a => isInPeriod(a, period)), [filteredAbsences, period]);

  const periodStats = useMemo(() => ({
    total: periodAbsences.length,
    approved: periodAbsences.filter(a => a.status === 'approved').length,
    rejected: periodAbsences.filter(a => a.status === 'rejected').length,
    actionNeeded: periodAbsences.filter(a => canApprove(a)).length,
  }), [periodAbsences]);

  // Initialiser les cases RH lorsque l'on ouvre une demande
  useEffect(() => {
    if (!selectedAbsence) {
      setRhAPayer(false);
      setRhRetenir(false);
      setRhAPayerNote('');
      setRhRetenirNote('');
      setResponse('');
      return;
    }
    setRhAPayer(!!selectedAbsence.aPayer);
    setRhRetenir(!!selectedAbsence.retenir);
    setRhAPayerNote(selectedAbsence.aPayerNote || '');
    setRhRetenirNote(selectedAbsence.retenirNote || '');
    setResponse(selectedAbsence.rhOpinion?.comment || '');
  }, [selectedAbsence]);

  const exportExcel = () => {
    try {
      const rows = periodAbsences.map(a => ({
        Matricule: a.matricule,
        Nom: a.employee.name,
        Prenom: a.employee.firstName,
        Email: a.employee.email,
        Service: a.employee.service,
        Type: a.absence.type,
        Motif: a.absence.reason || '',
        Debut: formatDate(a.absence.startDate),
        Fin: formatDate(a.absence.endDate),
        HeureDebut: formatTime(a.absence.startTime),
        HeureFin: formatTime(a.absence.endTime),
        Statut: getStatusLabel(a.status),
        CreatedAt: formatDate(a.createdAt),
      }));

      if (rows.length === 0) {
        alert('Aucune donnée à exporter pour la période sélectionnée.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Absences');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `absences_${period}_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel export failed', err);
      alert('Erreur lors de l\'export Excel');
    }
  };

  const roleLabel = userRole === 'rh' ? 'Ressources Humaines' : userRole === 'chef' ? `Chef — ${userDepartment}` : 'Direction Générale';
  const roleBadgeColor = userRole === 'rh' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30' : userRole === 'chef' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30' : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/30';

  if (!authenticated && loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-10 w-10 border-b-2 border-blue-600"
        />
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen font-sans pb-10 relative overflow-hidden">
      
      {/* Fond de page dégradé avec transition douce (cross-fade) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 z-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-700 z-0" />
      
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-300/10 via-sky-200/5 to-transparent dark:from-blue-600/5 dark:via-sky-500/2 dark:to-transparent blur-3xl"
        />

        {/* Layered floating shapes for depth and motion */}
        <motion.div
          animate={{ x: [0, -30, 30, 0], y: [0, -20, 20, 0], rotate: [0, 360] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-6 w-28 h-28 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/10 blur-2xl"
        />

        <motion.div
          animate={{ scale: [0.9, 1.08, 0.9], x: [0, 20, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-24 w-36 h-36 rounded-full bg-amber-300/12 dark:bg-amber-400/8 blur-2xl"
        />

        {/* Subtle moving radial overlay for color dynamics */}
        <motion.div
          animate={{ x: [0, -20, 20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 18% 28%, rgba(99,102,241,0.06), transparent 14%), radial-gradient(circle at 82% 72%, rgba(14,165,233,0.05), transparent 18%)'
          }}
        />

        {/* Small floating particles */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, -20, 0], opacity: [0.9, 0.2, 0.9] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-24 left-1/3 w-6 h-6 rounded-full bg-white/70 dark:bg-white/10 blur-sm"
        />

        <motion.div
          animate={{ y: [0, -18, 12, 0], x: [0, -14, 14, 0], opacity: [0.8, 0.15, 0.8] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-40 right-40 w-8 h-8 rounded-full bg-purple-400/14 blur-sm"
        />


        {/* ✈ Avion — Service aérien */}
        <motion.div
          animate={{ x: [0, 50, -50, 0], y: [0, -20, 30, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-10 w-[18rem] h-[18rem] text-blue-500/[0.08] dark:text-blue-450/[0.05] drop-shadow-[0_0_25px_rgba(59,130,246,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
          </svg>
        </motion.div>

        {/* ⚓ Ancre & vagues — Service offshore */}
        <motion.div
          animate={{ y: [0, 14, -14, 0], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 33, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 right-12 w-[14rem] h-[14rem] text-cyan-500/[0.08] dark:text-cyan-400/[0.05] drop-shadow-[0_0_25px_rgba(6,182,212,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
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
          animate={{ x: [0, 25, -25, 0], y: [0, -12, 12, 0] }}
          transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-2/3 left-1/4 w-[12rem] h-[12rem] text-slate-500/[0.08] dark:text-slate-400/[0.05] drop-shadow-[0_0_25px_rgba(100,116,139,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
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

        {/* 🍽 Cloche & couverts — Cantine / Restauration */}
        <motion.div
          animate={{ y: [0, -18, 18, 0], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[16rem] h-[16rem] text-amber-500/[0.08] dark:text-amber-400/[0.05] drop-shadow-[0_0_25px_rgba(245,158,11,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
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

        {/* ⭐ Étoile & fauteuil — Salon VIP */}
        <motion.div
          animate={{ x: [0, -30, 30, 0], y: [0, 10, -10, 0], rotate: [0, 1.5, -1.5, 0] }}
          transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-2/3 w-[13rem] h-[13rem] text-purple-500/[0.08] dark:text-purple-400/[0.05] drop-shadow-[0_0_25px_rgba(168,85,247,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            <path d="M5 20h14"/>
            <path d="M7 20v-3c0-.5.5-1 1-1h8c.5 0 1 .5 1 1v3"/>
          </svg>
        </motion.div>

        {/* Second avion incliné */}
        <motion.div
          animate={{ x: [0, -30, 30, 0], y: [0, 20, -15, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-48 right-20 w-[12rem] h-[12rem] text-indigo-500/[0.08] dark:text-indigo-400/[0.05] drop-shadow-[0_0_25px_rgba(99,102,241,0.15)] filter blur-[0.5px] transition-all duration-500 hover:scale-105 hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full transform -rotate-45">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z"/>
          </svg>
        </motion.div>

        {/* Trajectoire de vol en pointillés */}
        <motion.div
          animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.02, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/4 w-[40rem] h-[20rem] text-blue-500/[0.08] dark:text-blue-400/[0.04] filter blur-[0.5px]"
        >
          <svg viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="4 4" className="w-full h-full">
            <path d="M10 80 Q 60 10 120 50 T 190 20" />
            <path d="M20 90 Q 70 30 130 55 T 195 30" />
          </svg>
        </motion.div>

        {/* Additional dynamic favicons */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-12 right-12 w-20 h-20 text-blue-400/[0.12] dark:text-blue-400/[0.08] drop-shadow-[0_0_15px_rgba(96,165,250,0.15)] filter blur-[0.5px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" className="w-full h-full">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v6l3 3" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ scale: [0.92, 1.06, 0.92], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-28 left-14 w-24 h-24 text-amber-400/[0.12] dark:text-amber-300/[0.08] drop-shadow-[0_0_15px_rgba(251,191,36,0.15)] filter blur-[0.5px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" className="w-full h-full">
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8 12h8" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ x: [0, -50, 50, 0], y: [0, 30, -30, 0], rotate: [0, 360, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-16 left-16 w-28 h-28 text-purple-400/[0.06] dark:text-purple-300/[0.03] blur-[1px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="w-full h-full">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </motion.div>
      </div>

      {/* Navbar with glassmorphism */}
      <nav className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-30 w-full transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <CompanyLogo size="sm" className="hover:scale-[1.02] transition-transform duration-300" />
              <span className="hidden sm:block text-slate-200 dark:text-slate-800">|</span>
              <ThemeToggle />
              <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${roleBadgeColor}`}>
                {roleLabel}
              </span>
              
              {/* Notification Bell with swing animation */}
              <div className="relative flex items-center justify-center cursor-pointer p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                <motion.div
                  whileHover={{ rotate: [0, -15, 15, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
                </motion.div>
                {stats.actionNeeded > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 px-3.5 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center gap-1.5 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
        
        {/* Welcome Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-100 border border-white/10 mb-3">
              <Building className="w-3.5 h-3.5" />
              {roleLabel}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tableau de bord de gestion
            </h1>
            <p className="text-blue-100/80 text-sm mt-1">
              {userRole === 'chef' && userDepartment 
                ? `Gestion des demandes d'absence du département ${userDepartment}.`
                : "Consultez, filtrez et validez les demandes d'absence des collaborateurs."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fetchAbsences(true)}
              className="px-4 py-2.5 bg-blue-500/25 hover:bg-blue-500/40 border border-blue-400/30 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4" />
              Rafraîchir
            </button>
            {(userRole === 'rh' || userRole === 'chef' || userRole === 'dg') && (
              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportExcel} 
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-50 shadow-md rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
                Exporter Excel
              </motion.button>
            )}
            {(userRole === 'rh' || userRole === 'dg') && (
              <motion.button 
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePurge} 
                className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white shadow-md rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4.5 h-4.5" />
                Purger terminées
              </motion.button>
            )}
            {userRole === 'rh' && (
              <motion.button 
                onClick={() => router.push('/admin/employes')}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                Gérer Employés
              </motion.button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }} 
            onClick={() => setSelectedStatusCard(selectedStatusCard === 'actionNeeded' ? 'all' : 'actionNeeded')}
            className={`backdrop-blur-md rounded-2xl p-5 transition-all relative overflow-hidden cursor-pointer select-none border ${
              selectedStatusCard === 'actionNeeded'
                ? 'bg-orange-500/10 dark:bg-orange-500/5 border-orange-500 shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/20'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-600/50 hover:shadow-md'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
            <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Action requise
            </p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.actionNeeded}</p>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }} 
            onClick={() => setSelectedStatusCard('all')}
            className={`backdrop-blur-md rounded-2xl p-5 transition-all relative overflow-hidden cursor-pointer select-none border ${
              selectedStatusCard === 'all'
                ? 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-500 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600/50 hover:shadow-md'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total visible</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }} 
            onClick={() => setSelectedStatusCard(selectedStatusCard === 'approved' ? 'all' : 'approved')}
            className={`backdrop-blur-md rounded-2xl p-5 transition-all relative overflow-hidden cursor-pointer select-none border ${
              selectedStatusCard === 'approved'
                ? 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600/50 hover:shadow-md'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Approuvées</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.approved}</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }} 
            onClick={() => setSelectedStatusCard(selectedStatusCard === 'rejected' ? 'all' : 'rejected')}
            className={`backdrop-blur-md rounded-2xl p-5 transition-all relative overflow-hidden cursor-pointer select-none border ${
              selectedStatusCard === 'rejected'
                ? 'bg-red-500/10 dark:bg-red-500/5 border-red-500 shadow-lg shadow-red-500/10 ring-2 ring-red-500/20'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-600/50 hover:shadow-md'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Refusées</p>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.rejected}</p>
          </motion.div>
        </div>

        {userRole === 'rh' && <AdminPieChart absences={absences} />}

        {/* Filters and Management */}
        <div className="flex flex-col xl:flex-row gap-6 mb-8">
          
          {/* Main Filters box */}
          <div className="flex-1 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Période :</label>
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value as any)} 
                  className="border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                >
                  <option value="all">Toutes les demandes</option>
                  <option value="day">Aujourd'hui</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>

              {(userRole === 'rh' || userRole === 'dg') && (
                <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Département :</label>
                  <div className="w-full sm:w-auto">
                    <select 
                      value={selectedDept} 
                      onChange={(e) => setSelectedDept(e.target.value)} 
                      className="w-full sm:w-auto border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    >
                      <option value="all">Tous les départements</option>
                      {allDepartments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center sm:text-right">
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Absences Période</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{periodStats.total}</p>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
              <div className="text-center sm:text-right">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Approuvées</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{periodStats.approved}</p>
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
              <div className="text-center sm:text-right">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Refusées</p>
                <p className="text-lg font-bold text-red-650 dark:text-red-400">{periodStats.rejected}</p>
              </div>
            </div>
          </div>

          {/* Departments management (admin only) */}
          {userRole === 'rh' && (
            <div className="w-full xl:w-96 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/50 dark:border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-500" />
                Gérer les départements
              </h3>
              <div className="flex gap-2 items-center">
                <input 
                  value={newDept} 
                  onChange={(e) => setNewDept(e.target.value)} 
                  placeholder="Nouveau département..." 
                  className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 dark:text-white rounded-xl px-3.5 py-2 text-sm flex-1 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
                />
                <button 
                  onClick={addDepartment} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
              
              {/* Dept tags */}
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {departments.map(d => (
                  <span key={d} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 dark:text-slate-300 rounded-lg pl-2.5 pr-1 py-1 text-xs font-medium transition-colors">
                    {d}
                    <button 
                      onClick={() => deleteDepartment(d)} 
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                      title="Supprimer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Requests Table Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/50 dark:border-slate-800 overflow-hidden transition-all duration-300"
        >
          {/* Table Search Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Rechercher nom, email, matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            
            <div className="flex flex-col sm:items-end gap-1">
              <p className="text-xs font-semibold text-slate-400">
                {selectedStatusCard === 'all' 
                  ? `${filteredAbsences.length} demande(s) au total` 
                  : `${displayedAbsences.length} demande(s) affichée(s) sur ${filteredAbsences.length}`}
              </p>
              {selectedStatusCard !== 'all' && (
                <button
                  onClick={() => setSelectedStatusCard('all')}
                  className="text-[10px] text-blue-600 hover:text-blue-755 dark:text-blue-400 dark:hover:text-blue-300 font-bold underline transition-colors"
                >
                  Réinitialiser le filtre de carte
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Collaborateur</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Type d'absence</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-b-2 border-blue-500 rounded-full" />
                        <span className="text-xs font-semibold">Chargement des données...</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="flex flex-col items-center text-slate-400 max-w-sm mx-auto">
                        <motion.div 
                          initial={{ scale: 0.8 }} 
                          animate={{ scale: 1 }} 
                          className="w-12 h-12 mb-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center text-slate-400 dark:text-slate-505"
                        >
                          <FileText className="w-6 h-6" />
                        </motion.div>
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-350">Aucune demande affichée</p>
                        <p className="text-xs mt-1 text-slate-500 leading-relaxed">
                          {selectedStatusCard !== 'all' 
                            ? "Aucune demande ne correspond à ce filtre de statut."
                            : userRole === 'chef' 
                              ? `Aucune demande en attente dans le département ${userDepartment}` 
                              : userRole === 'dg' 
                                ? 'Aucune demande de Chef de Service en attente' 
                                : 'Toutes les demandes ont été traitées'}
                        </p>
                        {selectedStatusCard !== 'all' && (
                          <button
                            onClick={() => setSelectedStatusCard('all')}
                            className="mt-3 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 text-xs font-bold rounded-lg transition-colors"
                          >
                            Afficher tout
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedAbsences.map((absence, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      key={absence._id} 
                      className={`bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors border-b border-slate-100 dark:border-slate-850 ${
                        canApprove(absence) ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white transition-colors duration-300">
                            {absence.employee.firstName} {absence.employee.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                            {absence.employee.service} · {absence.employee.function || 'Collaborateur'}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-slate-400 mt-1">
                            MATRICULE : #{absence.matricule}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300 capitalize font-medium">
                          {absence.absence.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                          {formatDate(absence.absence.startDate)} <span className="text-slate-300 dark:text-slate-700 font-normal">→</span> {formatDate(absence.absence.endDate)}
                        </div>
                        {(absence.absence.startTime || absence.absence.endTime) && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {absence.absence.startTime || '--:--'} - {absence.absence.endTime || '--:--'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(absence.status)}`}>
                          {absence.status === 'approved' && <Check className="w-3 h-3" />}
                          {absence.status === 'rejected' && <X className="w-3 h-3" />}
                          {['pending_chef', 'pending_dg', 'pending_rh'].includes(absence.status) && <Clock className="w-3 h-3 animate-pulse" />}
                          {getStatusLabel(absence.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => { setSelectedAbsence(absence); setResponse(''); }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                              canApprove(absence)
                                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100/70 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800'
                            }`}
                          >
                            {canApprove(absence) ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-orange-500" />
                                ⚡ Traiter
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                Consulter
                              </>
                            )}
                          </button>

                          {userRole === 'rh' && (
                            <button
                              onClick={() => handleDelete(absence._id)}
                              className="p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 transition-all"
                              title="Supprimer la demande"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>

      {/* Modal with clean backdrop blur and scaling entrance */}
      <AnimatePresence>
        {selectedAbsence && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAbsence(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Détails de la demande</h3>
                  <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">MATRICULE : #{selectedAbsence.matricule}</p>
                </div>
                <div className="flex items-center gap-2">
                  {userRole === 'rh' && (
                    <button 
                      onClick={() => handleDelete(selectedAbsence._id)} 
                      className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                      title="Supprimer la demande"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedAbsence(null)} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
                
                {/* Information cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Collaborateur */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Collaborateur</p>
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedAbsence.employee.firstName[0]}{selectedAbsence.employee.name[0]}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {selectedAbsence.employee.firstName} {selectedAbsence.employee.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5 truncate">
                          {selectedAbsence.employee.service} · {selectedAbsence.employee.function || 'Collaborateur'}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 truncate">
                          {selectedAbsence.employee.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Absence details */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type d'absence</p>
                      <p className="font-bold text-sm text-slate-900 dark:text-white capitalize mt-0.5">
                        {selectedAbsence.absence.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dates & Horaires</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                        Du {formatDate(selectedAbsence.absence.startDate)} au {formatDate(selectedAbsence.absence.endDate)}
                      </p>
                      {(selectedAbsence.absence.startTime || selectedAbsence.absence.endTime) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          De {selectedAbsence.absence.startTime || '--:--'} à {selectedAbsence.absence.endTime || '--:--'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Motif détaillé */}
                {selectedAbsence.absence.reason && (
                  <div className="p-4 bg-slate-50/30 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motif explicatif</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                      "{selectedAbsence.absence.reason}"
                    </p>
                  </div>
                )}

                {/* Pièce jointe */}
                {selectedAbsence.attachment && (
                  <div className="p-4 bg-blue-50/15 dark:bg-blue-950/10 border border-blue-100/30 dark:border-blue-900/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-300">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <div className="truncate text-xs font-semibold">
                        Document justificatif fourni
                      </div>
                    </div>
                    <a 
                      href={selectedAbsence.attachment} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir le document
                    </a>
                  </div>
                )}

                {/* timeline / approval workflow */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Chaîne d'approbation et statut
                  </p>
                  
                  <div className="space-y-3.5">
                    {selectedAbsence.requesterType === 'chef_service' ? (
                      <ApprovalRow
                        label="Direction Générale (DG)"
                        approval={selectedAbsence.dgApproval}
                      />
                    ) : (
                      <ApprovalRow
                        label="Validation Chef de Service"
                        approval={selectedAbsence.chefApproval}
                      />
                    )}
                    
                    <ApprovalRow
                      label="Opinion Ressources Humaines (RH)"
                      approval={selectedAbsence.rhOpinion}
                    />
                  </div>
                </div>

                {/* Action buttons (Approve/Reject) */}
                {canApprove(selectedAbsence) ? (
                  <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-850">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Prendre une décision</p>
                      <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">Votre choix sera consigné dans le suivi de la demande.</p>
                    </div>
                    
                    <textarea
                      placeholder="Ajouter un commentaire explicatif (optionnel)..."
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none bg-slate-50/50 dark:bg-slate-950/30 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-650"
                      rows={3}
                    />
                    {userRole === 'rh' && (
                      <div className="mt-3">
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={rhAPayer} onChange={(e) => setRhAPayer(e.target.checked)} className="w-4 h-4 rounded border-slate-200 dark:border-slate-800" />
                            <span className="font-semibold">A PAYER</span>
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={rhRetenir} onChange={(e) => setRhRetenir(e.target.checked)} className="w-4 h-4 rounded border-slate-200 dark:border-slate-800" />
                            <span className="font-semibold">RETENIR</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {rhAPayer && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Note — A PAYER</label>
                              <textarea
                                placeholder="Note pour A PAYER (optionnel)"
                                value={rhAPayerNote}
                                onChange={(e) => setRhAPayerNote(e.target.value)}
                                rows={2}
                                className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl p-2 text-sm bg-slate-50/50 dark:bg-slate-950/30 dark:text-white placeholder:text-slate-400"
                              />
                            </div>
                          )}

                          {rhRetenir && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Note — RETENIR</label>
                              <textarea
                                placeholder="Note pour RETENIR (optionnel)"
                                value={rhRetenirNote}
                                onChange={(e) => setRhRetenirNote(e.target.value)}
                                rows={2}
                                className="w-full border border-slate-200 dark:border-slate-800 rounded-2xl p-2 text-sm bg-slate-50/50 dark:bg-slate-950/30 dark:text-white placeholder:text-slate-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleStatusChange(selectedAbsence._id, 'approved')}
                        disabled={actionLoading}
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        Donner mon accord
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedAbsence._id, 'rejected')}
                        disabled={actionLoading}
                        className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/10 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        Refuser la demande
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-4.5 border-t border-slate-100 dark:border-slate-800 border-dashed flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Aucune action requise à votre niveau à ce stade.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApprovalRow({ label, approval }: { label: string; approval: any }) {
  const isDone = approval?.status === 'approved' || approval?.status === 'rejected';
  const isApproved = approval?.status === 'approved';

  return (
    <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
      isDone 
        ? isApproved 
          ? 'bg-emerald-50/45 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300' 
          : 'bg-red-50/45 border-red-200 dark:bg-red-950/10 dark:border-red-900/40 text-red-900 dark:text-red-300' 
        : 'bg-slate-50/45 border-slate-200/60 dark:bg-slate-950/20 dark:border-slate-800 text-slate-700 dark:text-slate-400'
    }`}>
      <div className="truncate pr-4">
        <span className="text-xs font-bold uppercase tracking-wider block text-slate-400 dark:text-slate-500">{label}</span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
          {isDone ? (
            <>
              {approval.comment ? (
                <p className="text-xs font-semibold italic text-slate-700 dark:text-slate-300">"{approval.comment}"</p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Aucun commentaire</p>
              )}
              {approval.date && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
                  · {formatDate(approval.date)}
                </span>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold italic">En attente de traitement</p>
          )}
        </div>
      </div>
      
      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl shrink-0 border uppercase tracking-wider ${
        isDone 
          ? isApproved 
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' 
            : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30' 
          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-500 dark:border-slate-800'
      }`}>
        {isDone ? (isApproved ? 'Accordé' : 'Refusé') : 'En attente'}
      </span>
    </div>
  );
}