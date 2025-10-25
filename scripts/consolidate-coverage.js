#!/usr/bin/env node

// Script para consolidar coverage JS/TS
const fs = require('fs');
const path = require('path');

console.log('📊 Consolidando coverage JS/TS...');

// Criar diretório de coverage consolidado
const consolidatedDir = 'coverage/consolidated';
if (!fs.existsSync(consolidatedDir)) {
    fs.mkdirSync(consolidatedDir, { recursive: true });
}

// Encontrar arquivos de coverage
const coverageFiles = [];
const findCoverageFiles = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            findCoverageFiles(fullPath);
        } else if (item === 'lcov.info' || item.endsWith('.lcov')) {
            coverageFiles.push(fullPath);
        }
    }
};

// Buscar arquivos de coverage
findCoverageFiles('coverage');
findCoverageFiles('.');

console.log(`🔍 Encontrados ${coverageFiles.length} arquivos de coverage:`);
coverageFiles.forEach(file => console.log(`  - ${file}`));

if (coverageFiles.length === 0) {
    console.log('⚠️ Nenhum arquivo de coverage encontrado');
    process.exit(0);
}

// Consolidar arquivos LCOV
const consolidatedContent = [];
let headerWritten = false;

for (const file of coverageFiles) {
    try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
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
    } catch (error) {
        console.log(`⚠️ Erro ao processar ${file}: ${error.message}`);
    }
}

// Salvar arquivo consolidado
const outputFile = path.join(consolidatedDir, 'consolidated.info');
fs.writeFileSync(outputFile, consolidatedContent.join('\n'));

console.log(`✅ Coverage consolidado salvo em: ${outputFile}`);
console.log(`📏 Total de linhas: ${consolidatedContent.length}`);
