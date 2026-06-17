@echo off
chcp 65001 > nul
title Universidad X -- Launcher

:: ============================================================================
:: START.bat -- Universidad X | Lanzador Rapido (Windows)
:: ============================================================================
:: Uso:
::   START.bat           -> Levanta infraestructura + abre UIs
::   START.bat stop      -> Detiene todos los servicios
::   START.bat status    -> Estado de contenedores
::   START.bat web       -> Solo inicia el frontend Next.js
::   START.bat reset     -> Reseteo total (borra volumenes)
::   START.bat logs      -> Ver logs en tiempo real
:: ============================================================================

echo.
echo  ================================================
echo    U N I V E R S I D A D   X
echo    Plataforma Educativa -- Dev Stack
echo  ================================================
echo.

cd /d "%~dp0"

if "%1"=="stop"   goto :STOP
if "%1"=="status" goto :STATUS
if "%1"=="web"    goto :WEB_ONLY
if "%1"=="reset"  goto :RESET
if "%1"=="logs"   goto :LOGS

:: -- Arranque normal ----------------------------------------------------------
:START
echo  [1/4] Verificando Docker...
docker info > nul 2>&1
if errorlevel 1 (
    echo  [X] Docker Desktop no esta corriendo.
    echo      Abrelo y vuelve a ejecutar START.bat
    pause
    exit /b 1
)
echo  [OK] Docker Desktop activo

echo.
echo  [2/4] Levantando infraestructura Docker...
echo        PostgreSQL - MongoDB - Redis - pgAdmin - MongoExpress
docker compose up -d
if errorlevel 1 (
    echo  [X] Error en Docker Compose. Revisa: docker compose logs
    pause
    exit /b 1
)
echo  [OK] Contenedores iniciados

echo.
echo  [3/4] Esperando que los servicios respondan (10 seg)...
timeout /t 10 /nobreak > nul
echo  [OK] Listo

echo.
echo  [4/4] URLs de acceso:
echo.
echo   BASES DE DATOS:
echo     PostgreSQL  ->  localhost:5436   (universidadx)
echo     MongoDB     ->  localhost:27017  (universidadx)
echo     Redis       ->  localhost:6379
echo.
echo   INTERFACES WEB:
echo     pgAdmin       ->  http://localhost:5050  (admin@universidadx.com / admin1234)
echo     MongoExpress  ->  http://localhost:8082  (admin / admin1234)
echo.
echo   FRONTEND (ejecutar por separado):
echo     Next.js Dev   ->  http://localhost:3000
echo     Comando:  START.bat web
echo.

set /p OPEN_UI="  Abrir UIs en el navegador? [s/N]: "
if /i "%OPEN_UI%"=="s" (
    start "" "http://localhost:5050"
    timeout /t 1 /nobreak > nul
    start "" "http://localhost:8082"
    echo  [OK] Navegador abierto
)

echo.
echo  Infraestructura lista.
echo.
goto :END

:: -- Solo frontend ------------------------------------------------------------
:WEB_ONLY
echo  Iniciando frontend Next.js...
if not exist "web\node_modules" (
    echo  Instalando dependencias npm...
    cd web
    npm install
    cd ..
)
echo  Abriendo http://localhost:3000
start "" "http://localhost:3000"
cd web && npm run dev
goto :END

:: -- Status -------------------------------------------------------------------
:STATUS
echo  Estado de contenedores:
echo.
docker compose ps
echo.
goto :END

:: -- Stop ---------------------------------------------------------------------
:STOP
echo  Deteniendo servicios...
docker compose down
echo  [OK] Servicios detenidos.
goto :END

:: -- Reset (borra volumenes) --------------------------------------------------
:RESET
echo.
echo  ADVERTENCIA: Se eliminaran TODOS los datos de BD.
set /p CONFIRM="  Escribe RESET para confirmar: "
if "%CONFIRM%"=="RESET" (
    docker compose down -v --remove-orphans
    echo  [OK] Reset completo. Ejecuta START.bat para reiniciar.
) else (
    echo  Cancelado.
)
goto :END

:: -- Logs ---------------------------------------------------------------------
:LOGS
docker compose logs --tail=50 --follow
goto :END

:END
if "%1"=="" pause
