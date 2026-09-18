'use client';

import React, { useState } from 'react';

interface BackupSectionProps {
  onRestoreSuccess?: () => void;
}

export default function BackupSection({ onRestoreSuccess }: BackupSectionProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalState, setModalState] = useState<'idle' | 'confirm' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Download do Backup diretamente via client-side Blob (evita problemas de iframe e garante JSON limpo)
  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('fardin_admin_token') : null;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/backup', { headers });

      if (!res.ok) {
        throw new Error('Falha ao gerar o arquivo de backup no servidor.');
      }

      const data = await res.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `backup-fardin-${today}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Erro ao baixar backup:', err);
      setErrorMessage(err.message || 'Não foi possível gerar o arquivo de backup.');
      setModalState('error');
    } finally {
      setDownloading(false);
    }
  };

  // Ao selecionar um arquivo JSON
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Por favor, selecione um arquivo no formato .JSON válido.');
      setModalState('error');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setModalState('confirm');
    event.target.value = ''; // Reseta input para permitir re-seleção
  };

  // Executa a restauração ao confirmar no Modal
  const executeRestore = async () => {
    if (!selectedFile) return;

    setModalState('loading');

    try {
      const text = await selectedFile.text();
      let jsonData;

      try {
        jsonData = JSON.parse(text);
      } catch {
        setErrorMessage('O arquivo selecionado está corrompido ou não é um JSON válido.');
        setModalState('error');
        return;
      }

      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      const result = await response.json();

      if (response.ok) {
        setModalState('success');
        if (onRestoreSuccess) {
          onRestoreSuccess();
        }
      } else {
        setErrorMessage(result.error || 'Falha ao processar a restauração no banco de dados.');
        setModalState('error');
      }
    } catch (err) {
      console.error('Erro na restauração:', err);
      setErrorMessage('Erro de conexão ao tentar comunicar com o servidor.');
      setModalState('error');
    }
  };

  const closeModal = () => {
    setModalState('idle');
    setSelectedFile(null);
    setErrorMessage('');
  };

  const handleSuccessReload = () => {
    closeModal();
    if (onRestoreSuccess) {
      onRestoreSuccess();
    }
    window.location.reload();
  };

  return (
    <>
      {/* SEÇÃO PRINCIPAL DE BACKUP */}
      <div className="bg-[#1f2128] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-teal-400">🗄️</span>
          <h3 className="text-xl font-bold text-white">Backup e Restauração do Sistema</h3>
        </div>
        <p className="text-gray-400 text-sm">
          Exporte ou restaure todos os produtos, categorias, dados de contato, configurações do site e referências de mídias em arquivo JSON.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Exportar */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
                <span>📥</span> Exportar Backup Completo
              </div>
              <p className="text-xs text-gray-400">
                Gera um arquivo JSON estruturado com todos os dados atuais do catálogo e configurações.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={downloading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg inline-flex items-center justify-center gap-2 text-sm transition-all shadow cursor-pointer"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Backup...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Exportar Backup (JSON)</span>
                </>
              )}
            </button>
          </div>

          {/* Restaurar */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <span>📤</span> Restaurar Backup (JSON)
              </div>
              <p className="text-xs text-gray-400">
                Carregue um arquivo JSON gerado pelo sistema para sincronizar produtos e configurações.
              </p>
            </div>
            <label className="w-full bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-white font-medium py-2.5 px-4 rounded-lg inline-flex items-center justify-center gap-2 text-sm transition-all shadow">
              <span>📤</span>
              <span>Carregar e Restaurar Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* MODAL CUSTOMIZADO LINDO */}
      {modalState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1f2128] border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            
            {/* ESTADO 1: CONFIRMAÇÃO */}
            {modalState === 'confirm' && (
              <>
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-3xl text-amber-400">
                  ⚠️
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Confirmar Restauração?</h4>
                  <p className="text-sm text-gray-300">
                    Você está prestes a restaurar o banco de dados utilizando o arquivo:
                  </p>
                  <div className="bg-gray-900/80 border border-gray-800 py-2 px-3 rounded-lg text-teal-400 font-mono text-xs break-all">
                    {selectedFile?.name}
                  </div>
                  <p className="text-xs text-amber-400/90 font-medium pt-1">
                    Atenção: Os dados atuais serão sobrescritos ou sincronizados com os dados deste arquivo.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeRestore}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg"
                  >
                    Sim, Restaurar
                  </button>
                </div>
              </>
            )}

            {/* ESTADO 2: CARREGANDO */}
            {modalState === 'loading' && (
              <div className="py-6 space-y-4">
                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Restaurando Dados...</h4>
                  <p className="text-xs text-gray-400">Por favor, aguarde enquanto atualizamos o banco Neon.</p>
                </div>
              </div>
            )}

            {/* ESTADO 3: SUCESSO */}
            {modalState === 'success' && (
              <>
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-3xl text-emerald-400">
                  ✅
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Backup Restaurado com Sucesso!</h4>
                  <p className="text-sm text-gray-300">
                    Os produtos, categorias e configurações do seu catálogo foram sincronizados perfeitamente.
                  </p>
                </div>
                <button
                  onClick={handleSuccessReload}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-lg mt-2"
                >
                  Recarregar Painel
                </button>
              </>
            )}

            {/* ESTADO 4: ERRO */}
            {modalState === 'error' && (
              <>
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-3xl text-rose-400">
                  ❌
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Falha na Restauração</h4>
                  <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 p-3 rounded-lg text-left font-mono">
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all mt-2"
                >
                  Fechar
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
