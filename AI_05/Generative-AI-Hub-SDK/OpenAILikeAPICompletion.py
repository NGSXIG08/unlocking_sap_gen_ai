from gen_ai_hub.proxy.native.openai import completions
response = completions.create(
    model_name="tiiuae--falcon-40b-instruct",
    prompt="The Answer to the Ultimate Question of Life, the Universe, and Everything is",
    max_tokens=7,
    temperature=0
)
print(response)
