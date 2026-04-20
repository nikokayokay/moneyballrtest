@echo off
cd /d "%~dp0"
start "" http://127.0.0.1:4173
call "C:\Program Files\nodejs\npm.cmd" run dev -- --host 127.0.0.1 --port 4173
