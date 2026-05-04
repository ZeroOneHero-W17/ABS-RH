'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const SERVICES = [
  "Informatique", "Maintenance", "Resource Humain", "Comptabilite",
  "Production", "Transport", "Surete", "Commercial", "Achats",
  "Service Aerien", "Regulation", "Materiel de Bord (MDB)",
  "Economat", "Audit", "Supervision",
  "Qualite Hygienne et surete Environmental (QHSE)",
  "Remote"
];

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 font-sans">
      <Link href="/" className="mb-8 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
        <div className="flex justify-center mb-8">
          <Image
            src="https://abs-rh.lovable.app/assets/logo-doualair-BfWfygvc.png"
            alt="Logo Doualair"
            width={200}
            height={70}
            className="object-contain"
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Espace Administration</h1>
          <p className="text-slate-500 text-sm">Sélectionnez votre rôle et connectez-vous</p>
        </div>

        {/* Role Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Votre rôle</label>
          <div className="grid grid-cols-3 gap-2">
            {(['rh', 'chef', 'dg'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setError(''); }}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border-2 transition-all text-center ${
                  selectedRole === role
                    ? role === 'rh' ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : role === 'chef' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {role === 'rh' ? 'Resource Humaine' : role === 'chef' ? ' Chef Service' : ' Direction Generale'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">{roleLabels[selectedRole]}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Department selector for chef */}
          {selectedRole === 'chef' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Votre département *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              >
                <option value="">Sélectionnez votre département</option>
                {SERVICES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm py-2.5 px-4 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3 px-4 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 active:scale-[0.98] ${
              selectedRole === 'rh' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              : selectedRole === 'chef' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
              : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
            } focus:ring-2 focus:ring-offset-2`}
          >
            {loading ? 'Authentification...' : `Se connecter en tant que ${roleLabels[selectedRole]}`}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-center text-slate-400 text-xs">
            Le rôle détermine les demandes visibles et les actions disponibles dans le tableau de bord.
          </p>
        </div>
      </div>
    </div>
  );
}