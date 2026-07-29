import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Info } from 'lucide-react';
import { parseCSV, generateExcelTemplate } from '../../lib/csv/csvParser';
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

  const handleDescargarPlantilla = () => {
    const blob = generateExcelTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-valientes.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          ← Volver
        </button>
        <h2 className="text-2xl font-bold text-white">Carga Masiva CSV</h2>
      </div>

      {/* Banner Informativo */}
      {!report && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Descarga la plantilla Excel</p>
            <p className="text-xs text-blue-700 mt-1">Archivo .xlsx con todas las columnas requeridas para cargar valientes masivamente.</p>
          </div>
          <button
            onClick={handleDescargarPlantilla}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download size={16} />
            Descargar
          </button>
        </div>
      )}

      {/* Zona de carga */}
      {!report && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
            ${dragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100'}
            ${loading ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Upload size={40} className={`mx-auto mb-4 ${dragging ? 'text-indigo-600' : 'text-slate-400'} transition-colors`} />
          {fileName ? (
            <div className="space-y-1">
              <p className="text-slate-700 font-semibold flex items-center justify-center gap-2">
                <FileText size={18} className="text-green-600" /> {fileName}
              </p>
              <p className="text-xs text-slate-500">Listo para cargar</p>
            </div>
          ) : (
            <>
              <p className="text-slate-700 font-semibold">Arrastra tu archivo CSV aquí</p>
              <p className="text-slate-500 text-sm mt-2">o haz clic para seleccionar (máx. {MAX_SIZE_MB} MB)</p>
            </>
          )}
        </div>
      )}

      {/* Progreso */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span className="font-medium">Procesando...</span>
            <span className="font-semibold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Errores de parseo */}
      {parseErrors.length > 0 && !loading && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
          <p className="text-yellow-900 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {parseErrors.length} fila(s) con errores de formato (omitidas)
          </p>
          <ul className="text-yellow-800 text-xs space-y-1 max-h-32 overflow-y-auto">
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle size={20} className="mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{report.insertedCount}</p>
              <p className="text-xs text-green-600 mt-1">Insertados</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <AlertCircle size={20} className="mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-700">{report.skippedCount}</p>
              <p className="text-xs text-yellow-600 mt-1">Omitidos</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <X size={20} className="mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-red-700">{report.failedCount}</p>
              <p className="text-xs text-red-600 mt-1">Fallidos</p>
            </div>
          </div>

          {report.skipped.length > 0 && (
            <details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <summary className="text-yellow-700 text-sm font-semibold cursor-pointer hover:text-yellow-800 transition-colors">
                Registros omitidos ({report.skipped.length})
              </summary>
              <ul className="mt-3 text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto">
                {report.skipped.map((e, i) => (
                  <li key={i} className="text-slate-700">Fila {e.rowNumber} — Doc {e.numeroDocumento}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}

          {report.failed.length > 0 && (
            <details className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <summary className="text-red-700 text-sm font-semibold cursor-pointer hover:text-red-800 transition-colors">
                Registros fallidos ({report.failed.length})
              </summary>
              <ul className="mt-3 text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto">
                {report.failed.map((e, i) => (
                  <li key={i} className="text-slate-700">Fila {e.rowNumber} — Doc {e.numeroDocumento}: {e.reason}</li>
                ))}
              </ul>
            </details>
          )}

          <button
            onClick={reset}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  );
};

export default CSVUploader;
