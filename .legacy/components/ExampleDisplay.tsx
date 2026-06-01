
import React from 'react';
import { TranslationExample } from '../types';

interface ExampleDisplayProps {
  examples: TranslationExample[];
}

const ExampleDisplay: React.FC<ExampleDisplayProps> = ({ examples }) => {
  if (examples.length === 0) {
    return (
      <div className="mt-4 bg-slate-800 p-4 rounded-lg shadow-inner">
        <p className="text-slate-400 text-center">No examples loaded. Upload a CSV to guide the translation style.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-slate-800 p-1 rounded-lg shadow-xl max-h-80 overflow-y-auto">
      <h4 className="text-md font-semibold text-sky-300 mb-3 p-3 sticky top-0 bg-slate-800 z-1">
        {examples.length} Example(s) Loaded:
      </h4>
      <div className="space-y-3 px-3 pb-3">
        {examples.map((ex, index) => (
          <div key={index} className="bg-slate-700 p-3 rounded-md shadow">
            <p className="text-xs text-slate-400 mb-0.5">Cantonese:</p>
            <p className="text-sm text-slate-200 mb-1.5">{ex.cantonese}</p>
            <p className="text-xs text-slate-400 mb-0.5">Formal Trad. Chinese:</p>
            <p className="text-sm text-emerald-300">{ex.traditionalChinese}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExampleDisplay;
