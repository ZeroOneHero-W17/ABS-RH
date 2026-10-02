import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String, // will store bcrypt hash
    required: true,
  },
  role: {
    type: String,
    enum: ['employee', 'chef', 'rh', 'dg', 'super_admin'],
    default: 'employee',
  },
  name: String,
  firstName: String,
  department: String, // or service
  matricule: String, // useful to link with absences
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
