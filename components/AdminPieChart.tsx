"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

const COLORS = [
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export default function AdminPieChart({ absences }: { absences: any[] }) {
  const data = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    absences.forEach((a) => {
      const dept = a.employee?.service || "Inconnu";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    return Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [absences]);

  if (data.length === 0) return null;

  return (
    <div className="w-full h-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800 shadow-sm mb-8 flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
        Absences par dApartement
      </h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                borderColor: "rgba(30, 41, 59, 0.5)",
                borderRadius: "8px",
                color: "#fff",
              }}
              itemStyle={{ color: "#e2e8f0" }}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
