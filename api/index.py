from fastapi import Depends, FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials  # type: ignore
from openai import APIError, APITimeoutError, OpenAI  # type: ignore
from pydantic import BaseModel  # type: ignore
from dotenv import load_dotenv  # type: ignore
import os

load_dotenv()

app = FastAPI()

clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class Visit(BaseModel):
    patient_name: str
    date_of_visit: str
    notes: str


SYSTEM_PROMPT = """
Recibiras notas escritas por un medico durante la consulta de un paciente.
Tu trabajo es resumir la consulta para el medico y redactar un correo para el paciente.
Responde exactamente con tres secciones usando estos encabezados:
### Resumen de la consulta para el historial del medico
### Proximos pasos para el medico
### Borrador de correo para el paciente en lenguaje claro
"""


def user_prompt_for(visit: Visit) -> str:
    return f"""Crea el resumen, los proximos pasos y el borrador de correo para:
Nombre del paciente: {visit.patient_name}
Fecha de la consulta: {visit.date_of_visit}
Notas:
{visit.notes}"""


@app.post("/api")
def consultation_summary(
    visit: Visit,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    _user_id = creds.decoded["sub"]
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
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt_for(visit)},
    ]

    def event_stream():
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=prompt,
                stream=True,
            )

            for chunk in stream:
                if not chunk.choices:
                    continue

                text = chunk.choices[0].delta.content
                if not text:
                    continue

                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"

            yield "event: done\n"
            yield "data: {}\n\n"
        except APITimeoutError:
            yield "event: app-error\n"
            yield "data: DeepSeek no respondio a tiempo. Revisa tu conexion o intenta de nuevo.\n\n"
        except APIError as error:
            yield "event: app-error\n"
            yield f"data: DeepSeek respondio con error: {error.message}\n\n"
        except Exception:
            yield "event: app-error\n"
            yield "data: Ocurrio un error inesperado generando la respuesta.\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
