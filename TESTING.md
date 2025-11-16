<!-- Testing scenarios for HouseSpend AI -->

# Guía de pruebas

Esta lista cubre los flujos críticos introducidos: normalización de fechas, validación de valores en productos y manejo robusto de errores al analizar tickets.

## 1. Caso feliz: análisis exitoso
1. Ejecuta `docker compose up --build`.
2. Accede a `http://localhost:3000`, completa el wizard inicial (admin + API Key válida).
3. Sube un ticket legible (`Tickets > Subir ticket`).
4. Abre el ticket y pulsa **Analizar con IA**.
5. Verifica:
   - El estado cambia a **Analizado**.
   - Se muestran productos y el total.
   - No aparecen advertencias ni errores.

## 2. Fechas UTC (bug original)
1. Tras analizar un ticket, consulta la tabla `Tickets`:
   ```sql
   select "PurchaseDate" from "Tickets" where "Id" = {id};
   ```
2. Verifica que `PurchaseDate` tenga `+00` (UTC) y la app no lanza excepciones.

## 3. Validación de valores
1. Edita temporalmente la respuesta de OpenAI (puedes usar un proxy o simularla desde el servicio forzando valores negativos) para devolver un producto con `quantity <= 0`.
2. Repite el análisis.
3. Se espera:
   - El llamado responde **422** con mensaje “No se encontraron productos válidos…”.
   - El estado del ticket sigue como **Pendiente**.
   - No se insertan filas erróneas en `Products`.

## 4. Advertencias
1. Simula una respuesta donde sólo parte de los productos es válida (por ejemplo, mezcla de nombres vacíos y válidos).
2. Tras analizar, verifica:
   - El ticket se actualiza con los productos válidos.
   - Aparece un bloque amarillo con las advertencias recibidas.
   - El backend devuelve la cabecera `X-Analysis-Warnings`.

## 5. API Key faltante/incorrecta
1. En la tabla `AppConfigs`, borra el registro `OpenAI_ApiKey` o asigna un valor inválido.
2. Intenta analizar un ticket.
3. La API debe responder **400/401** con mensaje indicando que falta o es inválida la API key; la UI muestra el error.

## 6. OpenAI inaccesible
1. Desconecta la red o cambia temporalmente la URL en `OpenAIAnalysisService` (p.ej. `invalid.openai.com`).
2. Analiza un ticket.
3. El backend responde **503** (“No se pudo contactar con OpenAI…”) y la UI mantiene el ticket en estado Pendiente mostrando el mensaje.

## 7. Reintento manual
1. Después de un error (casos 3–6), presiona **Re-analizar**.
2. Cuando el servicio se restablece y el análisis es válido, el ticket pasa a Analizado y se limpian los mensajes de error.

## 8. Ticket list/dashboard
1. Ve a `Tickets`.
2. Verifica las insignias:
   - Verde: Analizado.
   - Gris: Pendiente.
3. En Dashboard, valida que el recuento “Analizados” coincide con los tickets marcados como tales.

> Nota: Para escenarios que requieren modificar la respuesta de OpenAI, puedes interceptar la llamada con una herramienta como [Mockoon](https://mockoon.com/) o temporalmente ajustar el servicio para devolver datos controlados.

