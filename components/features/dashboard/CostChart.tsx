"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function CostChart({ data }: { data: any[] }) {
  return (
    <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">7-Day Cloud Compute Costs</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => {
              // Safely handle the value, ensuring it's treated as a number
              const numValue = Number(value) || 0;
              return [`$${numValue.toFixed(2)}`, 'Cost'];
            }}
          />
          <Line 
            type="monotone" 
            dataKey="cost" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#white" }} 
            activeDot={{ r: 6, fill: "#ef4444", stroke: "#white" }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}