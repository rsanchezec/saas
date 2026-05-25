from fastapi import Depends, FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials  # type: ignore
from openai import APIError, APITimeoutError, OpenAI  # type: ignore
from dotenv import load_dotenv  # type: ignore
import json
import os

load_dotenv()

app = FastAPI()

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/api")
def idea(creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    user_id = creds.decoded["sub"]
    api_key = os.getenv("DEEPSEEK_API_KEY")
    model = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Falta configurar DEEPSEEK_API_KEY en el archivo .env",
        )

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        timeout=60.0,
        max_retries=0,
    )
    prompt = [
        {
            "role": "user",
            "content": (
                "Genera 5 ideas de negocio para agentes de IA. "
                "Para cada idea incluye: nombre, problema que resuelve, cliente ideal "
                "formateado con encabezados, subencabezados, viñetas con subpuntos descriptivos "
                "y como monetizarla. Responde en espanol."
            ),
        }
    ]

    def send_event(data: dict[str, str], event: str | None = None):
        payload = json.dumps(data, ensure_ascii=False)

        if event:
            yield f"event: {event}\n"

        yield f"data: {payload}\n\n"

    def event_stream():
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=prompt,
                max_tokens=10000,
                stream=True,
            )

            has_content = False

            for chunk in stream:
                if not chunk.choices:
                    continue

                text = chunk.choices[0].delta.content

                if text:
                    has_content = True
                    yield from send_event({"text": text})

            if not has_content:
                yield from send_event(
                    {"message": "DeepSeek respondio sin contenido. Intenta de nuevo."},
                    "app-error",
                )
                return

            yield from send_event({}, "done")
        except APITimeoutError:
            yield from send_event(
                {"message": "DeepSeek no respondio a tiempo. Revisa tu conexion o intenta de nuevo."},
                "app-error",
            )
        except APIError as error:
            yield from send_event(
                {"message": f"DeepSeek respondio con error: {error.message}"},
                "app-error",
            )
        except Exception:
            yield from send_event(
                {"message": "Ocurrio un error inesperado generando la respuesta."},
                "app-error",
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
