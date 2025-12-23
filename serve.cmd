@echo off
cd /d "%~dp0"
set PORT=8000
echo Запуск локального сервера на http://localhost:%PORT%/
echo Оставьте это окно открытым.
echo.
echo Открою сайт в браузере: http://localhost:%PORT%/index.html
timeout /t 1 /nobreak >nul
start "" "http://localhost:%PORT%/index.html"
py -m http.server %PORT%
pause
