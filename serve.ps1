# Запуск локального сервера для просмотра сайта (нужно из-за ограничений file:///).
# Откроется http://localhost:8000/

Set-Location -LiteralPath $PSScriptRoot

$port = 8000
$url = "http://localhost:$port/index.html"

function Try-Run($exe, $args) {
  $cmd = Get-Command $exe -ErrorAction SilentlyContinue
  if ($null -ne $cmd) {
    Start-Process $url | Out-Null
    & $exe @args
    exit $LASTEXITCODE
  }
}

Try-Run "py" @("-m","http.server","$port")
Try-Run "python" @("-m","http.server","$port")
Try-Run "python3" @("-m","http.server","$port")

Write-Host "Не найден Python (py/python)." -ForegroundColor Yellow
Write-Host "Варианты:" 
Write-Host "1) Установить Python: https://www.python.org/downloads/" 
Write-Host "2) В VS Code поставить расширение Live Server и открыть index.html через него." 
exit 1
