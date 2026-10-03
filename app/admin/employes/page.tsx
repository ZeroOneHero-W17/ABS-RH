'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Building, Briefcase, KeyRound, Lock, Mail, Pencil, Plus,
  RefreshCw, Search, Shield, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CompanyLogo } from '@/components/CompanyLogo';

interface Employee {
  _id: string;
  name?: string;
  firstName?: string;
  email: string;
  department?: string;
  matricule?: string;
  createdAt?: string;
}

type Notice = { type: 'success' | 'error'; text: string } | null;

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950';

export default function ManageEmployees() {
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    email: '',
    password: '',
    department: '',
    matricule: '',
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'create'>('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<Notice>(null);
  const [listError, setListError] = useState('');

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    setListError('');
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (!response.ok) {
        setListError(data.error || 'Impossible de charger les comptes employés.');
        return;
      }
      setEmployees(data);
    } catch {
      setListError('Erreur réseau lors du chargement des comptes.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    setDepartmentError('');
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (!response.ok) {
        setDepartmentError(data.error || 'Impossible de charger les départements.');
        return;
      }
      setDepartments(data.map((department: { name: string }) => department.name));
    } catch {
      setDepartmentError('Erreur réseau lors du chargement des départements.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      [employee.firstName, employee.name, employee.email, employee.department, employee.matricule]
        .some((value) => value?.toLowerCase().includes(query))
    );
  }, [employees, searchQuery]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la création.' });
        return;
      }

      setMessage({ type: 'success', text: 'Compte employé créé avec succès !' });
      setFormData({ name: '', firstName: '', email: '', password: '', department: '', matricule: '' });
      await loadEmployees();
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la création.' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditEmail(employee.email);
    setNewPassword('');
    setMessage(null);
  };

  const saveEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployee) return;

    setSavingEdit(true);
    setMessage(null);
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEmployee._id,
          email: editEmail,
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Impossible de modifier ce compte.' });
        return;
      }

      setSelectedEmployee(null);
      setMessage({ type: 'success', text: 'Compte employé mis à jour.' });
      await loadEmployees();
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la modification.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    const fullName = `${employee.firstName || ''} ${employee.name || ''}`.trim() || employee.email;
    if (!window.confirm(`Supprimer définitivement le compte de ${fullName} ?`)) return;

    setDeletingId(employee._id);
    setMessage(null);
    try {
      const response = await fetch(`/api/users?id=${encodeURIComponent(employee._id)}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Impossible de supprimer ce compte.' });
        return;
      }
      setEmployees((current) => current.filter((item) => item._id !== employee._id));
      setMessage({ type: 'success', text: `Le compte de ${fullName} a été supprimé.` });
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau lors de la suppression.' });
    } finally {
      setDeletingId(null);
    }
  };

  const messageBlock = message && (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
      message.type === 'success'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      <Shield className="h-4 w-4 shrink-0" />
      {message.text}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0B1120] dark:text-white">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" aria-label="Retour au tableau de bord" className="rounded-full bg-slate-100 p-2 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
              <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <CompanyLogo size="sm" />
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <Users className="h-8 w-8 text-blue-500" />
            Gestion des comptes employés
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Consultez les comptes créés, modifiez leur email ou leur mot de passe, et supprimez les accès inutilisés.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" /> Comptes existants
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{employees.length}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('create'); setMessage(null); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="h-4 w-4" /> Créer un compte
          </button>
        </div>

        {activeTab === 'accounts' ? (
          <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold">Comptes employés</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gérez les accès des collaborateurs.</p>
              </div>
              <div className="flex gap-2">
                <label className="relative block flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Rechercher un employé..."
                    aria-label="Rechercher un employé"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void loadEmployees()}
                  disabled={loadingEmployees}
                  aria-label="Actualiser la liste"
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingEmployees ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-5">
              {messageBlock}
              {listError && (
                <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {listError}
                </div>
              )}
              {loadingEmployees ? (
                <div className="py-16 text-center text-slate-500">Chargement des comptes...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-700" />
                  <p className="font-semibold">{searchQuery ? 'Aucun compte correspondant.' : 'Aucun compte employé pour le moment.'}</p>
                  {!searchQuery && (
                    <button type="button" onClick={() => setActiveTab('create')} className="mt-3 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      <Plus className="h-4 w-4" /> Créer le premier compte
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredEmployees.map((employee) => (
                    <article key={employee._id} className="rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-md dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold">
                            {[employee.firstName, employee.name].filter(Boolean).join(' ') || 'Employé'}
                          </h3>
                          <p className="mt-1 flex items-center gap-2 break-all text-sm text-slate-500 dark:text-slate-400">
                            <Mail className="h-4 w-4 shrink-0" /> {employee.email}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Employé
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Building className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{employee.department || 'Département non renseigné'}</span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{employee.matricule || 'Matricule non renseigné'}</span>
                        </div>
                      </div>
                      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => openEdit(employee)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <Pencil className="h-4 w-4" /> Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteEmployee(employee)}
                          disabled={deletingId === employee._id}
                          aria-label={`Supprimer le compte de ${employee.email}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        >
                          <Trash2 className="h-4 w-4" /> {deletingId === employee._id ? 'Suppression...' : 'Supprimer'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <div className="mb-6">
              <h2 className="flex items-center gap-3 text-xl font-bold">
                <UserPlus className="h-6 w-6 text-blue-500" /> Créer un compte Employé
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Générez un accès sécurisé pour un collaborateur afin qu&apos;il puisse soumettre et suivre ses demandes.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Prénom</label>
                  <input id="firstName" type="text" required value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} className={inputClassName} />
                </div>
                <div>
                  <label htmlFor="name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nom</label>
                  <input id="name" type="text" required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className={inputClassName} />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Email de connexion</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input id="email" type="email" required value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className={`${inputClassName} pl-12`} />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Mot de passe provisoire</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input id="password" type="password" minLength={8} required value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} className={`${inputClassName} pl-12`} />
                </div>
                <p className="mt-1 text-xs text-slate-500">8 caractères minimum.</p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="department" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Département</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <select
                      id="department"
                      required
                      value={formData.department}
                      onChange={(event) => setFormData({ ...formData, department: event.target.value })}
                      disabled={loadingDepartments || departments.length === 0}
                      className={`${inputClassName} pl-12 disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <option value="">
                        {loadingDepartments ? 'Chargement des départements...' : 'Sélectionnez un département'}
                      </option>
                      {departments.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                  {departmentError ? (
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-red-600 dark:text-red-400">
                      <span>{departmentError}</span>
                      <button type="button" onClick={() => void loadDepartments()} className="shrink-0 font-semibold underline">
                        Réessayer
                      </button>
                    </div>
                  ) : !loadingDepartments && departments.length === 0 ? (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Aucun département enregistré.</p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor="matricule" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Matricule</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input id="matricule" type="text" required value={formData.matricule} onChange={(event) => setFormData({ ...formData, matricule: event.target.value })} className={`${inputClassName} pl-12`} />
                  </div>
                </div>
              </div>
              {messageBlock}
              <button type="submit" disabled={loading || loadingDepartments || departments.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-60">
                <UserPlus className="h-5 w-5" /> {loading ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </motion.section>
        )}
      </main>

      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingEdit) setSelectedEmployee(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-employee-title"
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 id="edit-employee-title" className="text-xl font-bold">Modifier le compte</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {[selectedEmployee.firstName, selectedEmployee.name].filter(Boolean).join(' ') || selectedEmployee.email}
                  </p>
                </div>
                <button type="button" onClick={() => setSelectedEmployee(null)} disabled={savingEdit} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={saveEmployee} className="space-y-5">
                <div>
                  <label htmlFor="edit-email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Adresse email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input id="edit-email" type="email" required value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className={`${inputClassName} pl-12`} />
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-password" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Nouveau mot de passe</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input id="edit-password" type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Laisser vide pour conserver l&apos;actuel" className={`${inputClassName} pl-12`} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Facultatif, 8 caractères minimum si renseigné.</p>
                </div>
                {messageBlock}
                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setSelectedEmployee(null)} disabled={savingEdit} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    Annuler
                  </button>
                  <button type="submit" disabled={savingEdit} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                    {savingEdit ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
