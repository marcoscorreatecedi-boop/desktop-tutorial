import anthropic
import base64
import json
import os
from pathlib import Path

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

CONSTRUCTION_STAGES = [
    "Terraplanagem e Fundação",
    "Estrutura (pilares, vigas, laje)",
    "Alvenaria e Vedação",
    "Cobertura",
    "Instalações Elétricas",
    "Instalações Hidráulicas",
    "Revestimentos Externos",
    "Revestimentos Internos",
    "Esquadrias (portas e janelas)",
    "Acabamentos e Pintura",
    "Limpeza e Entrega",
]

ANALYSIS_PROMPT = """Você é um engenheiro civil especialista em análise de diário de obra.
Analise esta imagem de obra e responda em JSON com o seguinte formato exato:

{
  "stage_identified": "nome da etapa construtiva identificada",
  "progress_percentage": número de 0 a 100 representando o progresso desta etapa,
  "description": "descrição detalhada do que está sendo observado na foto",
  "tasks_completed": ["tarefa 1", "tarefa 2", ...],
  "issues_found": ["problema 1", "problema 2", ...],
  "recommendations": ["recomendação 1", "recomendação 2", ...],
  "confidence": número de 0 a 1 representando a confiança na análise
}

As etapas construtivas possíveis são:
""" + "\n".join(f"- {s}" for s in CONSTRUCTION_STAGES) + """

Seja preciso e técnico. Se houver problemas de segurança ou qualidade, liste-os.
Responda APENAS com o JSON, sem texto adicional."""

AUDIO_PROMPT = """Você é um engenheiro civil analisando uma nota de áudio de diário de obra.
Com base na transcrição ou descrição do áudio abaixo, responda em JSON com o formato exato:

{
  "stage_identified": "nome da etapa construtiva mencionada",
  "progress_percentage": número de 0 a 100,
  "description": "resumo do que foi relatado",
  "tasks_completed": ["tarefa relatada 1", ...],
  "issues_found": ["problema mencionado 1", ...],
  "recommendations": ["recomendação 1", ...],
  "confidence": número de 0 a 1
}

Responda APENAS com o JSON."""


async def analyze_photo(file_path: str) -> dict:
    with open(file_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    ext = Path(file_path).suffix.lower()
    media_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_type_map.get(ext, "image/jpeg")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": ANALYSIS_PROMPT,
                    },
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code blocks if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


async def analyze_audio_note(notes: str) -> dict:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": AUDIO_PROMPT + f"\n\nNota de áudio/texto:\n{notes}",
            }
        ],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def calculate_critical_path(stages: list) -> list:
    """CPM (Critical Path Method) - forward and backward pass."""
    if not stages:
        return stages

    stage_map = {s["id"]: s for s in stages}

    # Forward pass - calculate Early Start (ES) and Early Finish (EF)
    for stage in stages:
        deps = stage.get("dependencies_list", [])
        if not deps:
            stage["early_start"] = 0
        else:
            stage["early_start"] = max(
                stage_map[d]["early_finish"]
                for d in deps
                if d in stage_map
            ) if deps else 0
        stage["early_finish"] = stage["early_start"] + stage.get("duration_days", 0)

    # Project duration = max early finish
    project_duration = max(s["early_finish"] for s in stages)

    # Backward pass - calculate Late Start (LS) and Late Finish (LF)
    for stage in reversed(stages):
        successors = [
            s for s in stages
            if stage["id"] in s.get("dependencies_list", [])
        ]
        if not successors:
            stage["late_finish"] = project_duration
        else:
            stage["late_finish"] = min(s["late_start"] for s in successors)
        stage["late_start"] = stage["late_finish"] - stage.get("duration_days", 0)
        stage["float_time"] = stage["late_start"] - stage["early_start"]
        stage["is_critical"] = stage["float_time"] == 0

    return stages
