"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CostChart({ data }: { data: any[] }) {
  return (
    <div className="h-96 w-full bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">7-Day Cloud Compute Costs</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6b7280" strokeOpacity={0.2} />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid #374151', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => {
              const numValue = Number(value) || 0;
              return [`$${numValue.toFixed(2)}`, 'Cost'];
            }}
          />
          <Line 
            type="monotone" 
            dataKey="cost" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "var(--color-background)" }} 
            activeDot={{ r: 6, fill: "#ef4444", stroke: "var(--color-background)" }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}