YOUR_API_URL = "https://api.ai.prod.us-east-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d4f47cb57c6f627a"

from typing import Literal, Type, Union, Dict, Any, List, Callable
import re, pathlib, json, time
from functools import partial
EXAMPLE_MESSAGE_IDX = 10

import pathlib
import yaml

from gen_ai_hub.proxy import get_proxy_client
from ai_api_client_sdk.models.status import Status

from gen_ai_hub.orchestration.models.config import OrchestrationConfig
from gen_ai_hub.orchestration.models.llm import LLM
from gen_ai_hub.orchestration.models.message import SystemMessage, UserMessage
from gen_ai_hub.orchestration.models.template import Template, TemplateValue
from gen_ai_hub.orchestration.models.azure_content_filter import AzureContentFilter
from gen_ai_hub.orchestration.service import OrchestrationService

client = get_proxy_client()
deployment = retrieve_or_deploy_orchestration(client.ai_core_client)
orchestration_service = OrchestrationService(api_url=deployment.deployment_url, proxy_client=client)

def send_request(prompt, _print=True, _model='meta--llama3-70b-instruct', **kwargs):
    config = OrchestrationConfig(
        llm=LLM(name=_model),
        template=Template(messages=[UserMessage(prompt)])
    )
    template_values = [TemplateValue(name=key, value=value) for key, value in kwargs.items()]
    answer = orchestration_service.run(config=config, template_values=template_values)
    result = answer.module_results.llm.choices[0].message.content
    if _print:
        formatted_prompt = answer.module_results.templating[0].content
        print(f"<-- PROMPT --->\n{formatted_prompt if _print else prompt}\n<--- RESPONSE --->\n{result}")   
    return result

mail = dev_set[EXAMPLE_MESSAGE_IDX]

prompt_1 = """Giving the following message:
---
{{?input}}
---
Your task is to extract
- urgency
- sentiment
"""

f_1 = partial(send_request, prompt=prompt_1)

response = f_1(input=mail["message"])

