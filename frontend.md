# Frontend
Sitio público, panel del comercio y panel del equipo en una sola app. Habla con la API de `backend.md`.
React 18 + Vite + TypeScript, React Router y TanStack Query. En Docker se sirve con nginx, que además hace proxy de `/api` hacia el servicio `api`.
## Quién entra
- Cualquiera: la landing (`/`), los planes, los documentos legales, el formulario de IA personalizada y el botón de arrepentimiento.
- Comercio: se registra en `/registro`, entra por `/ingresar` y usa `/cuenta/*`. Su sesión se guarda en `orbita.cuenta`.
- Equipo: entra por `/admin/login` y usa `/admin/*`. Su sesión se guarda en `orbita.token`. `/login` redirige acá.
Las dos sesiones son independientes. `api()` elige el token según la ruta (`/cuenta/*` usa el del comercio) y, ante un `401`, manda al login que corresponde.
## Identidad visual
Azul noche (`--noche`), violeta de marca (`--primary`) y un acento ámbar (`--acento`) que es el satélite del logo. El logo es un SVG en `components/Sitio.tsx`, junto con el header y el footer del sitio. Todo el estilo vive en `styles.css`, con tipografía Inter.
Los dos paneles usan `PanelShell` (`components/Shell.tsx`): barra lateral con grupos e íconos (`components/Iconos.tsx`), bloque del usuario con botón de salir, barra superior con la ubicación actual y el cambio de tema, y menú desplegable en pantallas de hasta 900 px. Los paneles son oscuros por defecto y tienen tema claro; la elección se guarda en `orbita.tema`. Los tokens del tema están en `.app` y `.app[data-tema='claro']`; el sitio público no cambia.
## Sitio público
### Landing (`/`)
Hero con una conversación de ejemplo y el llamado "Probá la demo gratis" (lleva al registro), canales compatibles (WhatsApp, Instagram y TikTok), beneficios, cómo funciona en cuatro pasos, planes (de `GET /publico/planes`, solo precio de Mercado Pago), bloque de confianza (sin permanencia, 10 días para arrepentirse, datos protegidos, pagos seguros), preguntas frecuentes y llamado final. Cada plan lleva a `/registro?plan=...`; Personalizado lleva a `/contacto`.
### Documentos legales
- `/terminos` y `/privacidad`: texto versionado. La versión está en `legal/empresa.ts` (`VERSION_LEGAL`) y tiene que coincidir con `LEGAL` del backend.
- Los datos de la empresa (razón social, CUIT, domicilio, emails, jurisdicción) están en `EMPRESA`, en el mismo archivo. Hoy tienen marcadores entre corchetes que hay que completar antes de publicar.
- `/arrepentimiento`: formulario del botón de arrepentimiento (Res. 424/2020). Devuelve un código de trámite. El link está en el footer de todas las páginas públicas.
### Contacto (`/contacto`)
Pedido de IA personalizada: nombre, email, teléfono opcional, empresa, rubro y qué necesita. Hay que aceptar la Política de Privacidad. Tiene un campo trampa oculto contra bots.
### Página de pago (`/p/:token`)
Sin cuenta, para fichas creadas por el equipo: plan, importe, vencimiento, uso del mes y el botón para aprobar el débito de Mercado Pago.
## Panel del comercio
### Registro, ingreso y contraseña
- `/registro`: elige plan, completa negocio, rubro, nombre, email y contraseña, y marca dos casillas obligatorias (Términos, que incluye que la IA puede equivocarse, y Privacidad). El botón queda deshabilitado hasta marcar las dos. No hace falta pagar para entrar.
- `/ingresar`: email y contraseña.
- `/restablecer/:token`: elige contraseña nueva con el link que le pasa el equipo.
### Inicio (`/cuenta`)
1. Sin pago acreditado: bienvenida con la invitación a la demo, botón de Mercado Pago y tres pasos (probar, activar, configurar). Mi IA, conexión, simulador y agenda se ven con candado y su contenido deshabilitado, con botones para ir a la demo o activar el plan. Un aviso arriba invita a la demo en todas las secciones. Esos registros aparecen como leads en el panel del equipo.
2. Con pago y sin terminar: el tutorial, con el porcentaje de avance en el aviso de arriba.
3. Terminado: tarjeta del negocio (en línea o no, respuestas de hoy y del período, canales, pausar o activar, probar), uso del día, la semana y el período, plan y vencimiento, sugerencia del plan siguiente, accesos rápidos y próximos turnos si el plan los tiene.
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
| Conectar tus canales (ID y token por canal, hasta el máximo del plan, con la guía de cada plataforma) | sí | sí | sí | sí |
| Integración web (opcional; quien no usa redes puede saltear los canales y venir directo acá) | sí | sí | sí | sí |
| Mensajes fijos | sí | sí | sí | sí |
| Recordatorios | | | sí | sí |
| Probá tu IA (simulador) | sí | sí | sí | sí |
| Activar (lista de requisitos) | sí | sí | sí | sí |
Cada paso guarda en el backend y avanza. El progreso se guarda, así que se puede dejar y retomar. Desde la lista lateral se vuelve a cualquier paso ya visitado. El paso Activar muestra qué falta y lleva al paso para completarlo.
### Secciones
- **Demo** (`/cuenta/demo`, para todas las cuentas, con o sin pago): tres pasos en una pantalla. 1) Información: arrastrar o elegir PDF, TSV o CSV, pegar texto o usar datos de ejemplo; cada fuente muestra tipo, tamaño y una muestra de la planilla, y una barra del espacio usado. 2) Qué puede hacer: interruptores de stock, horarios, turnos, pedidos y derivar, horarios de atención, nombre del negocio y tono; se guarda solo. 3) Chat de prueba con preguntas sugeridas según las funciones y las acciones que haría. Abajo, el llamado a activar el plan (o a configurar la IA real si ya pagó).
- **Mi IA** (`/cuenta/ia`): información del negocio, mensajes fijos e instrucciones avanzadas (el prompt, editable a mano).
- **Probar** (`/cuenta/probar`): el simulador, con mensajes sugeridos según el plan. No envía nada ni consume el plan.
- **Conexión** (`/cuenta/conexion`): canales con su ID y token (el token se guarda cifrado; se ve "Conectado" y una máscara, y si se deja vacío se conserva el anterior) y la guía de dónde sacar cada dato en WhatsApp, Instagram y TikTok. Debajo, **Integración web**: prenderla, dominios permitidos, mensaje de bienvenida y color; con la clave generada muestra el `<script>` para copiar, el endpoint de la API con un ejemplo `curl`, el botón para generar una clave nueva y la guía de dónde pegar el código (HTML, WordPress, Shopify, Tiendanube, Wix y otros, Google Tag Manager).
- **Agenda** (`/cuenta/agenda`): turnos, solo en planes con turnos.
- **Plan y pagos** (`/cuenta/plan`): pago, cambio de plan o de medio (Personalizado se coordina con el equipo) e historial de pagos.
- **Ajustes** (`/cuenta/ajustes`): datos de la cuenta, cambio de contraseña, links legales y cómo darse de baja.
## Panel del equipo
### Resumen (`/admin`)
Tarjetas de MRR, cobrado en 30 días, MRR en riesgo, clientes activos, leads (y cuántos probaron la demo), respuestas de hoy y arrepentimientos abiertos. Gráficos de barras (SVG) de ingresos por mes y respuestas por día. Bloques de clientes por estado y plan, embudo de registro, cobranza y tickets. Alertas de clientes cerca del tope (candidatos a subir de plan) y vencimientos de la semana.
### Clientes (`/admin/clientes`)
Una fila por cliente: nombre, plan, canales, estado del bot (marca los que están en onboarding) y estado del pago.
### Alta (`/admin/clientes/nuevo`)
Igual que antes: nombre y `clientId`, plan (sin Personalizado), medio, canales con su token, email y prompt. Muestra el precio según el medio.
### Ficha (`/admin/clientes/:id`)
Estado, **cuenta del cliente**, plan, uso, canales, prompt, textos fijos, agenda y página del cliente. Los canales muestran si tienen token y las URLs de los webhooks de Meta y TikTok. En la cuenta del cliente se ve el usuario, el alta y el último ingreso, con un botón para generar el link de restablecimiento. Si la ficha no tiene usuario (alta del equipo o ticket), se lo invita con email y nombre y se obtiene el link para que elija contraseña.
### Tickets (`/admin/tickets`)
Selector de tipo (IA personalizada o arrepentimientos) y filtro por estado. Los de IA personalizada se cotizan y se convierten en ficha con plan Personalizado. Los arrepentimientos se responden dentro de las 24 h y no se convierten.
## Datos que lee
Todas las llamadas van a `/api` (variable `VITE_API_URL` para cambiarlo).
| Pantalla | Llamadas |
|---|---|
| Landing y registro | `GET /publico/planes`, `POST /cuenta/registro` |
| Ingreso y contraseña | `POST /cuenta/login`, `POST /cuenta/restablecer` |
| Demo | `GET, PUT /cuenta/demo`, `POST /cuenta/demo/fuentes`, `/demo/ejemplo`, `/demo/chat`, `DELETE /cuenta/demo/fuentes/:id` |
| Panel del comercio | `GET /cuenta/me`, `/uso`, `/turnos`, `/pagos`; `PUT /cuenta/perfil`, `/prompt`, `/canales`, `/web`; `POST /cuenta/web/clave`; `PATCH /cuenta/plan`, `/textos`; `POST /cuenta/onboarding`, `/onboarding/completar`, `/probar`, `/pausar`, `/activar`, `/suscripcion`, `/password`, `/legal/aceptar` |
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
