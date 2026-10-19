@echo off
chcp 65001 >nul
title STI V2.0 By AE — Poste Labo 3 hors Internet
cd /d "%~dp0"
echo ==============================================================
echo   STI V2.0 By AE — Installation locale complete Labo 3
echo   Aucun identifiant ni connexion Internet n'est necessaire.
echo ==============================================================

if exist "C:\xampp\php\php.exe" (
  start "Serveur STI Labo 3" cmd /k ""C:\xampp\php\php.exe" -S 127.0.0.1:8088 -t "%~dp0""
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8088/index.html"
  exit /b
)
where php >nul 2>nul
if not errorlevel 1 (
  start "Serveur STI Labo 3" cmd /k "php -S 127.0.0.1:8088 -t "%~dp0""
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8088/index.html"
  exit /b
)
where python >nul 2>nul
if not errorlevel 1 (
  start "Serveur STI Labo 3" cmd /k "python -m http.server 8088 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8088/index.html"
  exit /b
)
where py >nul 2>nul
if not errorlevel 1 (
  start "Serveur STI Labo 3" cmd /k "py -3 -m http.server 8088 --bind 127.0.0.1"
  timeout /t 2 /nobreak >nul
  start "" "http://127.0.0.1:8088/index.html"
  exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Lancer-Labo3-Hors-Ligne.ps1"
