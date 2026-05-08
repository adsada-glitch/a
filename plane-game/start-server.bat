@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo 星际生存战 — 本地预览
echo 请在浏览器地址栏输入（整行复制）:
echo   http://localhost:8765/
echo.
echo 不要双击打开 index.html（会打不开模块脚本）。
echo 按 Ctrl+C 可停止服务器。
echo.
where py >nul 2>&1 && py -m http.server 8765 && goto :end
where python >nul 2>&1 && python -m http.server 8765 && goto :end
echo 未找到 Python。请安装 Python 3，或改用 VS Code 的 Live Server 扩展。
pause
:end
