@echo off
setlocal

REM === In den Editor-Ordner wechseln (unabhängig vom Startort) ===
cd /d "%~dp0Editor"

set "VENDORPS=%TEMP%\setup_vendor.ps1"
set "TILEPS=%TEMP%\fetch_tiles_bgl.ps1"

REM ============================================================
REM = 1) PS-Skript: Leaflet/Draw lokal in Editor\assets\vendor =
REM ============================================================
> "%VENDORPS%" echo $ErrorActionPreference = 'Stop'
>> "%VENDORPS%" echo [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
>> "%VENDORPS%" echo $here       = '%CD%'
>> "%VENDORPS%" echo $root       = Join-Path $here 'assets\vendor'
>> "%VENDORPS%" echo $leaflet    = Join-Path $root 'leaflet'
>> "%VENDORPS%" echo $leafletImg = Join-Path $leaflet 'images'
>> "%VENDORPS%" echo $leafletDraw= Join-Path $root 'leaflet-draw'
>> "%VENDORPS%" echo New-Item -ItemType Directory -Force -Path $root, $leaflet, $leafletImg, $leafletDraw ^| Out-Null
>> "%VENDORPS%" echo function Get-IfMissing { param([string]$url,[string]$out) if(-not (Test-Path $out)) { Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing } }
>> "%VENDORPS%" echo if( (Test-Path (Join-Path $leaflet 'leaflet.js')) -and (Test-Path (Join-Path $leafletDraw 'leaflet.draw.js')) ) {
>> "%VENDORPS%" echo   Write-Host '[Setup] Leaflet/Draw bereits vorhanden.'
>> "%VENDORPS%" echo } else {
>> "%VENDORPS%" echo   Write-Host '[Setup] Lade Leaflet/Draw...'
>> "%VENDORPS%" echo   Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'          (Join-Path $leaflet     'leaflet.css')
>> "%VENDORPS%" echo   Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js'            (Join-Path $leaflet     'leaflet.js')
>> "%VENDORPS%" echo   Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.css' (Join-Path $leafletDraw 'leaflet.draw.css')
>> "%VENDORPS%" echo   Get-IfMissing 'https://cdn.jsdelivr.net/npm/leaflet-draw@1.0.4/dist/leaflet.draw.js'  (Join-Path $leafletDraw 'leaflet.draw.js')
>> "%VENDORPS%" echo   Get-IfMissing 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'           (Join-Path $leafletImg  'marker-icon.png')
>> "%VENDORPS%" echo   Get-IfMissing 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'        (Join-Path $leafletImg  'marker-icon-2x.png')
>> "%VENDORPS%" echo   Get-IfMissing 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'         (Join-Path $leafletImg  'marker-shadow.png')
>> "%VENDORPS%" echo }

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%VENDORPS%"
if errorlevel 1 (
  echo [Fehler] Vendor-Setup fehlgeschlagen. Abbruch.
  exit /b 1
)

REM ============================================================
REM = 2) PS-Skript: Tiles fuer Burgenlandkreis in assets\tiles =
REM =    (Naumburg + Umland; Zooms 13..16)                     =
REM ============================================================
> "%TILEPS%" echo param(
>> "%TILEPS%" echo   [string]$EditorRoot,
>> "%TILEPS%" echo   [double]$LatMin = 50.95, [double]$LatMax = 51.40,
>> "%TILEPS%" echo   [double]$LonMin = 11.50, [double]$LonMax = 12.20,
>> "%TILEPS%" echo   [int[]] $Zooms = @(10,11,12,13,14,15,16,17,18,19)
>> "%TILEPS%" echo )
>> "%TILEPS%" echo [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
>> "%TILEPS%" echo $base = Join-Path $EditorRoot 'assets\tiles'
>> "%TILEPS%" echo New-Item -ItemType Directory -Force -Path $base ^| Out-Null
>> "%TILEPS%" echo function LonLatToTileXY([double]$lon,[double]$lat,[int]$z){
>> "%TILEPS%" echo   $n = [math]::Pow(2,$z)
>> "%TILEPS%" echo   $x = [math]::Floor(($lon + 180.0)/360.0 * $n)
>> "%TILEPS%" echo   $latRad = $lat * [math]::PI/180.0
>> "%TILEPS%" echo   $y = [math]::Floor((1.0 - [math]::Log([math]::Tan($latRad) + 1.0/[math]::Cos($latRad))/[math]::PI)/2.0 * $n)
>> "%TILEPS%" echo   return @{x=$x;y=$y}
>> "%TILEPS%" echo }
>> "%TILEPS%" echo Write-Host ('[Tiles] BBOX lat[{0}..{1}] lon[{2}..{3}] Zooms {4}' -f $LatMin,$LatMax,$LonMin,$LonMax,($Zooms -join ','))
>> "%TILEPS%" echo foreach($z in $Zooms){
>> "%TILEPS%" echo   $min = LonLatToTileXY $LonMin $LatMax $z
>> "%TILEPS%" echo   $max = LonLatToTileXY $LonMax $LatMin $z
>> "%TILEPS%" echo   $x0 = [math]::Min($min.x,$max.x); $x1=[math]::Max($min.x,$max.x)
>> "%TILEPS%" echo   $y0 = [math]::Min($min.y,$max.y); $y1=[math]::Max($min.y,$max.y)
>> "%TILEPS%" echo   Write-Host ('[Tiles] z={0} -> x:{1}-{2}, y:{3}-{4}' -f $z,$x0,$x1,$y0,$y1)
>> "%TILEPS%" echo   for($x=$x0;$x -le $x1;$x++){
>> "%TILEPS%" echo     $outDir = Join-Path $base (Join-Path $z.ToString() $x.ToString())
>> "%TILEPS%" echo     New-Item -ItemType Directory -Force -Path $outDir ^| Out-Null
>> "%TILEPS%" echo     for($y=$y0;$y -le $y1;$y++){
>> "%TILEPS%" echo       $out = Join-Path $outDir ($y.ToString() + '.png')
>> "%TILEPS%" echo       if(-not (Test-Path $out)){
>> "%TILEPS%" echo         $url = 'https://tile.openstreetmap.org/{0}/{1}/{2}.png' -f $z,$x,$y
>> "%TILEPS%" echo         try {
>> "%TILEPS%" echo           Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 20 -Headers @{ 'User-Agent'='4D-Editor/1.0 (Naumburg)' }
>> "%TILEPS%" echo           Start-Sleep -Milliseconds 150
>> "%TILEPS%" echo         } catch {}
>> "%TILEPS%" echo       }
>> "%TILEPS%" echo     }
>> "%TILEPS%" echo   }
>> "%TILEPS%" echo }

REM Nur laden, wenn noch kein z13-Verzeichnis existiert
if not exist "assets\tiles\10" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%TILEPS%" -EditorRoot "%CD%"
) else (
  echo [Tiles] Lokale Tiles bereits vorhanden – Download uebersprungen.
)

REM ============================================================
REM = 3) venv aktivieren, Abhaengigkeiten, Editor starten      =
REM ============================================================
if not exist ".venv" (
  echo [Setup] Erstelle virtuelle Umgebung...
  py -m venv .venv
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -Command ^
  ". .\.venv\Scripts\Activate.ps1; " ^
  "python -m pip install --upgrade pip >$null; " ^
  "pip install PySide6 --quiet; " ^
  "python editor.py"

endlocal
