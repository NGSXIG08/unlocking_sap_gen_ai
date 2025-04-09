/**
 * Describe this function...
 * @param {IClientAPI} clientAPI
 */
export default function CallAI(clientAPI) {
    //clientAPI.showActivityIndicator();
    clientAPI.getPageProxy().getAppClientData().body = {
        "orchestration_config": {
            "module_configurations": {
                "templating_module_config": {
                    "template": [
                    {
                        "role": "system",
                        "content": "Content"
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Solicitud: {{ ?input }}"
                            }
                        ]
                    }
                ]
                },
                "llm_module_config": {
                    "model_name": "gpt-4o-mini",
                    "model_params": {
                        "max_tokens": 16384,
                        "temperature": 1,
                        "frequency_penalty": 0.0,
                        "presence_penalty": 0.0
                    },
                    "model_version": "2024-07-18"
                }
            }
        },
        "input_params": {
            "input": "input"
        }
    };
    
    var responseChat = clientAPI.executeAction({
        "Name": "/AI_01/Actions/Completion.action"
    });
    /*
    let chatResponseText = responseChat?.data?.orchestration_result?.choices?.[0]?.message?.content || "Error";

    if (chatResponseText == "Error") {
        clientAPI.executeAction({
            "Name": "/MDK024/Actions/GenericToastMessage.action",
            "Properties": {
                "Message": "Error "
            }
        });
        clientAPI.dismissActivityIndicator();
        return;
    }

    clientAPI.executeAction({
        "Name": "/MDK024/Actions/GenericToastMessage.action",
        "Properties": {
            "Message": chatResponseText
        }
    });
    */
}
