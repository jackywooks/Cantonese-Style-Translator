
import React, { useState, useCallback } from 'react';
import { TranslationExample } from '../types';
import Modal from '../components/Modal';
import ExampleForm from '../components/ExampleForm';
import AddIcon from '../components/icons/AddIcon';
import EditIcon from '../components/icons/EditIcon';
import DeleteIcon from '../components/icons/DeleteIcon';
import FileUpload from '../components/FileUpload'; // Import FileUpload
import DownloadIcon from '../components/icons/DownloadIcon'; // Import DownloadIcon

interface ManageExamplesPageProps {
  examples: TranslationExample[];
  setExamples: React.Dispatch<React.SetStateAction<TranslationExample[]>>; // To replace examples from CSV
  onAddExample: (example: TranslationExample) => void;
  onEditExample: (index: number, example: TranslationExample) => void;
  onDeleteExample: (index: number) => void;
  onClearAllExamples: () => void;
}

const ManageExamplesPage: React.FC<ManageExamplesPageProps> = ({
  examples,
  setExamples,
  onAddExample,
  onEditExample,
  onDeleteExample,
  onClearAllExamples
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<{ index: number; data: TranslationExample } | null>(null);
  
  const [fileErrorOnPage, setFileErrorOnPage] = useState<string | null>(null);
  const [fileNameOnPage, setFileNameOnPage] = useState<string | undefined>(undefined);


  const openAddModal = () => {
    setEditingExample(null);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number, data: TranslationExample) => {
    setEditingExample({ index, data });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExample(null);
  };

  const handleFormSubmit = (exampleData: TranslationExample) => {
    if (editingExample !== null) {
      onEditExample(editingExample.index, exampleData);
    } else {
      onAddExample(exampleData);
    }
    closeModal();
  };

  const handleDelete = (index: number) => {
    if (window.confirm("Are you sure you want to delete this example?")) {
      onDeleteExample(index);
    }
  };

  const handleFileProcessedOnPage = useCallback((newExamples: TranslationExample[], error?: string, fName?: string) => {
    if (!error && newExamples.length >= 0) { // Allow importing an empty CSV to clear examples
      setExamples(newExamples); // Replace current examples with imported ones
      setFileErrorOnPage(null);
      if (newExamples.length === 0 && fName) {
        alert(`CSV file "${fName}" processed. No examples found or file was empty. Examples list cleared/set to empty.`);
      } else if (newExamples.length > 0) {
        alert(`${newExamples.length} examples imported successfully from "${fName}".`);
      }
    } else if (error) {
      setFileErrorOnPage(error);
      setExamples([]); // Clear examples if CSV processing resulted in an error preventing any import
    }
    setFileNameOnPage(fName);
  }, [setExamples]);

  const escapeCSVField = (fieldValue: string | undefined | null): string => {
    const stringField = String(fieldValue ?? ''); // Convert null/undefined to empty string
    // Always quote and escape internal double quotes
    return `"${stringField.replace(/"/g, '""')}"`;
  };

  const handleDownloadCSV = useCallback(() => {
    if (examples.length === 0) {
      alert("No examples to download.");
      return;
    }

    const header = `"Cantonese","Trad. Chinese"\n`;
    const rows = examples.map(ex => 
      `${escapeCSVField(ex.cantonese)},${escapeCSVField(ex.traditionalChinese)}`
    ).join('\n');
    
    // Prepend UTF-8 BOM for better Excel compatibility
    const csvContent = '\uFEFF' + header + rows; 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "translation_examples.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
        alert("CSV download is not supported by your browser.");
    }
  }, [examples]);


  return (
    <section className="w-full max-w-4xl bg-slate-800 p-6 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-sky-300">Manage Examples</h2>
        <div className="flex flex-wrap gap-2">
           {examples.length > 0 && (
             <button
                onClick={onClearAllExamples}
                className="flex items-center px-3 py-2 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors"
                aria-label="Clear all examples"
             >
                <DeleteIcon className="mr-1.5 h-4 w-4" /> Clear All
            </button>
           )}
            <button
                onClick={handleDownloadCSV}
                disabled={examples.length === 0}
                className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download all examples as CSV"
            >
                <DownloadIcon className="mr-1.5 h-4 w-4" /> Download All
            </button>
            <button
            onClick={openAddModal}
            className="flex items-center px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors"
            aria-label="Add new example"
            >
            <AddIcon className="mr-1.5 h-4 w-4" /> Add New
            </button>
        </div>
      </div>

      <div className="mb-6 p-4 border border-slate-700 rounded-md">
        <h3 className="text-lg font-semibold text-sky-300 mb-3">Import Examples from CSV</h3>
        <FileUpload onFileProcessed={handleFileProcessedOnPage} />
        {fileNameOnPage && !fileErrorOnPage && (
            <p className="text-green-400 text-sm mt-2">Last import: {fileNameOnPage}</p>
        )}
        {fileErrorOnPage && (
          <div className="bg-red-900 bg-opacity-70 text-red-300 p-3 mt-3 rounded-md border border-red-700 text-sm">
            <strong>CSV Import Error:</strong> {fileErrorOnPage}
          </div>
        )}
      </div>

      {examples.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          No examples loaded. Add new examples manually or import a CSV file.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider w-16">ID</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Verbal Cantonese</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider">Formal Trad. Chinese</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-sky-300 uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {examples.map((ex, index) => (
                <tr key={index} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 break-all">{ex.cantonese}</td>
                  <td className="px-4 py-3 text-sm text-emerald-300 break-all">{ex.traditionalChinese}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(index, ex)}
                      className="text-sky-400 hover:text-sky-300 mr-3 transition-colors"
                      aria-label={`Edit example ${index + 1}`}
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      aria-label={`Delete example ${index + 1}`}
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        title={editingExample ? 'Edit Example' : 'Add New Example'}
      >
        <ExampleForm
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          initialData={editingExample ? editingExample.data : null}
        />
      </Modal>
    </section>
  );
};

export default ManageExamplesPage;
