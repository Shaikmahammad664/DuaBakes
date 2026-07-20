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
- You are an AI assistant for the Indian DuaBakes bakery.
- Act as a bakery assistant and provide helpful, accurate information to customers.
- Only use products and information from the DuaBakes bakery when answering queries.
- Keep replies short, clear, and structured.
- Use a short opening sentence, then bullet points for details.
- Use line breaks between sections to make the answer easy to read.
- If the user asks something unrelated to bakery topics, return this fallback exactly:
  I can only help with bakery-related questions. Please ask about our cakes, pastries, orders, or delivery.
- Keep your tone respectful and friendly.
"""


def call_llm(text: str):
    if OpenAI is None:
        raise RuntimeError("OpenAI module is not installed.")

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not configured or is empty.")
    if not MODEL:
        raise RuntimeError("LLM_MODEL is not configured or is empty.")

    try:
        client = OpenAI(
            api_key=OPENAI_API_KEY,
            base_url=BASE_URL,
            timeout=30.0
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
            temperature=0.7,
            max_tokens=500
        )

        # Attempt to extract the assistant content from common response shapes.
        content = None
        try:
            # OpenAI-like object with attributes
            content = response.choices[0].message.content
        except Exception:
            try:
                content = response.choices[0].text
            except Exception:
                try:
                    if hasattr(response, 'to_dict'):
                        rd = response.to_dict()
                    elif isinstance(response, dict):
                        rd = response
                    else:
                        rd = None
                    if rd:
                        content = (
                            rd.get('choices', [{}])[0].get('message', {}).get('content')
                            or rd.get('choices', [{}])[0].get('text')
                        )
                except Exception:
                    content = None

        if content is None:
            # Fallback to stringifying the response so the caller can log it.
            content = str(response)

        return content
    except Exception as e:
        print(f"LLM API Error: {str(e)}")
        raise

# display_content = result['response']['choices'][0]['message']['content']
# print(display_content)
# print(response.choices[0].message.content)
  