# Script para detener servidores MCP en Windows con PowerShell
# Ejecutar: .\stop-mcp-servers.ps1

Write-Host "🛑 Deteniendo servidores MCP..." -ForegroundColor Red

# Buscar y detener procesos de Node.js que contengan 'mcp' en su línea de comandos
$mcpProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like '*mcp*'
}

if ($mcpProcesses) {
    Write-Host "Encontrados $($mcpProcesses.Count) procesos MCP" -ForegroundColor Yellow
    
    foreach ($process in $mcpProcesses) {
        Write-Host "Deteniendo proceso $($process.Id)..." -ForegroundColor Cyan
        Stop-Process -Id $process.Id -Force
    }
    
    Write-Host "✅ Servidores MCP detenidos" -ForegroundColor Green
} else {
    Write-Host "No se encontraron servidores MCP en ejecución" -ForegroundColor Yellow
}

# Verificar puertos
Write-Host ""
Write-Host "Verificando puertos..." -ForegroundColor Cyan

$ports = @(3001, 3002, 3003)
foreach ($port in $ports) {
    $portTest = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
    
    if ($portTest) {
        Write-Host "⚠️  Puerto $port todavía está en uso" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Puerto $port está libre" -ForegroundColor Green
    }
}
