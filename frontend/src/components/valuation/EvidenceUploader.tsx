'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, Check, Trash2, FileText, Mic, Database, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EvidenceFile {
  type: 'interview' | 'document' | 'process' | 'database';
  file: File;
  uploaded?: boolean;
  url?: string;
}

interface EvidenceUploaderProps {
  questionId: number;
  onEvidenceChange: (files: Record<string, File | null>) => void;
  existingFiles?: {
    evidence_interview?: string;
    evidence_document?: string;
    evidence_process?: string;
    evidence_database?: string;
  };
  disabled?: boolean;
}

const EVIDENCE_TYPES = [
  { 
    key: 'interview', 
    label: 'مصاحبه', 
    icon: Mic, 
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    accept: '.mp3,.wav,.m4a,.mp4,.mov'
  },
  { 
    key: 'document', 
    label: 'سند', 
    icon: FileText, 
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accept: '.pdf,.doc,.docx,.xlsx,.pptx,.txt'
  },
  { 
    key: 'process', 
    label: 'فرآیند', 
    icon: GitBranch, 
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accept: '.bpmn,.xml,.json,.txt'
  },
  { 
    key: 'database', 
    label: 'پایگاه داده', 
    icon: Database, 
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accept: '.sql,.csv,.json,.xlsx'
  },
];

export function EvidenceUploader({ 
  questionId, 
  onEvidenceChange, 
  existingFiles = {},
  disabled = false 
}: EvidenceUploaderProps) {
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (type: string, file: File | null) => {
    if (!file) return;
    
    const newFiles = { ...files, [type]: file };
    setFiles(newFiles);
    onEvidenceChange(newFiles);
  };

  const handleRemoveFile = (type: string) => {
    const newFiles = { ...files, [type]: null };
    setFiles(newFiles);
    onEvidenceChange(newFiles);
    
    // Reset input
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type]!.value = '';
    }
  };

  const getFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <File className="w-4 h-4" />
        <span>شواهد (اختیاری):</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {EVIDENCE_TYPES.map((type) => {
          const Icon = type.icon;
          const hasFile = files[type.key] || existingFiles[type.key];
          const isUploading = uploading[type.key];

          return (
            <div
              key={type.key}
              className={`relative border-2 rounded-lg p-3 transition-all ${
                hasFile ? `${type.bg} ${type.border}` : 'border-dashed border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                ref={(el) => { fileInputRefs.current[type.key] = el; }}
                type="file"
                accept={type.accept}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleFileSelect(type.key, file);
                }}
                className="hidden"
                disabled={disabled || isUploading}
              />

              {hasFile ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${type.color}`} />
                    <span className="text-xs font-medium truncate flex-1">
                      {files[type.key]?.name || existingFiles[type.key]?.split('/').pop() || 'فایل'}
                    </span>
                  </div>
                  {files[type.key] && (
                    <p className="text-[10px] text-gray-400">
                      {getFileSize(files[type.key]!.size)}
                    </p>
                  )}
                  {!disabled && (
                    <button
                      onClick={() => handleRemoveFile(type.key)}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {existingFiles[type.key] && !files[type.key] && (
                    <a
                      href={existingFiles[type.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      مشاهده فایل
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.current[type.key]?.click()}
                  className="w-full text-center"
                  disabled={disabled}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`w-5 h-5 ${type.color}`} />
                    <span className="text-[10px] text-gray-500">{type.label}</span>
                    <Upload className="w-3 h-3 text-gray-400" />
                  </div>
                </button>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dark-green"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400">
        💡 می‌توانید برای هر سوال، چندین نوع شواهد متفاوت آپلود کنید
      </p>
    </div>
  );
}
