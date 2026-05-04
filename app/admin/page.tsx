'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import * as XLSX from 'xlsx';

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
  rhOpinion: { comment: string; date: string };
  adminResponse: string;
  createdAt: string;
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
  // Assuming time is "HH:MM" from input type="time"
  return time; // It's already in 24h format from the input
};

export default function AdminDashboard() {
  const router = useRouter();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [response, setResponse] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [period, setPeriod] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDept, setNewDept] = useState('');

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

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/absences');
      if (res.ok) {
        const data = await res.json();
        setAbsences(data);
      }
    } catch {
      console.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

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
      // fetch department id first
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
        body: JSON.stringify({ actionStatus: status, actionComment: response, role: userRole }),
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
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    if (status === 'pending_rh') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // Filter absences based on role and department
  const filteredAbsences = useMemo(() => {
    return absences.filter((abs) => {
      // Chef de Service: only see requests from their own department AND at pending_chef stage
      if (userRole === 'chef') {
        if (abs.employee.service !== userDepartment) return false;
        if (abs.status !== 'pending_chef') return false; // Only show what needs their action
      }
      // DG: only chef requests at pending_dg stage
      if (userRole === 'dg') {
        if (abs.requesterType !== 'chef_service') return false;
        if (abs.status !== 'pending_dg') return false;
      }
      // RH: see everything at pending_rh stage + all completed ones
      if (userRole === 'rh') {
        // Show pending_rh or finalized requests
        if (!['pending_rh', 'approved', 'rejected'].includes(abs.status)) return false;
      }

      // Search filter
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        abs.employee.email?.toLowerCase().includes(q) ||
        abs.employee.name?.toLowerCase().includes(q) ||
        abs.employee.firstName?.toLowerCase().includes(q) ||
        abs.matricule?.toLowerCase().includes(q)
      );
    });
  }, [absences, searchQuery, userRole, userDepartment]);

  const stats = useMemo(() => ({
    actionNeeded: filteredAbsences.filter(a => canApprove(a)).length,
    total: filteredAbsences.length,
    approved: filteredAbsences.filter(a => a.status === 'approved').length,
    rejected: filteredAbsences.filter(a => a.status === 'rejected').length,
  }), [filteredAbsences, absences]);

  // Helper to check if an absence falls in the selected period (based on createdAt or startDate)
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
  const roleBadgeColor = userRole === 'rh' ? 'bg-blue-100 text-blue-700' : userRole === 'chef' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700';

  if (!authenticated && loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Image
                src="https://abs-rh.lovable.app/assets/logo-doualair-BfWfygvc.png"
                alt="Logo"
                width={200}
                height={70}
                className="object-contain"
              />
              <span className="hidden sm:block text-slate-300">|</span>
              <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Tableau de bord
          {userRole === 'chef' && userDepartment && (
            <span className="ml-2 text-emerald-600">— Département {userDepartment}</span>
          )}
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-semibold text-orange-500 uppercase mb-1">Action requise</p>
            <p className="text-3xl font-bold text-slate-900">{stats.actionNeeded}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Total visible</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Approuvées</p>
            <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-semibold text-red-500 uppercase mb-1">Refusées</p>
            <p className="text-3xl font-bold text-slate-900">{stats.rejected}</p>
          </div>
        </div>

        {/* Period filter + quick period stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Période :</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="all">Toutes</option>
              <option value="day">Aujourd'hui</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>
          </div>

          {/* Departments management (admin) */}
          {userRole === 'rh' && (
            <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Gérer les départements</h3>
              <div className="flex gap-2 items-center">
                <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Nouveau département" className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1" />
                <button onClick={addDepartment} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">Ajouter</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {departments.map(d => (
                  <span key={d} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-sm">
                    {d}
                    <button onClick={() => deleteDepartment(d)} className="text-red-500 hover:text-red-700 text-xs px-1">Suppr</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase">Absences (période)</p>
              <p className="text-2xl font-bold text-slate-900">{periodStats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-emerald-500 uppercase">Approuvées</p>
              <p className="text-lg font-semibold text-emerald-700">{periodStats.approved}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-red-500 uppercase">Refusées</p>
              <p className="text-lg font-semibold text-red-700">{periodStats.rejected}</p>
            </div>

            {(userRole === 'rh' || userRole === 'chef' || userRole === 'dg') && (
              <button onClick={exportExcel} className="ml-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                Exporter Excel
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Rechercher nom, email, matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Demandeur</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Période</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400">Chargement...</td></tr>
                ) : filteredAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center text-slate-400">
                        <svg className="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        <p className="font-medium">Aucune demande à traiter</p>
                        <p className="text-xs mt-1">
                          {userRole === 'chef' ? `Aucune demande en attente dans le département ${userDepartment}` :
                           userRole === 'dg' ? 'Aucune demande de Chef de Service en attente' :
                           'Toutes les demandes ont été traitées'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.map((absence) => (
                    <tr key={absence._id} className={`bg-white hover:bg-slate-50 transition-colors ${canApprove(absence) ? 'border-l-2 border-l-orange-400' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{absence.employee.firstName} {absence.employee.name}</span>
                          <span className="text-xs text-slate-500">{absence.employee.service}</span>
                          <span className="text-xs font-mono text-slate-400">#{absence.matricule}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-700 capitalize">{absence.absence.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          {formatDate(absence.absence.startDate)} → {formatDate(absence.absence.endDate)}
                        </div>
                        {(absence.absence.startTime || absence.absence.endTime) && (
                          <div className="text-xs text-slate-500">
                            {absence.absence.startTime} - {absence.absence.endTime}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(absence.status)}`}>
                          {getStatusLabel(absence.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => { setSelectedAbsence(absence); setResponse(''); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              canApprove(absence)
                                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {canApprove(absence) ? '⚡ Traiter' : 'Voir'}
                          </button>

                          {userRole === 'rh' && (
                            <button
                              onClick={() => handleDelete(absence._id)}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAbsence && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Gestion de la demande</h3>
                  <p className="text-xs text-slate-500 font-mono">#{selectedAbsence.matricule}</p>
                </div>
                <div className="flex items-center gap-2">
                  {userRole === 'rh' && (
                    <button onClick={() => handleDelete(selectedAbsence._id)} className="text-red-600 hover:text-red-800 p-1" title="Supprimer la demande">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z" /></svg>
                    </button>
                  )}
                  <button onClick={() => setSelectedAbsence(null)} className="text-slate-400 hover:text-slate-600 p-1">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* Employee + request info */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-5 border-b border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Collaborateur</p>
                  <p className="font-bold text-slate-900">{selectedAbsence.employee.firstName} {selectedAbsence.employee.name}</p>
                  <p className="text-xs text-slate-500">{selectedAbsence.employee.service} · {selectedAbsence.employee.function}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{selectedAbsence.employee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Absence</p>
                  <p className="font-bold capitalize">{selectedAbsence.absence.type}</p>
                  <p className="text-xs text-slate-500">
                    Du {formatDate(selectedAbsence.absence.startDate)} au {formatDate(selectedAbsence.absence.endDate)}
                  </p>
                  {(selectedAbsence.absence.startTime || selectedAbsence.absence.endTime) && (
                    <p className="text-xs text-slate-500">
                      Heures : {selectedAbsence.absence.startTime} à {selectedAbsence.absence.endTime}
                    </p>
                  )}
                  {selectedAbsence.absence.reason && (
                    <p className="text-xs text-slate-500 italic mt-1">"{selectedAbsence.absence.reason}"</p>
                  )}
                </div>
              </div>

              {/* Approval chain */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 uppercase font-semibold mb-3">Chaîne d'approbation</p>
                <div className="space-y-2">
                  {selectedAbsence.requesterType === 'chef_service' ? (
                    <ApprovalRow
                      label="Direction Générale (DG)"
                      approval={selectedAbsence.dgApproval}
                    />
                  ) : (
                    <ApprovalRow
                      label="Chef de Service"
                      approval={selectedAbsence.chefApproval}
                    />
                  )}
                  <ApprovalRow
                    label="Ressources Humaines (RH)"
                    approval={
                      ['approved', 'rejected'].includes(selectedAbsence.status)
                        ? { status: selectedAbsence.status as any, comment: selectedAbsence.rhOpinion?.comment, date: selectedAbsence.rhOpinion?.date }
                        : null
                    }
                  />
                </div>
              </div>

              {/* Action area */}
              {canApprove(selectedAbsence) ? (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-800">Votre décision</p>
                  <textarea
                    placeholder="Commentaire (optionnel)..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-slate-50/50"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange(selectedAbsence._id, 'approved')}
                      disabled={actionLoading}
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      Donner mon accord
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAbsence._id, 'rejected')}
                      disabled={actionLoading}
                      className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      Refuser
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-slate-400 py-4 border-t border-slate-100 border-dashed">
                  Vous n'avez pas d'action à effectuer sur cette demande à ce stade.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalRow({ label, approval }: { label: string; approval: any }) {
  const isDone = approval?.status === 'approved' || approval?.status === 'rejected';
  const isApproved = approval?.status === 'approved';

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${isDone ? (isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-200'}`}>
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <div className="flex gap-2 items-center">
           {approval?.comment && <p className="text-xs text-slate-500 mt-0.5">{approval.comment}</p>}
           {approval?.date && <p className="text-[10px] text-slate-400 mt-0.5 italic">({formatDate(approval.date)})</p>}
        </div>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isDone ? (isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700') : 'bg-slate-200 text-slate-500'}`}>
        {isDone ? (isApproved ? '✓ ACCORDÉ' : '✗ REJETÉ') : '— EN ATTENTE'}
      </span>
    </div>
  );
}