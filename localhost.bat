@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

echo ============================================================
echo  Lokaler Preview-Server: http://localhost:8000/index.html
echo  Bibliotheken werden ggf. automatisch heruntergeladen ...
echo ============================================================
echo.

:: ---------- Verzeichnisse ----------
set "LIB=lib"
set "LEAFLET=%LIB%\leaflet"
set "LEAFLET_IMG=%LEAFLET%\images"
set "LDI=%LIB%\leaflet-distortableimage"

if not exist "%LIB%"         mkdir "%LIB%"
if not exist "%LEAFLET%"     mkdir "%LEAFLET%"
if not exist "%LEAFLET_IMG%" mkdir "%LEAFLET_IMG%"
if not exist "%LDI%"         mkdir "%LDI%"

:: ---------- URLs ----------
set "URL_LEAFLET_JS=https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
set "URL_LEAFLET_CSS=https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
set "URL_ICON=https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png"
set "URL_ICON2=https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png"
set "URL_SHADOW=https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"

:: DistortableImage (auf CDNs keine *.min.* + Maps nur als .js.map)
set "URL_LDI_JS=https://cdn.jsdelivr.net/npm/leaflet-distortableimage@0.21.9/dist/leaflet.distortableimage.js"
set "URL_LDI_CSS=https://cdn.jsdelivr.net/npm/leaflet-distortableimage@0.21.9/dist/leaflet.distortableimage.css"
set "URL_LDI_JS_ALT=https://cdn.jsdelivr.net/npm/leaflet-distortableimage-updated@2.0.5/dist/leaflet.distortableimage.js"
set "URL_LDI_CSS_ALT=https://cdn.jsdelivr.net/npm/leaflet-distortableimage-updated@2.0.5/dist/leaflet.distortableimage.css"
set "URL_LDI_JS_MAP=https://cdn.jsdelivr.net/npm/leaflet-distortableimage@0.21.9/dist/leaflet.distortableimage.js.map"
set "URL_LDI_JS_MAP_ALT=https://cdn.jsdelivr.net/npm/leaflet-distortableimage-updated@2.0.5/dist/leaflet.distortableimage.js.map"

:: ---------- Zielpfade ----------
set "DST_LEAFLET_JS=%LEAFLET%\leaflet.js"
set "DST_LEAFLET_CSS=%LEAFLET%\leaflet.css"
set "DST_LEAFLET_JS_MAP=%LEAFLET%\leaflet.js.map"
set "DST_LEAFLET_CSS_MAP=%LEAFLET%\leaflet.css.map"
set "DST_ICON=%LEAFLET_IMG%\marker-icon.png"
set "DST_ICON2=%LEAFLET_IMG%\marker-icon-2x.png"
set "DST_SHADOW=%LEAFLET_IMG%\marker-shadow.png"

:: DistortableImage lokal unter erwarteten Namen ablegen
set "DST_LDI_JS=%LDI%\leaflet.distortableimage.min.js"
set "DST_LDI_CSS=%LDI%\leaflet.distortableimage.min.css"
set "DST_LDI_JS_MAP=%LDI%\leaflet.distortableimage.js.map"
set "DST_LDI_JS_MAP_MIN=%LDI%\leaflet.distortableimage.min.js.map"
set "DST_LDI_CSS_MAP=%LDI%\leaflet.distortableimage.min.css.map"

:: ---------- Downloads sicherstellen ----------
call :ensureFile "%DST_LEAFLET_JS%"      "%URL_LEAFLET_JS%"
call :ensureFile "%DST_LEAFLET_CSS%"     "%URL_LEAFLET_CSS%"
call :ensureFile "%DST_LEAFLET_JS_MAP%"  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js.map"
:: Leaflet CSS-Map existiert nicht -> Stub erzeugen
if not exist "%DST_LEAFLET_CSS_MAP%" call :makeStubMap "%DST_LEAFLET_CSS_MAP%"

call :ensureFile "%DST_ICON%"            "%URL_ICON%"
call :ensureFile "%DST_ICON2%"           "%URL_ICON2%"
call :ensureFile "%DST_SHADOW%"          "%URL_SHADOW%"

