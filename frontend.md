# Frontend
Sitio público, panel del comercio y panel del equipo en una sola app. Habla con la API de `backend.md`.
React 18 + Vite + TypeScript, React Router y TanStack Query. En Docker se sirve con nginx, que además hace proxy de `/api` hacia el servicio `api`.
## Quién entra
- Cualquiera: la landing (`/`), los planes, los documentos legales, el formulario de IA personalizada y el botón de arrepentimiento.
- Comercio: se registra en `/registro`, entra por `/ingresar` y usa `/cuenta/*`. Su sesión se guarda en `orbita.cuenta`.
- Equipo: entra por `/admin/login` y usa `/admin/*`. Su sesión se guarda en `orbita.token`. `/login` redirige acá.
Las dos sesiones son independientes. `api()` elige el token según la ruta (`/cuenta/*` usa el del comercio) y, ante un `401`, manda al login que corresponde.
## Identidad visual
Azul noche (`--noche`), violeta de marca (`--primary`) y un acento ámbar (`--acento`) que es el satélite del logo. El logo es un SVG en `components/Sitio.tsx`, junto con el header y el footer del sitio. Todo el estilo vive en `styles.css`.
## Sitio público
### Landing (`/`)
Hero con una conversación de ejemplo, canales compatibles, beneficios, cómo funciona en cuatro pasos, planes (de `GET /publico/planes`, con selector de transferencia o Mercado Pago), bloque de confianza (sin permanencia, 10 días para arrepentirse, datos protegidos, pagos seguros), preguntas frecuentes y llamado final. Cada plan lleva a `/registro?plan=...&medio=...`; Personalizado lleva a `/contacto`.
### Documentos legales
- `/terminos` y `/privacidad`: texto versionado. La versión está en `legal/empresa.ts` (`VERSION_LEGAL`) y tiene que coincidir con `LEGAL` del backend.
- Los datos de la empresa (razón social, CUIT, domicilio, emails, jurisdicción) están en `EMPRESA`, en el mismo archivo. Hoy tienen marcadores entre corchetes que hay que completar antes de publicar.
- `/arrepentimiento`: formulario del botón de arrepentimiento (Res. 424/2020). Devuelve un código de trámite. El link está en el footer de todas las páginas públicas.
### Contacto (`/contacto`)
Pedido de IA personalizada: nombre, email, teléfono opcional, empresa, rubro y qué necesita. Hay que aceptar la Política de Privacidad. Tiene un campo trampa oculto contra bots.
### Página de pago (`/p/:token`)
Sin cuenta, para fichas creadas por el equipo: plan, importe, vencimiento, uso del mes y cómo pagar (Mercado Pago o datos de transferencia).
## Panel del comercio
### Registro, ingreso y contraseña
- `/registro`: elige plan y medio, completa negocio, rubro, nombre, email y contraseña, y marca dos casillas obligatorias (Términos, que incluye que la IA puede equivocarse, y Privacidad). El botón queda deshabilitado hasta marcar las dos.
- `/ingresar`: email y contraseña.
- `/restablecer/:token`: elige contraseña nueva con el link que le pasa el equipo.
### Inicio (`/cuenta`)
1. Sin pago acreditado: bienvenida y cómo pagar. Con Mercado Pago, un botón lleva a aprobar el débito. Con transferencia, alias, importe y concepto para copiar. La pantalla se refresca sola cada 30 segundos hasta que el pago se acredita.
2. Con pago y sin terminar: el tutorial.
3. Terminado: estado de la IA (pausar o activar), plan y vencimiento, uso del día, la semana y el período, y próximos turnos si el plan los tiene.
Si hay una versión nueva de los documentos legales, un modal bloquea el panel hasta aceptarla.
### Tutorial
Los pasos dependen del plan:
| Paso | Mensajes | Turnos | Completo | Personalizado |
|---|---|---|---|---|
| Bienvenida (qué incluye el plan) | sí | sí | sí | sí |
| Tu equipo de Orbita | | | | sí |
| Tu negocio | sí | sí | sí | sí |
| Turnos (servicios, horarios, duración, anticipación) | | sí | sí | sí |
| Estilo y preguntas frecuentes | sí | sí | sí | sí |
| Conectar ManyChat (datos y guía del flujo) | sí | sí | sí | sí |
| Canales (hasta el máximo del plan) | sí | sí | sí | sí |
| Mensajes fijos | sí | sí | sí | sí |
| Recordatorios | | | sí | sí |
| Probá tu IA (simulador) | sí | sí | sí | sí |
| Activar (lista de requisitos) | sí | sí | sí | sí |
Cada paso guarda en el backend y avanza. El progreso se guarda, así que se puede dejar y retomar. Desde la lista lateral se vuelve a cualquier paso ya visitado. El paso Activar muestra qué falta y lleva al paso para completarlo.
### Secciones
- **Mi IA** (`/cuenta/ia`): información del negocio, mensajes fijos e instrucciones avanzadas (el prompt, editable a mano).
- **Probar** (`/cuenta/probar`): el simulador, con mensajes sugeridos según el plan. No envía nada ni consume el plan.
- **Conexión** (`/cuenta/conexion`): datos de ManyChat, canales y la guía del flujo con la URL de entrada, la de salida y la `X-Orbita-Key` para copiar.
- **Agenda** (`/cuenta/agenda`): turnos, solo en planes con turnos.
- **Plan y pagos** (`/cuenta/plan`): pago, cambio de plan o de medio (Personalizado se coordina con el equipo) e historial de pagos.
- **Ajustes** (`/cuenta/ajustes`): datos de la cuenta, cambio de contraseña, links legales y cómo darse de baja.
## Panel del equipo
### Resumen (`/admin`)
Tarjetas de MRR, cobrado en 30 días, MRR en riesgo, clientes activos, respuestas de hoy y arrepentimientos abiertos. Gráficos de barras (SVG) de ingresos por mes y respuestas por día. Bloques de clientes por estado y plan, embudo de registro, cobranza y tickets. Alertas de clientes cerca del tope (candidatos a subir de plan) y vencimientos de la semana.
### Clientes (`/admin/clientes`)
Una fila por cliente: nombre, plan, canales, estado del bot (marca los que están en onboarding) y estado del pago.
### Alta (`/admin/clientes/nuevo`)
Igual que antes: nombre y `clientId`, plan (sin Personalizado), medio, canales, datos de ManyChat, email y prompt. Muestra el precio según el medio.
### Ficha (`/admin/clientes/:id`)
Estado, **cuenta del cliente**, plan, uso, canales, prompt, textos fijos, agenda e integración con ManyChat. En la cuenta del cliente se ve el usuario, el alta y el último ingreso, con un botón para generar el link de restablecimiento. Si la ficha no tiene usuario (alta del equipo o ticket), se lo invita con email y nombre y se obtiene el link para que elija contraseña.
### Tickets (`/admin/tickets`)
Selector de tipo (IA personalizada o arrepentimientos) y filtro por estado. Los de IA personalizada se cotizan y se convierten en ficha con plan Personalizado. Los arrepentimientos se responden dentro de las 24 h y no se convierten.
## Datos que lee
Todas las llamadas van a `/api` (variable `VITE_API_URL` para cambiarlo).
| Pantalla | Llamadas |
|---|---|
| Landing y registro | `GET /publico/planes`, `POST /cuenta/registro` |
| Ingreso y contraseña | `POST /cuenta/login`, `POST /cuenta/restablecer` |
| Panel del comercio | `GET /cuenta/me`, `/uso`, `/turnos`, `/pagos`; `PUT /cuenta/perfil`, `/prompt`, `/canales`, `/manychat`; `PATCH /cuenta/plan`, `/textos`; `POST /cuenta/onboarding`, `/onboarding/completar`, `/probar`, `/pausar`, `/activar`, `/suscripcion`, `/password`, `/legal/aceptar` |
| Login del equipo | `POST /auth/login` |
| Resumen | `GET /admin/metricas` |
| Clientes, alta y ficha | `GET /clientes`, `GET /planes`, `POST /clientes`, `GET, PATCH /clientes/:id`, `PUT /clientes/:id/prompt`, `POST /clientes/:id/pausar`, `/activar`, `/transferencia`, `/reset-password`, `/acceso`, `GET /clientes/:id/uso`, `/turnos` |
| Tickets | `GET /tickets?tipo=&estado=`, `PATCH /tickets/:id`, `POST /tickets/:id/convertir` |
| Públicas | `GET /publico/:token`, `POST /publico/:token/suscripcion`, `POST /publico/contacto`, `POST /publico/arrepentimiento` |
Los precios viven en el backend junto con los planes. El frontend los muestra y no los calcula.
## Correr
- Docker: `docker compose up -d --build` en la raíz; el sitio queda en `http://localhost:${WEB_PORT}` (8080 en el `.env` actual).
- Desarrollo: `npm run dev` en `Frontend/` (Vite en `:5173`, con proxy de `/api` a `http://localhost:3000`).
- Tests: `npm test` (Vitest + Testing Library). `npm run test:coverage` genera `coverage/lcov.info`.
