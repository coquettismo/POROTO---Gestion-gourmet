import React, { useState } from 'react';
import {
  FolderArchive,
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  Download,
  Plus,
  Trash2,
  FileCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { KitchenDocument } from '../types';
import { encryptData, decryptData } from '../utils/cryptoVault';
import { PorotoIcon } from './PorotoIcon';

interface DocumentsAndVaultProps {
  documents: KitchenDocument[];
  onAddDocument: (doc: Omit<KitchenDocument, 'id' | 'updatedAt'>) => void;
  onDeleteDocument: (id: string) => void;
  privacyMode: boolean;
}

export const DocumentsAndVault: React.FC<DocumentsAndVaultProps> = ({
  documents,
  onAddDocument,
  onDeleteDocument,
  privacyMode,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<KitchenDocument | null>(documents[0] || null);
  const [passphrase, setPassphrase] = useState('');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [vaultError, setVaultError] = useState('');

  // New Document modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KitchenDocument['category']>('proveedores');
  const [newFileType, setNewFileType] = useState<KitchenDocument['fileType']>('doc');
  const [newContent, setNewContent] = useState('');
  const [shouldEncrypt, setShouldEncrypt] = useState(false);

  const handleUnlockVault = async () => {
    if (!passphrase) {
      setVaultError('Ingresa una contraseña para la bóveda');
      return;
    }
    setVaultError('');

    try {
      if (selectedDoc?.isEncrypted) {
        const decrypted = await decryptData(selectedDoc.content, passphrase);
        setDecryptedContent(decrypted);
      }
      setIsVaultUnlocked(true);
    } catch {
      setVaultError('Contraseña incorrecta para descifrar este documento.');
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    let finalContent = newContent;
    if (shouldEncrypt) {
      if (!passphrase) {
        alert('Debes establecer una contraseña de encriptación primero.');
        return;
      }
      finalContent = await encryptData(newContent, passphrase);
    }

    onAddDocument({
      title: newTitle.trim(),
      category: newCategory,
      fileType: newFileType,
      sizeKb: Math.round(newContent.length / 1024) + 1,
      content: finalContent,
      tags: ['POROTO', newCategory],
      isEncrypted: shouldEncrypt,
    });

    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const handleDownloadDoc = (doc: KitchenDocument) => {
    const textToDownload = doc.isEncrypted && decryptedContent ? decryptedContent : doc.content;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/\s+/g, '_')}.${doc.fileType === 'pdf' ? 'txt' : doc.fileType}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto px-4 sm:px-6 pt-2">
      {/* Floating Header */}
      <div className="rounded-[32px] p-5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <span>Bóveda de Documentos &amp; Contratos</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Acuerdo del Espacio Decana, listas de precios, bromatología y cifrado AES-GCM 256
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold transition active:scale-95 shadow-md shadow-stone-900/10 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Documento</span>
        </button>
      </div>

      {/* Main Grid: Document List + Viewer / Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Document List */}
        <div className="lg:col-span-5 space-y-2.5">
          {documents.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setDecryptedContent(null);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_8px_20px_rgba(245,158,11,0.08)]'
                    : 'bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border-stone-200/50 dark:border-stone-800/50 hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                        {doc.title}
                      </span>
                      {doc.isEncrypted && (
                        <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{doc.category}</span>
                      <span>•</span>
                      <span>{doc.sizeKb} KB</span>
                      <span>•</span>
                      <span>{doc.updatedAt}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar el documento "${doc.title}"?`)) {
                      onDeleteDocument(doc.id);
                    }
                  }}
                  className="p-1 text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Col: Viewer / Vault */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="rounded-[36px] p-6 sm:p-7 bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.04)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/40 dark:border-stone-800/50">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                    {selectedDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[10px] font-bold uppercase">
                      {selectedDoc.category}
                    </span>
                    <span>Actualizado: {selectedDoc.updatedAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadDoc(selectedDoc)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar</span>
                </button>
              </div>

              {/* Encryption Banner if encrypted */}
              {selectedDoc.isEncrypted && (
                <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Documento Protegido con Encriptación Extremo a Extremo (AES-GCM 256)</span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mb-3">
                    Este documento está cifrado en tu dispositivo. Ingresa la clave maestra para descifrarlo.
                  </p>

                  <div className="flex items-center gap-2 max-w-sm">
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Clave de encriptación..."
                      className="flex-1 px-3.5 py-2 rounded-2xl bg-white dark:bg-stone-800 border border-amber-300/60 dark:border-stone-700 text-xs"
                    />
                    <button
                      onClick={handleUnlockVault}
                      className="px-4 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs"
                    >
                      Descifrar
                    </button>
                  </div>
                  {vaultError && <p className="text-red-500 text-[11px] mt-1.5">{vaultError}</p>}
                </div>
              )}

              {/* Document Content View */}
              <div className="p-5 rounded-3xl bg-stone-100/50 dark:bg-stone-800/40 border border-stone-200/40 dark:border-stone-800/60 text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-mono whitespace-pre-wrap min-h-[220px]">
                {selectedDoc.isEncrypted && !decryptedContent
                  ? '🔒 Contenido cifrado (AES-GCM). Introduce la clave para leer.'
                  : decryptedContent || selectedDoc.content}
              </div>
            </div>
          ) : (
            <div className="rounded-[36px] p-12 text-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-stone-200/50 dark:border-stone-800/50">
              <FolderArchive className="w-12 h-12 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500">Selecciona un documento para visualizar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md rounded-[36px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              Nuevo Documento / Nota de Contexto
            </h3>

            <form onSubmit={handleCreateDocument} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Lista de precios Don Mario..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as KitchenDocument['category'])}
                    className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  >
                    <option value="proveedores">Proveedores</option>
                    <option value="contrato">Contrato / Espacio</option>
                    <option value="bromatologia">Bromatología</option>
                    <option value="manual">Manual Operativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">Formato</label>
                  <select
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value as KitchenDocument['fileType'])}
                    className="w-full px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                  >
                    <option value="doc">Documento (.doc)</option>
                    <option value="pdf">PDF</option>
                    <option value="text">Texto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Contenido o Notas *</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Información, teléfonos de contacto, condiciones de pago..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="encCheck"
                  checked={shouldEncrypt}
                  onChange={(e) => setShouldEncrypt(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <label htmlFor="encCheck" className="text-[11px] text-stone-700 dark:text-stone-300">
                  Encriptar con clave de extremo a extremo (AES-GCM)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-2xl border text-stone-600 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
