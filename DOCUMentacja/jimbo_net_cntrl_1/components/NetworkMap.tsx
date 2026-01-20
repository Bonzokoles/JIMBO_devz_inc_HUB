
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { NetworkService } from '../types';

interface Props {
  services: NetworkService[];
}

const NetworkMap: React.FC<Props> = ({ services }) => {
  const data = services.map(s => ({
    name: `${s.name} (${s.port})`,
    risk: s.vulnerabilityScore,
    port: s.port,
    color: s.vulnerabilityScore > 70 ? '#ef4444' : s.vulnerabilityScore > 40 ? '#f59e0b' : '#10b981'
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
          />
          <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetworkMap;