:: LDI JS/CSS laden (nicht-minifizierte Datei, aber unter .min.* speichern)
call :ensureFile "%DST_LDI_JS%"          "%URL_LDI_JS%"
if not exist "%DST_LDI_JS%"  call :ensureFile "%DST_LDI_JS%"  "%URL_LDI_JS_ALT%"

call :ensureFile "%DST_LDI_CSS%"         "%URL_LDI_CSS%"
if not exist "%DST_LDI_CSS%" call :ensureFile "%DST_LDI_CSS%" "%URL_LDI_CSS_ALT%"

:: LDI JS-SourceMap laden (echte .js.map) + zusätzlich als .min.js.map ablegen
call :ensureFile "%DST_LDI_JS_MAP%"      "%URL_LDI_JS_MAP%"
if not exist "%DST_LDI_JS_MAP%"  call :ensureFile "%DST_LDI_JS_MAP%" "%URL_LDI_JS_MAP_ALT%"
if exist "%DST_LDI_JS_MAP%" (
  if not exist "%DST_LDI_JS_MAP_MIN%" copy /Y "%DST_LDI_JS_MAP%" "%DST_LDI_JS_MAP_MIN%" >nul
) else (
  if not exist "%DST_LDI_JS_MAP_MIN%" call :makeStubMap "%DST_LDI_JS_MAP_MIN%"
)

:: LDI CSS-Map existiert nicht -> Stub erzeugen
if not exist "%DST_LDI_CSS_MAP%" call :makeStubMap "%DST_LDI_CSS_MAP%"

echo.
echo ------------------------------------------------------------
echo  Bibliotheken sind vorhanden. Server wird gestartet ...
echo ------------------------------------------------------------
echo.

start "" "http://localhost:8000/index.html"
python -m http.server 8000
goto :eof


:: ================== Subroutinen ==================

:ensureFile
:: %1 = Zielpfad, %2 = URL
set "TARGET=%~1"
set "SRCURL=%~2"
if not defined TARGET  (echo FEHLER: kein Zielpfad uebergeben.& goto :eof)
if not defined SRCURL  (echo FEHLER: keine URL fuer "%TARGET%" uebergeben.& goto :eof)

if exist "%TARGET%" (
  for %%A in ("%TARGET%") do if %%~zA gtr 0 (
    echo OK   : %TARGET%
    goto :eof
  )
  echo HINW : %TARGET% existiert, ist aber leer. Lade neu ...
)

echo GET  : %SRCURL%
call :downloadPS "%SRCURL%" "%TARGET%"
if exist "%TARGET%" for %%A in ("%TARGET%") do if %%~zA gtr 0 (echo DONE : %TARGET%& goto :eof)

echo WARN : PowerShell fehlgeschlagen. Versuche curl ...
call :downloadCURL "%SRCURL%" "%TARGET%"
if exist "%TARGET%" for %%A in ("%TARGET%") do if %%~zA gtr 0 (echo DONE : %TARGET%& goto :eof)

echo WARN : curl fehlgeschlagen. Versuche certutil ...
call :downloadCERT "%SRCURL%" "%TARGET%"
if exist "%TARGET%" for %%A in ("%TARGET%") do if %%~zA gtr 0 (echo DONE : %TARGET%& goto :eof)

echo FEHLER: %TARGET% konnte nicht geladen werden.
goto :eof


:makeStubMap
:: %1 = Zielpfad (.map)
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p='%~1'; $d='{""version"":3,""sources"":[],""names"":[],""mappings"":""""}';" ^
  "New-Item -Force -ItemType File -Path $p | Out-Null; Set-Content -Path $p -Value $d -Encoding ASCII"
echo STUB : %~1
exit /b 0


:downloadPS
:: %1 = URL, %2 = Ziel
powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$u='%~1'; $o='%~2';" ^
  "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile($u,$o) } catch { exit 1 }"
if errorlevel 1 exit /b 1
exit /b 0

:downloadCURL
:: %1 = URL, %2 = Ziel
where curl >nul 2>nul || exit /b 1
curl -L --fail --silent --show-error -o "%~2" "%~1"
if errorlevel 1 exit /b 1
exit /b 0

:downloadCERT
:: %1 = URL, %2 = Ziel
certutil -urlcache -split -f "%~1" "%~2" >nul 2>&1
if errorlevel 1 exit /b 1
exit /b 0
