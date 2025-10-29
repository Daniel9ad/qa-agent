#!/bin/bash
# Script para iniciar servidores MCP en Linux/Mac
# Ejecutar: chmod +x start-mcp-servers.sh && ./start-mcp-servers.sh

echo "🚀 Iniciando servidores MCP..."

# Crear directorio para logs si no existe
mkdir -p ./logs

# Función para iniciar un servidor MCP
start_mcp_server() {
    local name=$1
    local command=$2
    local port=$3
    
    echo "Iniciando $name en puerto $port..."
    
    # Iniciar el proceso en background
    nohup $command > "./logs/$name.log" 2>&1 &
    local pid=$!
    
    sleep 2
    
    # Verificar si el proceso está corriendo
    if ps -p $pid > /dev/null; then
        echo "✅ $name iniciado correctamente (PID: $pid)"
        echo $pid > "./logs/$name.pid"
    else
        echo "⚠️  Error al iniciar $name"
        echo "   Revisa el log en: ./logs/$name.log"
    fi
}

# Iniciar servidor Playwright MCP
start_mcp_server "playwright-mcp" "npx -y @playwright/mcp --port 3001" 3001

# Descomentar para iniciar más servidores MCP
# start_mcp_server "context7-mcp" "npx -y @context7/mcp --port 3002" 3002

echo ""
echo "✨ Servidores MCP iniciados!"
echo ""
echo "Para detener los servidores:"
echo "  kill \$(cat ./logs/*.pid)"
echo ""
echo "Los logs se encuentran en: ./logs/"
