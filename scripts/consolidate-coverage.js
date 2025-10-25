#!/usr/bin/env node

// Script para consolidar coverage JS/TS - Otimizado com processamento incremental
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cores para output
const colors = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function log(message, color = colors.blue) {
    console.log(`${color}${message}${colors.reset}`);
}

function logInfo(message) { log(`ℹ️  ${message}`, colors.blue); }
function logSuccess(message) { log(`✅ ${message}`, colors.green); }
function logWarning(message) { log(`⚠️  ${message}`, colors.yellow); }
function logError(message) { log(`❌ ${message}`, colors.red); }

logInfo('Consolidando coverage JS/TS (otimizado)...');

// Criar diretório de coverage consolidado
const consolidatedDir = 'coverage/consolidated';
if (!fs.existsSync(consolidatedDir)) {
    fs.mkdirSync(consolidatedDir, { recursive: true });
}

// Arquivo de hash para tracking incremental
const hashFile = path.join(consolidatedDir, '.coverage-hash');
let processedHashes = new Set();

// Carregar hashes processados anteriormente
if (fs.existsSync(hashFile)) {
    try {
        const hashData = fs.readFileSync(hashFile, 'utf8');
        processedHashes = new Set(hashData.split('\n').filter(Boolean));
        logInfo(`Carregados ${processedHashes.size} hashes de processamento anterior`);
    } catch (error) {
        logWarning('Não foi possível carregar hashes anteriores, processando tudo');
    }
}

// Função para calcular hash de arquivo
function calculateFileHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

// Encontrar arquivos de coverage
const coverageFiles = [];
const newCoverageFiles = [];
const findCoverageFiles = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            findCoverageFiles(fullPath);
        } else if (
            item === 'lcov.info' || 
            item.endsWith('.lcov') || 
            item.endsWith('.out') ||
            item.includes('coverage') ||
            item.includes('lcov')
        ) {
            coverageFiles.push(fullPath);
            
            // Verificar se é um arquivo novo ou modificado
            const fileHash = calculateFileHash(fullPath);
            if (!processedHashes.has(fileHash)) {
                newCoverageFiles.push(fullPath);
                processedHashes.add(fileHash);
            }
        }
    }
};

// Buscar arquivos de coverage
findCoverageFiles('coverage');
findCoverageFiles('.');

logInfo(`Encontrados ${coverageFiles.length} arquivos de coverage total`);
logInfo(`${newCoverageFiles.length} arquivos novos ou modificados`);

if (coverageFiles.length === 0) {
    logWarning('Nenhum arquivo de coverage encontrado');
    process.exit(0);
}

// Se não há arquivos novos, verificar se já existe consolidação
if (newCoverageFiles.length === 0) {
    const existingConsolidated = path.join(consolidatedDir, 'consolidated.info');
    if (fs.existsSync(existingConsolidated)) {
        logSuccess('Nenhum arquivo novo, usando consolidação existente');
        process.exit(0);
    }
}

// Consolidar arquivos de coverage (apenas os novos ou modificados)
const consolidatedContent = [];
let headerWritten = false;
const filesToProcess = newCoverageFiles.length > 0 ? newCoverageFiles : coverageFiles;

logInfo(`Processando ${filesToProcess.length} arquivos de coverage`);

for (const file of filesToProcess) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        // Detectar tipo de arquivo
        const isLcovFile = file.includes('lcov') || file.endsWith('.lcov');
        const isGoCoverage = file.includes('go') || file.endsWith('.out');
        
        if (isLcovFile) {
            // Processar arquivo LCOV
            for (const line of lines) {
                if (line.startsWith('SF:')) {
                    if (!headerWritten) {
                        consolidatedContent.push('TN:');
                        headerWritten = true;
                    }
                    consolidatedContent.push(line);
                } else if (line.startsWith('DA:') || line.startsWith('LF:') || line.startsWith('LH:') || line.startsWith('end_of_record')) {
                    consolidatedContent.push(line);
                }
            }
        } else if (isGoCoverage) {
            // Converter coverage Go para formato LCOV
            logInfo(`Convertendo coverage Go: ${file}`);
            // Adicionar header para Go coverage
            if (!headerWritten) {
                consolidatedContent.push('TN:');
                headerWritten = true;
            }
            consolidatedContent.push(`SF:${file}`);
            consolidatedContent.push('end_of_record');
        } else {
            // Tentar processar como LCOV genérico
            for (const line of lines) {
                if (line.startsWith('SF:') || line.startsWith('DA:') || line.startsWith('LF:') || line.startsWith('LH:') || line.startsWith('end_of_record')) {
                    if (line.startsWith('SF:') && !headerWritten) {
                        consolidatedContent.push('TN:');
                        headerWritten = true;
                    }
                    consolidatedContent.push(line);
                }
            }
        }
    } catch (error) {
        logError(`Erro ao processar ${file}: ${error.message}`);
    }
}

// Salvar arquivo consolidado
const outputFile = path.join(consolidatedDir, 'consolidated.info');
fs.writeFileSync(outputFile, consolidatedContent.join('\n'));

// Salvar hashes processados
fs.writeFileSync(hashFile, Array.from(processedHashes).join('\n'));

logSuccess(`Coverage consolidado salvo em: ${outputFile}`);
logInfo(`Total de linhas: ${consolidatedContent.length}`);
logInfo(`Arquivos processados: ${filesToProcess.length}`);

