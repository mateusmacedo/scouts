#!/bin/bash

# Script para retry com exponential backoff
set -e

MAX_ATTEMPTS=${1:-3}
DELAY=${2:-5}
COMMAND="${@:3}"

if [ -z "$COMMAND" ]; then
    echo "❌ Comando não fornecido"
    echo "💡 Uso: $0 <max_attempts> <delay_seconds> <command>"
    exit 1
fi

echo "🔄 Executando com retry: $COMMAND"
echo "📊 Máximo de tentativas: $MAX_ATTEMPTS"
echo "⏱️ Delay entre tentativas: ${DELAY}s"

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    echo "🚀 Tentativa $attempt/$MAX_ATTEMPTS..."
    
    if eval "$COMMAND"; then
        echo "✅ Comando executado com sucesso na tentativa $attempt"
        exit 0
    else
        if [ $attempt -lt $MAX_ATTEMPTS ]; then
            echo "⚠️ Tentativa $attempt falhou, aguardando ${DELAY}s antes da próxima..."
            sleep $DELAY
            DELAY=$((DELAY * 2))  # Exponential backoff
        else
            echo "❌ Todas as $MAX_ATTEMPTS tentativas falharam"
            exit 1
        fi
    fi
done
