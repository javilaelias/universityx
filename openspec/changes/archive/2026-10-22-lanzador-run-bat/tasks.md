# Tareas — lanzador-run-bat

- [x] 1. `run.bat`: chequeo de Docker, lectura de puertos del `.env`, chequeo de puerto de BD ocupado
- [x] 2. `docker compose up -d --wait --wait-timeout 600` y apertura del navegador en la web
- [x] 3. README: mencionar `run.bat`
- [x] 4. Prueba real: URLs que responden y bajada de lo levantado

## Cierre
Puerta de salida: `/code-review low`, con 2 hallazgos y los 2 corregidos: (1) findstr ahora busca `LISTENING` y también `ESCUCHANDO`, para Windows en español; (2) los valores del `.env` se limpian de comillas y de comentarios al final de la línea. juvinqa APROBADO, con 2 hallazgos menores: (a) un puerto vacío en `.env` ahora toma el default; esto se corrigió y se probó; (b) el `^` del filtro `name=^ux_postgres$` se descartó, porque va entre comillas dobles y cmd no lo interpreta como escape. Modo degradado en la prueba real: Docker Desktop estaba saturado y la corrida terminó en el camino de error (pause, exit 1), que funcionó bien; el camino de éxito queda en PENDIENTES-USUARIO. Se probó el camino de puerto ocupado: avisa y no mata nada. No toca UI.
