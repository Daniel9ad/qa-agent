# Script para iniciar servidores MCP en Windows con PowerShell
# Ejecutar: .\start-mcp-servers.ps1

Write-Host "🚀 Iniciando servidores MCP..." -ForegroundColor Green

# Crear directorio para logs si no existe
$logsDir = ".\logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
}

# Función para iniciar un servidor MCP
function Start-MCPServer {
    param (
        [string]$Name,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Iniciando $Name en puerto $Port..." -ForegroundColor Cyan
    
    $logFile = Join-Path $logsDir "$Name.log"
    
    # Iniciar el proceso en background
    Start-Process -FilePath "powershell.exe" `
                  -ArgumentList "-NoExit", "-Command", $Command `
                  -RedirectStandardOutput $logFile `
                  -WindowStyle Minimized
    
    Start-Sleep -Seconds 2
    
    # Verificar si el puerto está en uso
    $portTest = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    
    if ($portTest) {
        Write-Host "✅ $Name iniciado correctamente en puerto $Port" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $Name puede que no esté escuchando en puerto $Port todavía" -ForegroundColor Yellow
        Write-Host "   Revisa el log en: $logFile" -ForegroundColor Yellow
    }
}

# Iniciar servidor Playwright MCP
Start-MCPServer -Name "Playwright-MCP" `
                -Command "npx -y @playwright/mcp --port 3001" `
                -Port 3001

# Descomentar para iniciar más servidores MCP
# Start-MCPServer -Name "Context7-MCP" `
#                 -Command "npx -y @context7/mcp --port 3002" `
#                 -Port 3002

Write-Host ""
Write-Host "✨ Servidores MCP iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "Para detener los servidores:" -ForegroundColor Yellow
Write-Host "  Get-Process -Name node | Where-Object {$_.CommandLine -like '*mcp*'} | Stop-Process" -ForegroundColor Yellow
Write-Host ""
Write-Host "Los logs se encuentran en: $logsDir" -ForegroundColor Cyan
