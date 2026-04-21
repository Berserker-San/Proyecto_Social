import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { parseCSV } from '../../lib/csv/csvParser';
import { insertValientesBatch } from '../../lib/services/csvUpload.service';
import type { UploadReport } from '../../lib/services/csvUpload.service';
import type { RowError } from '../../lib/csv/csvParser';

const MAX_SIZE_MB = 5;

interface CSVUploaderProps {
  onBack: () => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onBack }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<UploadReport | null>(null);
  const [parseErrors, setParseErrors] = useState<RowError[]>([]);

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) return 'Solo se aceptan archivos .csv';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `El archivo supera el límite de ${MAX_SIZE_MB} MB`;
    return null;
  };

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    setFileName(file.name);
    setError(null);
    setReport(null);
    setParseErrors([]);
    setLoading(true);
    setProgress(0);

    try {
      const text = await file.text();
      const { valid, invalid } = parseCSV(text);

      setParseErrors(invalid);

      if (valid.length === 0) {
        setError(invalid.length > 0
          ? `No hay filas válidas. ${invalid.length} fila(s) con errores.`
          : 'El archivo no contiene registros.');
        setLoading(false);
        return;
      }

      const result = await insertValientesBatch(valid, (processed, total) => {
        setProgress(Math.round((processed / total) * 100));
      });

      setReport(result);
    } catch (e: any) {
      setError(`Error inesperado: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setFileName(null);
    setError(null);
    setReport(null);
    setParseErrors([]);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          ← Volver
        </button>
        <h2 className="text-xl font-bold text-white">Carga Masiva CSV — Valientes</h2>
      </div>

      {/* Zona de carga */}
      {!report && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${dragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-slate-400 bg-slate-800/50'}
            ${loading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Upload size={36} className="mx-auto mb-3 text-slate-400" />
          {fileName ? (
            <p className="text-slate-300 font-medium flex items-center justify-center gap-2">
              <FileText size={16} /> {fileName}
            </p>
          ) : (
            <>
              <p className="text-slate-300 font-medium">Arrastra tu archivo CSV aquí</p>
              <p className="text-slate-500 text-sm mt-1">o haz clic para seleccionar (máx. {MAX_SIZE_MB} MB)</p>
            </>
          )}
        </div>
      )}

      {/* Progreso */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Procesando...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Errores de parseo */}
      {parseErrors.length > 0 && !loading && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-2">
          <p className="text-yellow-300 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {parseErrors.length} fila(s) con errores de formato (omitidas)
          </p>
          <ul className="text-yellow-200/70 text-xs space-y-1 max-h-32 overflow-y-auto">
            {parseErrors.map((e, i) => (
              <li key={i}>Fila {e.rowNumber}{e.numeroDocumento ? ` (Doc: ${e.numeroDocumento})` : ''}: {e.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reporte de resultado */}
      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <CheckCircle size={20} className="mx-auto mb-1 text-green-400" />
              <p className="text-2xl font-bold text-green-400">{report.insertedCount}</p>
              <p className="text-xs text-green-300/70">Insertados</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <AlertCircle size={20} className="mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold text-yellow-400">{report.skippedCount}</p>
              <p className="text-xs text-yellow-300/70">Omitidos</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <X size={20} className="mx-auto mb-1 text-red-400" />
              <p className="text-2xl font-bold text-red-400">{report.failedCount}</p>
              <p className="text-xs text-red-300/70">Fallidos</p>
            </div>
          </div>

          {report.skipped.length > 0 && (
            <details className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <summary className="text-yellow-300 text-sm font-semibold cursor-pointer">
                Registros omitidos ({report.skipped.length})
              </summary>
              <ul className="mt-2 text-xs text-slate-400 space-y-1 max-h-40 overflow-y-auto">
                {report.skipped.map((e, i) => (
                  <li key={i}>Fila {e.rowNumber} — Doc {e.numeroDocumento}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}

          {report.failed.length > 0 && (
            <details className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <summary className="text-red-300 text-sm font-semibold cursor-pointer">
                Registros fallidos ({report.failed.length})
              </summary>
              <ul className="mt-2 text-xs text-slate-400 space-y-1 max-h-40 overflow-y-auto">
                {report.failed.map((e, i) => (
                  <li key={i}>Fila {e.rowNumber} — Doc {e.numeroDocumento}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}

          <button
            onClick={reset}
            className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  );
};

export default CSVUploader;
