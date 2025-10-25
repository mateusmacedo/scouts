#!/usr/bin/env node

// Script para limpar arquivos de coverage individuais
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando arquivos de coverage individuais...');

// Função para remover arquivos de coverage individuais
const removeCoverageFiles = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            removeCoverageFiles(fullPath);
        } else if (item === 'lcov.info' || item.endsWith('.lcov')) {
            // Não remover se estiver no diretório consolidado
            if (!fullPath.includes('consolidated')) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️ Removido: ${fullPath}`);
            }
        }
    }
};

// Limpar arquivos de coverage
removeCoverageFiles('coverage');
removeCoverageFiles('.');

console.log('✅ Limpeza de coverage concluída');
