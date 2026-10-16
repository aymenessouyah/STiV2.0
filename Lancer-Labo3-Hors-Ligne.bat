@echo off
chcp 65001 >nul
title STI V2.0 By AE — Poste Labo 3 (100%% Hors-Ligne)
cd /d "%~dp0"

echo ==============================================================
echo   STI V2.0 By AE — Demarrage Hors-Ligne (Labo 3 : elevelabo3)
echo   Tous les fichiers remplaces dans ce dossier sont actifs !
echo ==============================================================

:: 1. Si PHP (XAMPP / Wamp / Laragon) est present sur le PC du Labo 3
if exist "C:\xampp\php\php.exe" (
    start "" "http://127.0.0.1:8088/index.html"
    "C:\xampp\php\php.exe" -S 127.0.0.1:8088 -t "%~dp0"
    goto :eof
)
where php >nul 2>nul
if %errorlevel%==0 (
    start "" "http://127.0.0.1:8088/index.html"
    php -S 127.0.0.1:8088 -t "%~dp0"
    goto :eof
)

:: 2. Si Python est present sur le PC du Labo 3
where python >nul 2>nul
if %errorlevel%==0 (
    start "" "http://127.0.0.1:8088/index.html"
    python -m http.server 8088 --bind 127.0.0.1
    goto :eof
)

:: 3. Sinon ouverture directe du fichier index.html local
start "" "%~dp0index.html"
