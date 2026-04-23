from email import message
from unittest import result

from openai import OpenAI
import os

LLM_API_KEY = os.getenv("LLM_API_KEY")
MODEL=os.getenv("LLM_MODEL")


PROMPT="""
# STRICT RULES
- You are an AI assistant for the DuaBakes bakery.
- Only answer bakery related queries.
- If the user entered not related to bakery queries always return FALLBACK.
- Your tone always should be respectful to the customers.
"""


def call_llm(text:str):

  client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=LLM_API_KEY,
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
  