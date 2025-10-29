#!/bin/bash
# Script para detener servidores MCP en Linux/Mac
# Ejecutar: ./stop-mcp-servers.sh

echo "🛑 Deteniendo servidores MCP..."

# Detener procesos usando los PIDs guardados
if [ -d "./logs" ]; then
    for pidfile in ./logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            name=$(basename "$pidfile" .pid)
            
            if ps -p $pid > /dev/null; then
                echo "Deteniendo $name (PID: $pid)..."
                kill $pid
            else
                echo "⚠️  Proceso $name (PID: $pid) no está corriendo"
            fi
            
            rm "$pidfile"
        fi
    done
    
    echo "✅ Servidores MCP detenidos"
else
    echo "No se encontraron archivos PID"
fi

# Verificar puertos
echo ""
echo "Verificando puertos..."

for port in 3001 3002 3003; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Puerto $port todavía está en uso"
    else
        echo "✅ Puerto $port está libre"
    fi
done
