
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { TranslationExample } from './types';
// import FileUpload from './components/FileUpload'; // Removed
// import ExampleDisplay from './components/ExampleDisplay'; // No longer used on main page
import LoadingSpinner from './components/LoadingSpinner';
import { translateTextWithExamples } from './services/geminiService';
import TranslateIcon from './components/icons/TranslateIcon';
import ManageExamplesPage from './pages/ManageExamplesPage';
import SettingsIcon from './components/icons/SettingsIcon';
import OutputDisplayTable, { SentencePair } from './components/OutputDisplayTable';
import AddIcon from './components/icons/AddIcon';

type PageView = 'translator' | 'manageExamples';

const PLACEHOLDER_TRANSLATED = "[No translation found for this segment]";

// Helper function to split text that is NOT a quoted block by standard terminators
const splitNonQuotedTextByTerminators = (text: string): string[] => {
  if (!text?.trim()) return [];
  const trimmedText = text.trim();
  if (!trimmedText) return [];

  // Match sequences that don't contain sentence terminators, followed by an optional terminator.
  const sentences = trimmedText.match(/[^。！？.!?]+[。！？.!?]?/g);
  if (sentences) {
    return sentences.map(s => s.trim()).filter(s => s.length > 0);
  }
  if (trimmedText.length > 0) { // If no terminators found, treat as one sentence
    return [trimmedText];
  }
  return [];
};

// Sentence splitter utility function
const splitSentences = (text: string): string[] => {
  if (!text?.trim()) return [];
  const trimmedText = text.trim();
  if (!trimmedText) return [];

  const finalSentences: string[] = [];
  // Split by 「...」 blocks, keeping the blocks themselves.
  // The regex creates an array where parts[0], parts[2], parts[4]... are non-quoted
  // and parts[1], parts[3], parts[5]... are the 「...」 blocks.
  const parts = trimmedText.split(/(「[^」]*」)/g);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || !part.trim()) continue;

    if (part.startsWith('「') && part.endsWith('」')) {
      finalSentences.push(part.trim()); // This is a 「...」 block, add as is
    } else {
      // This is text outside 「...」 blocks, split it further by terminators
      const subSentences = splitNonQuotedTextByTerminators(part);
      finalSentences.push(...subSentences);
    }
  }
  return finalSentences.filter(s => s.length > 0);
};


