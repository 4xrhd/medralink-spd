import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// Hex to Tailwind token mapping
const colorMap = {
  // Brand primary (teal)
  '#1B365D': 'primary-700',
  '#152A48': 'primary-800',
  '#16294A': 'primary-800',
  '#1E40AF': 'primary-800',
  '#2563EB': 'primary-600',
  '#1D4ED8': 'primary-700',
  '#EFF6FF': 'primary-50',
  '#BFDBFE': 'primary-100',
  '#93C5FD': 'primary-200',

  // Ink (typography)
  '#0F172A': 'ink-900',
  '#1E293B': 'ink-900',
  '#334155': 'ink-600',
  '#475569': 'ink-600',
  '#64748B': 'ink-600',
  '#94A3B8': 'ink-400',

  // Surfaces & borders
  '#F8FAFC': 'canvas',
  '#F1F5F9': 'primary-50/60',
  '#E2E8F0': 'hair',
  '#CBD5E1': 'hair-strong',
  '#EEF2F7': 'canvas',

  // Semantics: Success (green/emerald)
  '#059669': 'success',
  '#047857': 'success',
  '#065F46': 'emerald-800',
  '#ECFDF5': 'emerald-50',
  '#A7F3D0': 'emerald-200',
  '#34D399': 'emerald-400',

  // Semantics: Critical (rose/red)
  '#DC2626': 'critical',
  '#B91C1C': 'rose-700',
  '#991B1B': 'rose-800',
  '#FEF2F2': 'rose-50',
  '#FECACA': 'rose-200',

  // Semantics: Warning (amber)
  '#D97706': 'warning',
  '#B45309': 'warning',
  '#92400E': 'amber-800',
  '#78350F': 'amber-900',
  '#FEF3C7': 'amber-50',
  '#FDE68A': 'amber-200',
  '#FCD34D': 'amber-300',

  // Semantics: Audit (purple)
  '#7C3AED': 'audit',
  '#6D28D9': 'violet-700',
  '#F5F3FF': 'violet-50',
  '#DDD6FE': 'violet-200',
};

// Prefixes that can precede -[#HEX]
const prefixPattern = '(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder)';
const regex = new RegExp(`\\b${prefixPattern}-\\[(#(?:[0-9a-fA-F]{3,8}))\\]`, 'g');

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(full, files);
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(srcDir);
let totalReplacements = 0;
const report = [];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let fileReplacements = 0;

  content = content.replace(regex, (match, prefix, hex) => {
    const upper = hex.toUpperCase();
    const token = colorMap[upper];
    if (token) {
      fileReplacements++;
      return `${prefix}-${token}`;
    }
    return match;
  });

  if (fileReplacements > 0) {
    fs.writeFileSync(file, content, 'utf8');
    report.push({ file: path.relative(srcDir, file), count: fileReplacements });
    totalReplacements += fileReplacements;
  }
}

console.log(`\nRetheme Codemod Complete: ${totalReplacements} arbitrary hex classes replaced.`);
console.table(report);
