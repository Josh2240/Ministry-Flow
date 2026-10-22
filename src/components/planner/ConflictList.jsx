import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConflictList({ messages = [] }) {
  if (!messages.length) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangle className="h-4 w-4" />
        Possible scheduling conflicts
      </p>
      <ul className="mt-2 space-y-1 pl-6 text-sm text-amber-800/90">
        {messages.map((message, index) => (
          <li key={index} className="list-disc">
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}