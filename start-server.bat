@echo off
REM 社区网络设备维修管理系统 - 启动脚本

echo Starting backend server...
start "BackendServer" /B cmd /c "cd /d d:\demo01\backend && node server.js"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting public tunnel...
for /f "tokens=*" %%i in ('npx localtunnel --port 3000 2^>^&1 ^| findstr "your url is:"') do set TUNNEL_URL=%%i
echo %TUNNEL_URL%
echo.
echo =========================================
echo 公网访问地址已写入 public-url.txt
echo =========================================

pause
