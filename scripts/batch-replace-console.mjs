#!/usr/bin/env node
/**
 * Batch replace console statements with proper logger calls
 * Processes all TypeScript files in main, renderer, and preload directories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configuration
const config = {
  main: {
    dir: path.join(rootDir, 'packages/main/src'),
    loggerPath: './utils/logger.js',
    importStatement: "import { getLogger } from 'RELATIVE_PATH';",
    getLoggerVar: (fileName) => `const logger = getLogger('${fileName}');`,
  },
  renderer: {
    dir: path.join(rootDir, 'packages/renderer/src'),
    loggerPath: '@/shared/utils/logger',
    importStatement: "import { getLogger } from '@/shared/utils/logger';",
    getLoggerVar: (fileName) => `const logger = getLogger('${fileName}');`,
  },
  preload: {
    dir: path.join(rootDir, 'packages/preload/src'),
    loggerPath: './logger',
    importStatement: "import { logger } from './logger';",
    getLoggerVar: () => '', // Use imported logger directly
  },
};

function getRelativePath(from, to) {
  let rel = path.relative(path.dirname(from), to);
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }
  return rel.replace(/\\/g, '/');
}

function processFile(filePath, processType) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Skip if no console statements
  if (!content.includes('console.')) {
    return { changed: false };
  }
  
  const fileName = path.basename(filePath, path.extname(filePath));
  const cfg = config[processType];
  
  // Check if logger import already exists
  const hasLoggerImport = lines.some(line => 
    line.includes('getLogger') || line.includes("from './logger'") || line.includes('from "./logger"')
  );
  
  // Replace console statements
  let changedLines = false;
  const newLines = lines.map(line => {
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return line;
    }
    
    // Skip if inside a comment block
    if (line.includes('console.') && (line.trim().startsWith('//') || line.includes('// console.'))) {
      return line;
    }
    
    let newLine = line;
    const loggerVar = processType === 'preload' ? 'logger' : 'logger';
    
    // Replace console statements
    if (line.includes('console.log(')) {
      newLine = newLine.replace(/console\.log\(/g, `${loggerVar}.info(`);
      changedLines = true;
    }
    if (line.includes('console.debug(')) {
      newLine = newLine.replace(/console\.debug\(/g, `${loggerVar}.debug(`);
      changedLines = true;
    }
    if (line.includes('console.info(')) {
      newLine = newLine.replace(/console\.info\(/g, `${loggerVar}.info(`);
      changedLines = true;
    }
    if (line.includes('console.warn(')) {
      newLine = newLine.replace(/console\.warn\(/g, `${loggerVar}.warn(`);
      changedLines = true;
    }
    if (line.includes('console.error(')) {
      newLine = newLine.replace(/console\.error\(/g, `${loggerVar}.error(`);
      changedLines = true;
    }
    
    return newLine;
  });
  
  if (!changedLines) {
    return { changed: false };
  }
  
  // Add logger import if needed
  if (!hasLoggerImport) {
    // Find last import statement
    let lastImportIndex = -1;
    for (let i = 0; i < newLines.length; i++) {
      const line = newLines[i].trim();
      if (line.startsWith('import ') && line.includes(' from ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      let importLine;
      let loggerVarLine = cfg.getLoggerVar(fileName);
      
      if (processType === 'main') {
        // Calculate relative path to logger
        const loggerFullPath = path.join(cfg.dir, '../utils/logger.js');
        const relativePath = getRelativePath(filePath, loggerFullPath);
        importLine = cfg.importStatement.replace('RELATIVE_PATH', relativePath);
      } else {
        importLine = cfg.importStatement;
      }
      
      // Insert after last import
      newLines.splice(lastImportIndex + 1, 0, '');
      newLines.splice(lastImportIndex + 2, 0, importLine);
      if (loggerVarLine) {
        newLines.splice(lastImportIndex + 3, 0, loggerVarLine);
      }
    }
  }
  
  const newContent = newLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  
  return { changed: true, file: filePath };
}

function getAllTypeScriptFiles(dir) {
  const files = [];
  
  function walk(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function main() {
  const processType = process.argv[2]; // 'main', 'renderer', or 'preload'
  
  if (!processType || !['main', 'renderer', 'preload'].includes(processType)) {
    console.log('Usage: node batch-replace-console.mjs <main|renderer|preload>');
    process.exit(1);
  }
  
  const cfg = config[processType];
  const files = getAllTypeScriptFiles(cfg.dir);
  
  console.log(`\nProcessing ${files.length} files in ${processType}...\n`);
  
  let changedCount = 0;
  const changedFiles = [];
  
  for (const file of files) {
    try {
      const result = processFile(file, processType);
      if (result.changed) {
        changedCount++;
        changedFiles.push(result.file);
        console.log(`✓ ${path.relative(cfg.dir, file)}`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n${changedCount} files updated out of ${files.length} total files.`);
  
  if (changedFiles.length > 0) {
    console.log('\nChanged files:');
    changedFiles.forEach(f => console.log(`  - ${path.relative(rootDir, f)}`));
  }
}

main();

