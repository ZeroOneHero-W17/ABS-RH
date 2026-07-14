export interface ServiceOption {
  value: string;
  chiefName: string;
  chiefEmail: string;
}

export const SERVICE_OPTIONS: ServiceOption[] = [
  { value: 'Informatique', chiefName: 'M. Jean Pierre MBALLA', chiefEmail: 'Chef.si@doualair.com' },
  { value: 'Maintenance', chiefName: 'M. Jonas PASSIRI', chiefEmail: 'maintenance@doualair.com' },
  { value: 'Ressources Humaines', chiefName: 'Mme. Elvyre KOYOU', chiefEmail: 'ressource@doualair.com' },
  { value: 'Comptabilite', chiefName: 'M. ALIYOU NJIKAM', chiefEmail: 'dirfinance@doualair.com' },
  { value: 'Production', chiefName: 'M. Roméo KOUOKAM', chiefEmail: 'production@doualair.com' },
  { value: 'Transport', chiefName: 'M. SANI MAMA', chiefEmail: 'transport@doualair.com' },
  { value: 'Surete', chiefName: 'M. Philippe NTAMACK', chiefEmail: 'sureted1d2@doualair.com' },
  { value: 'Commercial', chiefName: 'Mme. Ginette BIONGLA', chiefEmail: 'commercial@doualair.com' },
  { value: 'Achats', chiefName: 'M. KPOUMIE ARAMIYAHOU', chiefEmail: 'Controlegestock.doualair@gmail.com' },
  { value: 'Service Aerien', chiefName: 'Mme. Simonne NDEDI', chiefEmail: 'aerien@doualair.com' },
  { value: 'Qualite Hygienne et surete Environmental (QHSE)', chiefName: 'Mme. Judith NSONGA', chiefEmail: 'qualite@doualair.com' },
  { value: 'Remote', chiefName: 'M. Jean Paul ZOATOM', chiefEmail: 'horsfoyer@doualair.com' },
  { value: 'Audit', chiefName: 'Mme. NICOLE KONN', chiefEmail: 'audit.interne@doualair.com' },
  { value: 'Restauration Publique', chiefName: 'Mme. Danielle TICKY', chiefEmail: 'services.clients@doualair.com' },
];

export const OBSOLETE_DEPARTMENT_NAMES = ['Supervision', 'Regulation', 'Economat'];

export const DEPARTMENT_RENAMES: Record<string, string> = {
  'Materiel de Bord (MDB)': 'Restauration Publique',
  'Materiel de Bord MDB': 'Restauration Publique',
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getServiceOptionsForSelect() {
  return SERVICE_OPTIONS.map(({ value }) => value);
}

export function getChiefForService(service?: string | null) {
  if (!service) return undefined;

  const normalizedInput = normalizeText(service);
  return SERVICE_OPTIONS.find((serviceOption) => normalizeText(serviceOption.value) === normalizedInput) ||
    SERVICE_OPTIONS.find((serviceOption) =>
      normalizeText(serviceOption.value).includes(normalizedInput) || normalizedInput.includes(normalizeText(serviceOption.value))
    );
}

export function normalizeDepartmentName(name?: string | null) {
  if (!name) return '';
  const trimmed = name.trim();
  return DEPARTMENT_RENAMES[trimmed] || trimmed;
}
