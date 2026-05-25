# IdeaGen Pro

IdeaGen Pro es una aplicacion SaaS que genera ideas de negocio usando inteligencia artificial. El producto esta pensado para emprendedores, builders y equipos que quieren descubrir oportunidades dentro de la economia de agentes de IA.

La app combina autenticacion, suscripciones premium y generacion de contenido en tiempo real. Los usuarios pueden iniciar sesion con Clerk, acceder al producto si tienen el plan premium y recibir ideas de negocio generadas por DeepSeek mediante streaming.

## Caracteristicas

- Landing page con presentacion del producto y llamada a registro.
- Autenticacion de usuarios con Clerk.
- Control de acceso por suscripcion usando el plan `premium_subscription`.
- Tabla de precios integrada con Clerk Billing.
- Generador de ideas de negocio para agentes de IA.
- Respuestas en streaming con Server-Sent Events.
- Renderizado de respuestas en Markdown con soporte para listas, encabezados y GitHub Flavored Markdown.
- Backend en FastAPI protegido con JWT de Clerk.
- Integracion con DeepSeek usando el SDK compatible de OpenAI.
- Estilos con Tailwind CSS.

## Stack Tecnologico

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Clerk
- FastAPI
- DeepSeek API
- OpenAI Python SDK
- Server-Sent Events
- Vercel

## Estructura Del Proyecto

```text
.
|-- api/
|   `-- index.py          # API FastAPI que genera ideas con DeepSeek
|-- pages/
|   |-- _app.tsx          # Provider global de Clerk
|   |-- _document.tsx     # Documento HTML base
|   |-- index.tsx         # Landing page
|   `-- product.tsx       # Vista protegida del producto
|-- public/               # Assets estaticos
|-- styles/
|   `-- globals.css       # Estilos globales y Markdown
|-- next.config.ts        # Configuracion de Next.js y rewrite local a FastAPI
|-- package.json          # Dependencias y scripts frontend
`-- requirements.txt      # Dependencias Python backend
```

## Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

- Node.js 20 o superior
- npm
- Python 3.10 o superior
- Una cuenta de Clerk
- Una API key de DeepSeek

## Variables De Entorno

Crea un archivo `.env` en la raiz del proyecto. No subas este archivo a GitHub.

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key
CLERK_SECRET_KEY=tu_clerk_secret_key
CLERK_JWKS_URL=https://tu-dominio-clerk/.well-known/jwks.json

DEEPSEEK_API_KEY=tu_deepseek_api_key
DEEPSEEK_MODEL=deepseek-v4-flash
```

Notas:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` son usados por Clerk en Next.js.
- `CLERK_JWKS_URL` permite que FastAPI valide los JWT enviados desde el frontend.
- `DEEPSEEK_API_KEY` es obligatoria para generar ideas.
- `DEEPSEEK_MODEL` es opcional. Si no se define, el backend usa `deepseek-v4-flash`.

## Instalacion

Instala las dependencias de Next.js:

```bash
npm install
```

Instala las dependencias de Python:

```bash
python -m venv .venv
```

En Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
```

En macOS o Linux:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

## Ejecucion Local

Ejecuta el backend FastAPI en el puerto 8000:

```bash
uvicorn api.index:app --reload --port 8000
```

En otra terminal, ejecuta el frontend:

```bash
npm run dev
```

Abre la aplicacion en:

```text
http://localhost:3000
```

Durante desarrollo, Next.js redirige las solicitudes de `/api` hacia:

```text
http://127.0.0.1:8000/api
```

## Scripts Disponibles

```bash
npm run dev
```

Inicia el servidor de desarrollo de Next.js.

```bash
npm run build
```

Genera la version de produccion.

```bash
npm run start
```

Ejecuta la aplicacion compilada.

```bash
npm run lint
```

Ejecuta ESLint.

## Flujo De Uso

1. El usuario entra a la landing page.
2. Inicia sesion con Clerk.
3. Si tiene el plan `premium_subscription`, puede acceder al generador.
4. El frontend solicita un JWT de Clerk.
5. La pagina `/product` llama al endpoint `/api` enviando el token en el header `Authorization`.
6. FastAPI valida el JWT con Clerk.
7. El backend llama a DeepSeek y transmite la respuesta por SSE.
8. El frontend muestra la idea generada en formato Markdown.

## Configuracion De Clerk

Para que el acceso premium funcione correctamente, configura en Clerk:

- Autenticacion de usuarios.
- Billing o planes de suscripcion.
- Un plan con el identificador `premium_subscription`.
- Las variables de entorno necesarias para Next.js.
- El JWKS URL usado por el backend.

En `pages/product.tsx`, el componente `Show` controla el acceso:

```tsx
<Show
  when={{ plan: 'premium_subscription' }}
  fallback={<SubscriptionFallback />}
>
  <IdeaGenerator />
</Show>
```

## Endpoint Principal

```http
GET /api
```

Headers requeridos:

```http
Authorization: Bearer <clerk_jwt>
```

Respuesta:

- `text/event-stream`
- Eventos con fragmentos de texto generados por DeepSeek.
- Evento `done` al finalizar.
- Evento `app-error` si ocurre un error controlado.

## Despliegue

El proyecto esta preparado para desplegarse en Vercel. Para produccion:

1. Sube el repositorio a GitHub.
2. Conecta el repositorio en Vercel.
3. Configura las variables de entorno en el dashboard de Vercel.
4. Configura Clerk con el dominio de produccion.
5. Verifica que el plan `premium_subscription` exista en Clerk.
6. Despliega la aplicacion.

## Seguridad

- No subas `.env` al repositorio.
- No expongas `DEEPSEEK_API_KEY`.
- No expongas `CLERK_SECRET_KEY`.
- Valida siempre las solicitudes al backend usando JWT.
- Manten las claves configuradas solo en variables de entorno.

## Estado Del Proyecto

Este proyecto esta en fase inicial funcional. Actualmente incluye autenticacion, suscripcion premium, generacion de ideas por IA y streaming desde el backend.

## Licencia

Este proyecto esta disponible bajo la licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente, manteniendo el aviso de licencia correspondiente.
