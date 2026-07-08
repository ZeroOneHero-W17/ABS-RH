import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Department from '@/models/Department';
import { normalizeDepartmentName, OBSOLETE_DEPARTMENT_NAMES } from '@/lib/departmentCatalog';
 
export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();

  await Department.deleteMany({ name: { $in: OBSOLETE_DEPARTMENT_NAMES } });
  await Department.updateMany(
    { name: { $in: ['Materiel de Bord (MDB)', 'Materiel de Bord MDB'] } },
    { $set: { name: 'Restauration Publique' } }
  );

  const deps = await Department.find({ name: { $nin: OBSOLETE_DEPARTMENT_NAMES } }).sort({ name: 1 }).lean();
  const hasRestauration = deps.some((dep: any) => dep.name === 'Restauration Publique');
  if (!hasRestauration) {
    const doc = await Department.create({ name: 'Restauration Publique' });
    deps.push(doc.toObject ? doc.toObject() : doc);
  }

  return NextResponse.json(deps);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    await dbConnect();

    const normalizedName = normalizeDepartmentName(body.name);
    if (OBSOLETE_DEPARTMENT_NAMES.includes(normalizedName)) {
      return NextResponse.json({ error: 'department removed' }, { status: 410 });
    }

    const exists = await Department.findOne({ name: normalizedName });
    if (exists) return NextResponse.json({ error: 'exists' }, { status: 409 });
    const doc = await Department.create({ name: normalizedName });
    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 });
  }
}
