
import React from 'react';
import AddIcon from './icons/AddIcon';

export interface SentencePair {
  id: string;
  originalCantonese: string;
  translatedChinese: string;
}

interface OutputDisplayTableProps {
  sentencePairs: SentencePair[];
  onEditSentence: (id: string, newTranslatedText: string) => void;
  onAddToExamples: (sentencePair: SentencePair) => void;
}

const OutputDisplayTable: React.FC<OutputDisplayTableProps> = ({
  sentencePairs,
  onEditSentence,
  onAddToExamples,
}) => {
  if (!sentencePairs || sentencePairs.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto mt-2 bg-slate-700 rounded-md">
      <table className="min-w-full divide-y divide-slate-600">
        <thead className="bg-slate-600">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider"
            >
              Original Cantonese
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider"
            >
              Editable Formal Traditional Chinese
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center text-xs font-medium text-sky-300 uppercase tracking-wider w-28"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-700 divide-y divide-slate-600">
          {sentencePairs.map((pair) => (
            <tr key={pair.id} className="hover:bg-slate-650 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-200 align-top">
                {pair.originalCantonese}
              </td>
              <td className="px-4 py-3 align-top">
                <textarea
                  value={pair.translatedChinese}
                  onChange={(e) => onEditSentence(pair.id, e.target.value)}
                  className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-emerald-200 placeholder-slate-400 resize-y min-h-[60px] text-sm focus:ring-sky-500 focus:border-sky-500"
                  rows={Math.max(2, Math.min(6, pair.translatedChinese.split('\n').length + 1))} // Auto-adjust rows roughly
                  aria-label={`Editable translation for: ${pair.originalCantonese}`}
                />
              </td>
              <td className="px-3 py-3 text-center align-middle">
                <button
                  onClick={() => onAddToExamples(pair)}
                  className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center mx-auto bg-slate-600 hover:bg-slate-500 rounded-md"
                  title="Add this pair to examples"
                  aria-label="Add this sentence pair to examples"
                >
                  <AddIcon className="w-4 h-4" />
                   <span className="ml-1 text-xs">Add</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OutputDisplayTable;
