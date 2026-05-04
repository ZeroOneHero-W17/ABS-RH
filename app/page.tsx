'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

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

  const services = [
    "Informatique", "Maintenance", "Resource Humain", "Comptabilite",
    "Production", "Transport", "Surete", "Commercial", "Achats",
    "Service Aerien", "Regulation", "Materiel de Bord (MDB)",
    "Economat", "Audit", "Supervision",
    "Qualite Hygienne et surete Environmental (QHSE)",
    "Remote"
  ];

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-3xl flex justify-end mb-4">
        <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          Administration
        </Link>
      </div>

      <div className="w-full max-w-3xl bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-white p-8 sm:p-10">
          <div className="flex justify-center mb-6">
            <Image
              src="https://abs-rh.lovable.app/assets/logo-doualair-BfWfygvc.png"
              alt="Logo Doualair"
              width={210}
              height={72}
              className="object-contain"
            />
          </div>
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Demande d'autorisation d'absence</h1>
            <p className="text-slate-500">Veuillez remplir le formulaire ci-dessous pour soumettre votre demande.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Informations personnelles</h2>

              <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 mb-6">
                <label className="block text-sm font-semibold text-slate-800 mb-3 text-center">Vous êtes :</label>
                <div className="flex justify-center gap-8">
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors">
                    <input type="radio" name="requesterType" value="employee" checked={formData.requesterType === 'employee'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Employé</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 hover:border-blue-400 transition-colors">
                    <input type="radio" name="requesterType" value="chef_service" checked={formData.requesterType === 'chef_service'} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Chef de Service</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="Votre nom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="Votre prénom" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="prenom.nom@doualair.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service *</label>
                  <select name="service" value={formData.service} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm">
                    <option value="">Sélectionnez un service</option>
                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fonction</label>
                  <input type="text" name="function" value={formData.function} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" placeholder="Ex: Développeur" />
                </div>
              </div>
            </div>

            {/* Détails de l'absence */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Détails de l'absence</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type d'absence *</label>
                  <select name="type" value={formData.type} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm">
                    <option value="">Sélectionnez un motif</option>
                    <option value="congé annuel">Congé annuel</option>
                    <option value="congé maladie">Congé maladie</option>
                    <option value="congé maternité">Congé maternité</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motif détaillé</label>
                  <textarea name="reason" value={formData.reason} onChange={handleChange} rows={3} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none" placeholder="Précisez le motif..." />
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de début *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                  </div>
                  {formData.startDate && formData.endDate && (
                    <div className="sm:col-span-2 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Durée estimée : <span className="font-semibold">{calculateDays()} jour(s)</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Heure de début</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Heure de fin</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm" />
                  </div>
                  {formData.startTime && formData.endTime && (
                    <div className="sm:col-span-2 px-4 py-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Volume horaire estimé : <span className="font-semibold">{calculateHours()} heure(s)</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pièce jointe */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Document justificatif</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pièce jointe (facultatif)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg bg-slate-50/30 hover:bg-slate-50/80 transition-all cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Téléchargez un fichier</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,image/*" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                      </label>
                      <p className="pl-1">ou glissez-déposez</p>
                    </div>
                    <p className="text-xs text-slate-500">PDF, PNG, JPG jusqu'à 10MB</p>
                    {attachment && <p className="text-sm font-medium text-green-600 mt-2">Fichier sélectionné : {attachment.name}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Soumission en cours...' : 'Soumettre la demande'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${message.includes('succès') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
              <div className="flex-shrink-0">
                {message.includes('succès') ? (
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                )}
              </div>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}