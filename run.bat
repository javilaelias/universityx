@echo off
setlocal
chcp 65001 > nul
title Universidad X -- run.bat

:: ============================================================================
:: run.bat -- levanta la app completa (BD, microservicios y web) y abre el navegador.
:: Todo corre en docker-compose.yml: "up -d --wait" espera los healthchecks
:: (la BD queda sana antes que los servicios, por los depends_on).
:: Nunca destructivo: sin down, -v, seeds ni reset. Para detener: START.bat stop
:: ============================================================================

cd /d "%~dp0"

set "PGPORT=5432"
set "WEBPORT=3300"
if exist ".env" for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="POSTGRES_PORT" set "PGPORT=%%B"
    if /i "%%A"=="WEB_PORT" set "WEBPORT=%%B"
)
if not defined PGPORT set "PGPORT=5432"
if not defined WEBPORT set "WEBPORT=3300"
:: Sin comillas ni comentario al final de la linea (POSTGRES_PORT=5433 # ...)
set "PGPORT=%PGPORT:"=%"
set "WEBPORT=%WEBPORT:"=%"
for /f "tokens=1" %%P in ("%PGPORT%") do set "PGPORT=%%P"
for /f "tokens=1" %%P in ("%WEBPORT%") do set "WEBPORT=%%P"

echo  [1/3] Verificando Docker...
docker info > nul 2>&1
if errorlevel 1 (
    echo  [X] Docker Desktop no esta corriendo. Abrelo y vuelve a ejecutar run.bat
    goto :ERROR
)

set "PGUP="
for /f %%I in ('docker ps -q --filter "name=^ux_postgres$" --filter "status=running"') do set "PGUP=1"
if not defined PGUP (
    netstat -ano | findstr /r /c:":%PGPORT% .*LISTENING" /c:":%PGPORT% .*ESCUCHANDO" > nul
    if not errorlevel 1 (
        echo  [X] El puerto %PGPORT% de la BD ya esta en uso por otro proceso.
        echo      No se detiene nada. Liberalo o cambia POSTGRES_PORT en .env
        goto :ERROR
    )
)

echo  [2/3] Levantando BD, microservicios y web (espera a que esten sanos)...
:: Una BD lenta en arrancar (recuperacion tras un apagado brusco) puede marcarse
:: unhealthy antes de sanar y frenar a sus dependientes: se reintenta hasta 3 veces.
set /a INTENTO=1
:UP
docker compose up -d --wait --wait-timeout 600
if not errorlevel 1 goto :ABRIR
if %INTENTO% geq 3 (
    echo  [X] Algun servicio no quedo sano. Revisa: docker compose ps / docker compose logs
    goto :ERROR
)
set /a INTENTO+=1
echo  [!] Algun servicio aun no esta sano. Reintento %INTENTO% de 3 en 20 s...
ping -n 21 127.0.0.1 > nul
goto :UP

:ABRIR

echo  [3/3] Abriendo http://localhost:%WEBPORT%
start "" "http://localhost:%WEBPORT%"
echo.
echo  Listo. Para detener: START.bat stop
exit /b 0

:ERROR
pause
exit /b 1
