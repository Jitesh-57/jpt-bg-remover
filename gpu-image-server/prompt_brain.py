"""
prompt_brain.py — the "smart thinking" layer.

Turns a short idea ("diwali sale banner") into a rich, model-ready image prompt
using GitHub Models (free GPT-4o) — the same GITHUB_TOKEN your website already
uses. If no token is set (or the call fails), it falls back to the raw prompt,
so the image server always works.

Get a token: https://github.com/settings/tokens (a fine-grained or classic PAT).
GitHub Models is free with generous limits: https://github.com/marketplace/models
"""
from __future__ import annotations

import os
import requests

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
ENDPOINT = os.getenv("GITHUB_MODELS_ENDPOINT", "https://models.inference.ai.azure.com/chat/completions")
MODEL = os.getenv("GITHUB_MODELS_MODEL", "gpt-4o")

_SYSTEM = {
    "generate": (
        "You are an expert prompt engineer for text-to-image diffusion models. "
        "Rewrite the user's idea into a single vivid, detailed image prompt. "
        "Add concrete subject, setting, composition, lighting, colour palette, mood, "
        "camera/lens and quality cues. Keep it under 70 words. "
        "Do NOT include negative terms or explanations — output only the prompt."
    ),
    "edit": (
        "You are an expert prompt engineer for image editing (img2img / inpainting) "
        "diffusion models. Rewrite the user's requested edit into a single clear, "
        "concrete instruction describing the desired result, preserving the subject. "
        "Keep it under 60 words. Output only the prompt, nothing else."
    ),
}


def enhance_prompt(prompt: str, mode: str = "generate") -> str:
    """Return an enriched prompt, or the original if enhancement is unavailable."""
    prompt = (prompt or "").strip()
    if not prompt or not GITHUB_TOKEN:
        return prompt
    try:
        res = requests.post(
            ENDPOINT,
            headers={
                "Authorization": f"Bearer {GITHUB_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": _SYSTEM.get(mode, _SYSTEM["generate"])},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.8,
                "max_tokens": 200,
            },
            timeout=20,
        )
        if res.ok:
            text = res.json()["choices"][0]["message"]["content"].strip()
            # Strip accidental quotes/markdown the model sometimes adds.
            return text.strip('"').strip("`").strip() or prompt
    except Exception as e:  # noqa: BLE001 — never let the brain break generation
        print(f"[prompt_brain] enhancement skipped: {e}")
    return prompt
