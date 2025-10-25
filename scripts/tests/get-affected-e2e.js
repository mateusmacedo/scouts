#!/usr/bin/env node

// Script para identificar projetos E2E afetados
const { execSync } = require('child_process');

console.log('🔍 Identificando projetos E2E afetados...');

try {
    // Executar nx affected para encontrar projetos com target e2e
    const affectedProjects = execSync('pnpm nx show projects --affected --with-target=e2e', { 
        encoding: 'utf8',
        stdio: 'pipe'
    }).trim().split('\n').filter(Boolean);

    if (affectedProjects.length === 0) {
        console.log('ℹ️ Nenhum projeto E2E afetado encontrado');
        process.exit(0);
    }

    console.log(`✅ ${affectedProjects.length} projetos E2E afetados encontrados:`);
    affectedProjects.forEach(project => console.log(`  - ${project}`));

    // Retornar como JSON para uso no workflow
    console.log(JSON.stringify(affectedProjects));

} catch (error) {
    console.log('⚠️ Erro ao identificar projetos E2E afetados:', error.message);
    console.log('[]'); // Retornar array vazio em caso de erro
}
