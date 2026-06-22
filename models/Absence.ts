import mongoose from 'mongoose';

const ApprovalSchema = new mongoose.Schema({
  status: { type: String, enum: ['approved', 'rejected'], default: undefined },
  comment: { type: String, default: '' },
  date: { type: Date },
}, { _id: false });

const AbsenceSchema = new mongoose.Schema({
  matricule: {
    type: String,
    required: true,
    unique: true,
  },
  employee: {
    name: String,
    firstName: String,
    email: String,
    service: String,
    function: String,
  },
  requesterType: {
    type: String,
    enum: ['employee', 'chef_service'],
    default: 'employee',
  },
  absence: {
    type: { type: String },
    reason: String,
    startDate: Date,
    endDate: Date,
    startTime: String,
    endTime: String,
  },
  attachment: String,
  status: {
    type: String,
    enum: ['pending_chef', 'pending_dg', 'pending_rh', 'approved', 'rejected'],
    default: 'pending_chef',
  },
  chefApproval: ApprovalSchema,
  dgApproval: ApprovalSchema,
  rhOpinion: ApprovalSchema,
  // Indicateurs décidés par le service RH: à payer / retenir
  aPayer: {
    type: Boolean,
    default: false,
  },
  retenir: {
    type: Boolean,
    default: false,
  },
  // Notes associées aux décisions RH (remplis seulement si la case correspondante est cochée)
  aPayerNote: {
    type: String,
    default: '',
  },
  retenirNote: {
    type: String,
    default: '',
  },
  adminResponse: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Absence || mongoose.model('Absence', AbsenceSchema);