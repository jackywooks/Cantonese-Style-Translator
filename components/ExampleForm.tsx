
import React, { useState, useEffect } from 'react';
import { TranslationExample } from '../types';

interface ExampleFormProps {
  onSubmit: (example: TranslationExample) => void;
  onCancel: () => void;
  initialData?: TranslationExample | null;
}

const ExampleForm: React.FC<ExampleFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [cantonese, setCantonese] = useState('');
  const [traditionalChinese, setTraditionalChinese] = useState('');

  useEffect(() => {
    if (initialData) {
      setCantonese(initialData.cantonese);
      setTraditionalChinese(initialData.traditionalChinese);
    } else {
      setCantonese('');
      setTraditionalChinese('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantonese.trim() || !traditionalChinese.trim()) {
      alert("Both Cantonese and Traditional Chinese fields are required.");
      return;
    }
    onSubmit({ cantonese, traditionalChinese });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="form-cantonese" className="block text-sm font-medium text-sky-300 mb-1">
          Verbal Cantonese:
        </label>
        <textarea
          id="form-cantonese"
          rows={3}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 resize-y"
          placeholder="e.g., 食咗飯未呀?"
          value={cantonese}
          onChange={(e) => setCantonese(e.target.value)}
          required
          aria-label="Verbal Cantonese input for example"
        />
      </div>
      <div>
        <label htmlFor="form-traditional-chinese" className="block text-sm font-medium text-sky-300 mb-1">
          Formal Traditional Chinese:
        </label>
        <textarea
          id="form-traditional-chinese"
          rows={3}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 resize-y"
          placeholder="e.g., 請問用膳了嗎？"
          value={traditionalChinese}
          onChange={(e) => setTraditionalChinese(e.target.value)}
          required
          aria-label="Formal Traditional Chinese input for example"
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
          aria-label="Cancel editing example"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-md transition-colors"
          aria-label={initialData ? "Save changes to example" : "Add new example"}
        >
          {initialData ? 'Save Changes' : 'Add Example'}
        </button>
      </div>
    </form>
  );
};

export default ExampleForm;