function App() {
  const [examples, setExamples] = useState<TranslationExample[]>([]);
  const [inputText, setInputText] = useState<string>("");
  
  const [fullOutputText, setFullOutputText] = useState<string>(""); // Keep for raw API response with markers
  const [translatedSentencePairs, setTranslatedSentencePairs] = useState<SentencePair[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageView>('translator');

  useEffect(() => {
    const storedExamples = localStorage.getItem('translationExamples');
    if (storedExamples) {
      try {
        const parsedExamples = JSON.parse(storedExamples);
        if (Array.isArray(parsedExamples)) {
          setExamples(parsedExamples);
        }
      } catch (e) {
        console.error("Failed to parse examples from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('translationExamples', JSON.stringify(examples));
  }, [examples]);


  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      setApiError("Please enter Cantonese text to translate.");
      setFullOutputText("");
      setTranslatedSentencePairs([]);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    setFullOutputText("");
    setTranslatedSentencePairs([]);

    const originalSentences = splitSentences(inputText); // Uses the new splitSentences logic
    if (originalSentences.length === 0 && inputText.trim().length > 0) { // If input has text but no sentences were parsed
        // This might happen if the input is very unusual, or just doesn't meet splitting criteria.
        // Treat the whole input as one sentence for marker purposes.
        originalSentences.push(inputText.trim());
    }
    if (originalSentences.length === 0) {
        setApiError("Could not split input into sentences. Please check your input.");
        setIsLoading(false);
        return;
    }


    const originalMarkedSentences = originalSentences.map((sentence, index) => ({
        marker: `[S:${index + 1}]`,
        text: sentence
    }));

    const textToSendToGemini = originalMarkedSentences
        .map(s => `${s.marker} ${s.text}`)
        .join(' '); 

    try {
      const translatedFullWithMarkers = await translateTextWithExamples(textToSendToGemini, examples);
      setFullOutputText(translatedFullWithMarkers); 

      const translatedSegmentsByMarker: Record<string, string[]> = {};
      // Regex to capture [S:N] marker and the text following it, until the next [S:N] or end of string.
      // It now handles multi-line content within a segment more robustly.
      const markerRegex = /\[S:(\d+)\]\s*([\s\S]*?)(?=\s*\[S:\d+\]|$)/g;
      let match;
      while ((match = markerRegex.exec(translatedFullWithMarkers)) !== null) {
          const marker = `[S:${match[1]}]`;
          const segmentText = match[2].trim();
          if (!translatedSegmentsByMarker[marker]) {
              translatedSegmentsByMarker[marker] = [];
          }
          if (segmentText) { 
            translatedSegmentsByMarker[marker].push(segmentText);
          }
      }
      
      const pairs: SentencePair[] = originalMarkedSentences.map((origMarkedSentence, index) => {
          const translatedParts = translatedSegmentsByMarker[origMarkedSentence.marker];
          const combinedTranslation = translatedParts && translatedParts.length > 0 
              ? translatedParts.join(' ') // Join parts of the same original sentence with a space
              : PLACEHOLDER_TRANSLATED;
          
          return {
            id: `${Date.now()}-${index}`, 
            originalCantonese: origMarkedSentence.text,
            translatedChinese: combinedTranslation,
          };
      });
      
      setTranslatedSentencePairs(pairs);

    } catch (err) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("An unknown error occurred during translation.");
      }
      setFullOutputText(""); 
      setTranslatedSentencePairs([]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, examples]);
  
  const handleEditTranslatedSentence = useCallback((id: string, newTranslatedText: string) => {
    setTranslatedSentencePairs(prevPairs =>
      prevPairs.map(pair =>
        pair.id === id ? { ...pair, translatedChinese: newTranslatedText } : pair
      )
    );
  }, []);

  const handleAddSentenceToExamples = useCallback((sentencePair: SentencePair) => {
    if (sentencePair.translatedChinese === PLACEHOLDER_TRANSLATED) {
        alert("Cannot add pair with placeholder translation to examples.");
        return;
    }
    const newExample: TranslationExample = {
      cantonese: sentencePair.originalCantonese,
      traditionalChinese: sentencePair.translatedChinese,
    };
    setExamples(prev => [...prev, newExample]);
    alert(`Example added: "${sentencePair.originalCantonese.substring(0,30)}..." -> "${sentencePair.translatedChinese.substring(0,30)}..."`);
  }, [setExamples]); 

  const handleAddAllVisibleToExamples = useCallback(() => {
    const validPairs = translatedSentencePairs.filter(
      pair => pair.translatedChinese !== PLACEHOLDER_TRANSLATED
    );

    if (validPairs.length === 0) {
        alert("No valid, complete sentence pairs to add to examples.");
        return;
    }

    let confirmMessage = `Are you sure you want to add all ${validPairs.length} currently displayed valid sentence pairs to your examples?`;
    
    let userConfirmed = false;
    try {
        userConfirmed = window.confirm(confirmMessage);
    } catch (e) {
        if (e instanceof DOMException && (e.name === "NotAllowedError" || e.message.toLowerCase().includes("sandboxed"))) {
            alert("Confirmation dialog was blocked by browser sandbox restrictions. Action cancelled for safety.");
        } else {
            console.error("Error with window.confirm:", e);
            alert("An unexpected error occurred with the confirmation dialog. Action cancelled.");
        }
        userConfirmed = false; 
    }

    if (userConfirmed) {
        const newExamplesToAdd: TranslationExample[] = validPairs.map(pair => ({
            cantonese: pair.originalCantonese,
            traditionalChinese: pair.translatedChinese,
        }));
        setExamples(prevExamples => [...prevExamples, ...newExamplesToAdd]);
        alert(`${newExamplesToAdd.length} sentence pairs added to examples.`);
    }
  }, [translatedSentencePairs, setExamples]); 


  const addExample = useCallback((example: TranslationExample) => {
    setExamples(prev => [...prev, example]);
  }, []); 

  const editExample = useCallback((index: number, updatedExample: TranslationExample) => {
    setExamples(prev => prev.map((ex, i) => i === index ? updatedExample : ex));
  }, []); 

  const deleteExample = useCallback((index: number) => {
    setExamples(prev => prev.filter((_, i) => i !== index));
  }, []); 

  const getJoinedOutputTextForCopy = useMemo(() => {
    let textToJoin: string[];
    if (translatedSentencePairs.length > 0) {
      textToJoin = translatedSentencePairs
        .filter(pair => pair.translatedChinese !== PLACEHOLDER_TRANSLATED) 
        .map(pair => pair.translatedChinese);
    } else {
      // Fallback to fullOutputText if no pairs, stripping markers
      textToJoin = [fullOutputText.replace(/\[S:\d+\]\s*/g, '').trim()];
    }
    // Join sentences. Consider newline '\n' if preferred over space for readability of copied text.
    // For now, using space.
    return textToJoin.join(' ').trim(); 
  }, [translatedSentencePairs, fullOutputText]);
  
  const numberOfValidPairs = useMemo(() => {
    return translatedSentencePairs.filter(
      p => p.translatedChinese !== PLACEHOLDER_TRANSLATED
    ).length;
  }, [translatedSentencePairs]);


  const renderTranslatorPage = () => {
    const finalFullTranslation = getJoinedOutputTextForCopy;

    return (
    <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-1 gap-6 md:gap-8">
      <section className="flex flex-col space-y-6 bg-slate-800 p-6 rounded-lg shadow-xl">
        <div>
          <label htmlFor="cantonese-input" className="block text-sm font-medium text-sky-300 mb-1">
            Enter Verbal Cantonese Text:
          </label>
          <textarea
            id="cantonese-input"
            rows={12} // Increased height
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 resize-y"
            placeholder="例如: 你食咗飯未呀？ (e.g., Have you eaten yet?)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            aria-label="Cantonese input text area"
          />
        </div>

        <button
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className="w-full flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-md shadow-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-400"
          aria-live="polite"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Translating...
            </>
          ) : (
            <>
              <TranslateIcon className="mr-2 h-5 w-5" />
              Translate to Formal Traditional Chinese
            </>
          )}
        </button>

        {/* Full Combined Translation Read-Only Area - MOVED HERE */}
        {finalFullTranslation.length > 0 && !isLoading && (
          <div className="mt-4 pt-4 border-t border-slate-700"> {/* Adjusted margin */}
            <label htmlFor="full-combined-translation" className="block text-sm font-medium text-sky-300 mb-1">
              Full Combined Translation (Read-Only):
            </label>
            <textarea
              id="full-combined-translation"
              rows={Math.max(8, Math.min(15, finalFullTranslation.split('\n').length +1))} // Increased height
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-emerald-200 resize-y"
              value={finalFullTranslation}
              readOnly
              aria-label="Full combined Traditional Chinese translation, read-only"
            />
            <div className="mt-2 flex justify-end">
                <button
                  onClick={() => {
                      const textToCopy = finalFullTranslation;
                      if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy);
                        alert("Full translation copied to clipboard!");
                      } else {
                        alert("Nothing to copy.");
                      }
                  }}
                  className="px-4 py-2 text-sm bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-md transition-colors flex items-center justify-center"
                  aria-label="Copy full translation to clipboard"
                  disabled={!finalFullTranslation}
                >
                  Copy Full Translation to Clipboard
                </button>
            </div>
          </div>
        )}
        
        {apiError && (
          <div role="alert" className="bg-red-900 bg-opacity-70 text-red-300 p-3 rounded-md border border-red-700 text-sm mt-4"> {/* Added mt-4 for spacing */}
            <strong>Translation Error:</strong> {apiError}
          </div>
        )}

        {isLoading && !apiError && <LoadingSpinner />}
        
        {/* Interactive Sentence Breakdown Output */}
        <div className="mt-4">
          <label htmlFor="traditional-chinese-output-table" className="block text-sm font-medium text-sky-300 mb-1">
            Formal Traditional Chinese Output (Sentence Breakdown):
          </label>
          
          {translatedSentencePairs.length > 0 ? (
            <>
              <OutputDisplayTable
                sentencePairs={translatedSentencePairs}
                onEditSentence={handleEditTranslatedSentence}
                onAddToExamples={handleAddSentenceToExamples}
              />
              {numberOfValidPairs > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleAddAllVisibleToExamples}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors flex items-center justify-center"
                    aria-label="Add all valid sentence pairs to examples"
                  >
                    <AddIcon className="mr-1.5 h-4 w-4" />
                    Add All to Examples
                  </button>
                </div>
              )}
            </>
          ) : fullOutputText && !isLoading && !apiError ? ( 
             // Display the marker-stripped full text if no pairs but fullOutputText exists (e.g. parsing pairs failed for some reason)
            <textarea
              id="traditional-chinese-output-full-placeholder"
              rows={6}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-emerald-200 placeholder-slate-500 resize-y"
              value={fullOutputText.replace(/\[S:\d+\]\s*/g, '').trim()}
              readOnly
              aria-label="Formal Traditional Chinese output text area (full text, fallback)"
            />
          ) : !isLoading && !apiError ? ( 
             <div className="w-full p-3 h-[140px] bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-500 flex items-center justify-center">
                Translation will appear here
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
 };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-6xl mb-8">
        <div className="flex justify-between items-center">
          <div className="text-center flex-grow">
            <TranslateIcon className="w-[100px] h-[100px] text-sky-500 opacity-80 mx-auto mb-2" />
            <h1 className="text-4xl md:text-5xl font-bold text-sky-400">
              Cantonese <span className="text-emerald-400">Style</span> Translator
            </h1>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              {currentPage === 'translator' 
                ? "Translate Verbal Cantonese to Formal Traditional Chinese, guided by your examples."
                : "Manage your custom translation examples."}
            </p>
          </div>
          <button
            onClick={() => setCurrentPage(currentPage === 'translator' ? 'manageExamples' : 'translator')}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors self-start"
            aria-label={currentPage === 'translator' ? "Manage examples" : "Go to translator"}
            title={currentPage === 'translator' ? "Manage examples" : "Go to translator"}
          >
            <SettingsIcon className="w-6 h-6 text-sky-300" />
          </button>
        </div>
      </header>

      {currentPage === 'translator' ? renderTranslatorPage() : (
        <ManageExamplesPage
          examples={examples}
          setExamples={setExamples}
          onAddExample={addExample}
          onEditExample={editExample}
          onDeleteExample={deleteExample}
          onClearAllExamples={() => {
            if (window.confirm("Are you sure you want to delete ALL examples? This cannot be undone.")) {
                 setExamples([]);
            }
          }}
        />
      )}

      <footer className="mt-12 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Cantonese Style Translator. Powered by Gemini API.</p>
      </footer>
    </div>
  );
}

export default App;
