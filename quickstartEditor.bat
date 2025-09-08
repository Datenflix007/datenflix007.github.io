@echo off
setlocal

REM === In den Editor-Ordner wechseln (unabhängig vom Startort) ===
cd /d "%~dp0Editor"

REM === Leaflet/Draw lokal bereitstellen: Editor\assets\vendor\... ===
if not exist "assets\vendor\leaflet" (
  echo [Setup] Lade Leaflet/Draw herunter...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;" ^
  "$here = (Get-Location).Path;" ^
  "$root = Join-Path $here 'assets\vendor';" ^
  "$leaflet      = Join-Path $root 'leaflet';" ^
  "$leafletImg   = Join-Path $leaflet 'images';" ^
  "$leafletDraw  = Join-Path $root 'leaflet-draw';" ^
  "New-Item -ItemType Directory -Force -Path $root, $leaflet, $leafletImg, $leafletDraw | Out-Null;" ^
  "function Get-IfMissing { param([string]$url,[string]$out) if(-not (Test-Path $out)) { Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing } }" ^
  "Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'            (Join-Path $leaflet     'leaflet.css');" ^
  "Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'              (Join-Path $leaflet     'leaflet.js');" ^
  "Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.css'   (Join-Path $leafletDraw 'leaflet.draw.css');" ^
  "Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.js'    (Join-Path $leafletDraw 'leaflet.draw.js');" ^
  "Get-IfMissing 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'             (Join-Path $leafletImg  'marker-icon.png');" ^
  "Get-IfMissing 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'          (Join-Path $leafletImg  'marker-icon-2x.png');" ^
  "Get-IfMissing 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'           (Join-Path $leafletImg  'marker-shadow.png');"
) else (
  echo [Setup] Leaflet/Draw bereits vorhanden.
)


REM === Virtuelle Umgebung anlegen (falls fehlt) ===
if not exist ".venv" (
  echo [Setup] Erstelle virtuelle Umgebung...
  py -m venv .venv
)

REM === venv aktivieren, Abhaengigkeiten installieren, Editor starten ===
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -Command ^
  ". .\.venv\Scripts\Activate.ps1; " ^
  "python -m pip install --upgrade pip >$null; " ^
  "pip install PySide6 --quiet; " ^
  "python editor.py"

endlocal
