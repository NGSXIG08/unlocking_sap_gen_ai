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

def retrieve_or_deploy_orchestration(ai_core_client: AICoreV2Client,
                                     scenario_id: str = "orchestration",
                                     executable_id: str = "orchestration",
                                     config_suffix: str = "simple",
                                     start_timeout: int = 300):
    if not config_suffix:
        raise ValueError("Empty `config_suffix` not allowed")
    deployments = ai_core_client.deployment.query(
        scenario_id=scenario_id,
        executable_ids=[executable_id],
        status=Status.RUNNING
    )
    if deployments.count > 0:
        return sorted(deployments.resources, key=lambda x: x.start_time)[0]
    config_name = f"{config_suffix}-orchestration"
    configs = ai_core_client.configuration.query(
        scenario_id=scenario_id,
        executable_ids=[executable_id],
        search=config_name
    )
    if configs.count > 0:
        config = sorted(deployments.resources, key=lambda x: x.start_time)[0]
    else:
        config = ai_core_client.configuration.create(
            scenario_id=scenario_id,
            executable_id=executable_id,
            name=config_name,
        )
    deployment = ai_core_client.deployment.create(configuration_id=config.id)

    def check_ready():
        updated_deployment = ai_core_client.deployment.get(deployment.id)
        return None if updated_deployment.status != Status.RUNNING else updated_deployment
    
    return spinner(check_ready)

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

