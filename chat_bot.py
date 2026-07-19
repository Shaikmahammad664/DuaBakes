import os
from dotenv import load_dotenv

try:
    from openai import OpenAI
except ModuleNotFoundError:
    OpenAI = None

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip() or os.getenv("LLM_API_KEY", "").strip()
MODEL = os.getenv("LLM_MODEL", "nvidia/nemotron-3-ultra-550b-a55b:free").strip()
BASE_URL = os.getenv("OPENAI_BASE_URL", "").strip() or "https://openrouter.ai/api/v1"

PROMPT="""
# STRICT RULES
- You are an AI assistant for the DuaBakes bakery.
- Only answer bakery related queries.
- If the user entered not related to bakery queries always return FALLBACK.
- Your tone always should be respectful to the customers.
"""


def call_llm(text: str):
    if OpenAI is None:
        raise RuntimeError("OpenAI module is not installed.")

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured or is empty.")
    if not MODEL:
        raise RuntimeError("LLM_MODEL is not configured or is empty.")

    client = OpenAI(
        api_key=OPENAI_API_KEY,
        base_url=BASE_URL,
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": PROMPT
            },
            {
                "role": "user",
                "content": text
            }
        ],
        extra_body={"reasoning": {"enabled": True}}
    )
    return response

# display_content = result['response']['choices'][0]['message']['content']
# print(display_content)
# print(response.choices[0].message.content)
  