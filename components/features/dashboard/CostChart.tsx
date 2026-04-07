"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CostChart({ data }: { data: any[] }) {
  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-5 md:h-96">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">7-Day Cloud Compute Costs</h3>
      <div className="h-[19rem] w-full sm:h-[22rem] md:h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#6b7280" strokeOpacity={0.2} />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} interval="preserveStartEnd" minTickGap={22} />
            <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} width={40} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #374151', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)', boxShadow: '0 12px 28px -10px rgb(0 0 0 / 0.35)' }}
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
    </div>
  );
}