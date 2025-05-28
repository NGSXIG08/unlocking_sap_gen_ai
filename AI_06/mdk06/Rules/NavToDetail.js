import getEmails from './GetEmails';

export default async function NavToDetail(clientAPI) {
    try {
        // Show a loading indicator while the operation is in progress
        clientAPI.showActivityIndicator();

        // Retrieve the current action binding (should include the user's message)
        let actionBinding = clientAPI.getPageProxy().getActionBinding();
       
        const emails = getEmails(clientAPI);
        const half = Math.floor(emails.length / 2);
        const test_set = emails.slice(half);
        const test_set_small = test_set.slice(0, 2);

        let totalUrgencyScore = 0;
        let totalSentimentScore = 0;
        let totalCategoryScore = 0;
        let count = test_set_small.length;

        for (const email of test_set_small) {
            const body = {
                orchestration_config: {
                    module_configurations: {
                        templating_module_config: {
                            template: [{
                                role: "user",
                                content: [{
                                    type: "text",
                                    text: `Giving the following message:
                                            ---
                                            {{ ?input }}
                                            ---
                                            Extract and return a json with the following keys and values:
                                            - "urgency" as one of {{ ?urgency }}
                                            - "sentiment" as one of {{ ?sentiment }}
                                            - "categories" list of the best matching support category tags from: {{ ?categories }}
                                            Your complete message should be a valid json string that can be read directly and only contain the keys mentioned in the list above. Never enclose it in \`\`\`json\`\`\`, no newlines, no unnecessary whitespaces.`
                                }]
                            }]
                        },
                        llm_module_config: {
                            model_name: actionBinding.model
                        }
                    }
                },
                input_params: {
                    input: email.message,
                    urgency: "`high`, `medium`, `low`",
                    sentiment: "`positive`, `neutral`, `negative`",
                    categories: "`facility_management_issues`, `quality_and_safety_concerns`, `maintenance_requests`, `tenant_relations`"
                }
            };

            clientAPI.getPageProxy().getAppClientData().body = body;

            const response = await clientAPI.executeAction("/mdk06/Actions/Completion.action");
            const content = response?.data?.orchestration_result?.choices?.[0]?.message?.content || "{}";

            let parsed = {};
            try {
                parsed = JSON.parse(content);
            } catch (_) {
                continue;
            }

            const gt = email.ground_truth;

            const urgencyScore = parsed.urgency === gt.urgency ? 1 : 0;
            const sentimentScore = parsed.sentiment === gt.sentiment ? 1 : 0;

            let categoryScore = 0;
            if (Array.isArray(gt.categories) && Array.isArray(parsed.categories)) {
                const gtSet = new Set(gt.categories);
                const predSet = new Set(parsed.categories);
                const intersection = [...gtSet].filter(x => predSet.has(x));
                const union = new Set([...gtSet, ...predSet]);
                categoryScore = union.size > 0 ? intersection.length / union.size : 0;
            }

            totalUrgencyScore += urgencyScore;
            totalSentimentScore += sentimentScore;
            totalCategoryScore += categoryScore;
        }

        const averageUrgency = totalUrgencyScore / count;
        const averageSentiment = totalSentimentScore / count;
        const averageCategory = totalCategoryScore / count;

        let mergedBinding = {
            ...actionBinding,
            averageUrgency,
            averageSentiment,
            averageCategory
        };

        clientAPI.executeAction({
            Name: "/mdk06/Actions/GenericMessageBox.action",
            Properties: { Message: JSON.stringify(mergedBinding, null, 2) }
        });

        // Set the merged object as the new action binding to be used in the next page
        clientAPI.getPageProxy().setActionBinding(mergedBinding);


        // Hide the loading indicator
        clientAPI.dismissActivityIndicator();

        // Navigate to the detail page using the updated binding
        return clientAPI.executeAction("/mdk06/Actions/NavToDetail.action");

    } catch (error) {
        // If an error occurs, show a message box and hide the activity indicator
        clientAPI.executeAction({
            Name: "/mdk06/Actions/GenericMessageBox.action",
            Properties: { Message: "Error: " + error }
        });
        clientAPI.dismissActivityIndicator();
    }
}
