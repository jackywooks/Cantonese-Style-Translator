
import React, { useState, useCallback } from 'react';
import { TranslationExample } from '../types';
import UploadIcon from './icons/UploadIcon';
import InfoIcon from './icons/InfoIcon';

interface FileUploadProps {
  onFileProcessed: (examples: TranslationExample[], error?: string, fileName?: string) => void;
}

// Robust CSV parsing to handle quoted fields containing commas or newlines
const parseCSV = (csvText: string): { examples: TranslationExample[]; error?: string } => {
  const examples: TranslationExample[] = [];
  // Normalize line endings and then split
  const lines = csvText.replace(/\r\n|\r/g, '\n').trim().split('\n');

  if (lines.length < 1) { // Allow empty CSV or just header
      return { examples: [], error: "CSV file is empty." };
  }
  if (lines.length === 1 && lines[0].trim() === "") { // Handle case of a file with only whitespace
    return { examples: [], error: "CSV file contains only whitespace." };
  }


  const headerLine = lines[0];
  const headerPattern = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
  let match;
  const headers: string[] = [];
  while ((match = headerPattern.exec(headerLine)) !== null) {
    let header = match[1];
    // Remove surrounding quotes and unescape double quotes
    if (header.startsWith('"') && header.endsWith('"')) {
      header = header.substring(1, header.length - 1).replace(/""/g, '"');
    }
    headers.push(header.trim().toLowerCase());
  }
  
  const cantoneseIndex = headers.indexOf('cantonese');
  const traditionalChineseIndex = headers.indexOf('trad. chinese');

  if (cantoneseIndex === -1 || traditionalChineseIndex === -1) {
    return { examples: [], error: "CSV header must contain 'Cantonese' and 'Trad. Chinese' columns (case-insensitive). Check spelling and ensure they are present." };
  }

  if (lines.length < 2) { // Only header row found
    return { examples: [], error: "CSV has a header row but no data rows for examples." };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines

    const values: string[] = [];
    let currentMatch;
    const valuePattern = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g; // Regex to handle quoted fields

    // Reset lastIndex for global regex if used in a loop
    valuePattern.lastIndex = 0; 

    while ((currentMatch = valuePattern.exec(line)) !== null) {
        let value = currentMatch[1];
        // Remove surrounding quotes and unescape double quotes
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
        }
        values.push(value.trim());
    }
    
    // Ensure line is not just a series of empty commas
    if (values.every(v => v === "")) continue;


    if (values.length > Math.max(cantoneseIndex, traditionalChineseIndex)) {
      const cantonese = values[cantoneseIndex];
      const traditionalChinese = values[traditionalChineseIndex];
      // Only add if both fields have content
      if (cantonese && traditionalChinese) {
        examples.push({ cantonese, traditionalChinese });
      } else if (cantonese || traditionalChinese) {
        // If one is present but not the other for a valid row structure, it's a partial entry.
        // Depending on strictness, this could be an error or a skipped line.
        // For now, we skip if either essential part is missing.
        console.warn(`Skipping line ${i+1} due to missing Cantonese or Traditional Chinese data: ${line}`);
      }
    } else {
      console.warn(`Skipping malformed CSV line ${i+1} (not enough columns or parsing issue): ${line}`);
    }
  }

  if (examples.length === 0 && lines.length > 1) { // Processed data rows but found no valid examples
    return { examples: [], error: "No valid example rows found in CSV after header. Ensure data rows are correctly formatted and contain both Cantonese and Traditional Chinese values." };
  }
  return { examples };
};


const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed }) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (typeof text === 'string') { // Ensure text is string
          const { examples, error } = parseCSV(text);
          if (error && examples.length === 0) { // If there's an error AND no examples were parsed, it's a critical CSV format error
            onFileProcessed([], error, file.name); // Send empty examples with the error
          } else if (error) { // If there's an error but some examples might have been parsed (e.g. partial success)
             onFileProcessed(examples, `Partially processed with issues: ${error}`, file.name); // Send what was parsed along with the error
          }
          else {
            onFileProcessed(examples, undefined, file.name); // Success
          }
        } else {
          onFileProcessed([], "Failed to read file content as text.", file.name);
        }
      };
      reader.onerror = () => {
        onFileProcessed([], "Error reading file using FileReader.", file.name);
      };
      reader.readAsText(file);
    } else { // No file selected or file removed
      setSelectedFileName(null);
      // Don't pass empty examples here, as it might unintentionally clear existing ones.
      // App.tsx's handleFileProcessed will decide if examples should be cleared.
      // We can indicate no file by passing undefined for examples and error.
      onFileProcessed([], undefined, undefined); 
    }
     // Reset file input to allow re-uploading the same file
    event.target.value = '';
  }, [onFileProcessed]);

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-sky-300">Import Style Examples (CSV)</h3>
        <div className="relative">
          <button 
            onClick={() => setIsInfoVisible(!isInfoVisible)}
            className="text-slate-400 hover:text-sky-300 transition-colors"
            aria-label="CSV format information"
            aria-expanded={isInfoVisible}
          >
            <InfoIcon />
          </button>
          {isInfoVisible && (
            <div 
              role="tooltip" 
              id="csv-info-tooltip"
              className="absolute right-0 mt-2 w-72 p-3 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10 text-sm text-slate-300"
            >
              <p className="font-semibold mb-1">CSV Format Guide:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Must have headers: <strong>Cantonese</strong>, <strong>Trad. Chinese</strong> (case-insensitive).</li>
                <li>Each row after the header is an example pair.</li>
                <li>Fields with commas, newlines, or double quotes must be enclosed in double quotes (e.g., <code className="text-xs bg-slate-600 p-0.5 rounded">"Hello, world"</code>).</li>
                <li>To include a double quote within a quoted field, use two double quotes (e.g., <code className="text-xs bg-slate-600 p-0.5 rounded">"She said ""Hi"""</code>).</li>
                <li>Example: <br />
                  <code className="text-xs bg-slate-600 p-0.5 rounded">Cantonese,Trad. Chinese</code><br />
                  <code className="text-xs bg-slate-600 p-0.5 rounded">"食咗飯未呀?","請問用膳了嗎？"</code>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <label htmlFor="csv-upload" className="w-full flex items-center justify-center px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md cursor-pointer transition-colors duration-150 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-sky-400">
        <UploadIcon className="mr-2 w-6 h-6" /> {/* Corrected icon size */}
        <span>{selectedFileName ? `File: ${selectedFileName}` : "Upload CSV File"}</span>
      </label>
      <input
        id="csv-upload"
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
        aria-describedby={isInfoVisible ? "csv-info-tooltip" : undefined}
      />
    </div>
  );
};

export default FileUpload;
