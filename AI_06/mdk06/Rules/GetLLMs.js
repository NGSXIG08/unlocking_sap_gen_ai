/**
 * Returns a hardcoded array of LLMs objects.
 * @param {IClientAPI} clientAPI
 */
export default function GetLLMs(clientAPI) {
    const llms = [
        {"model": "mistralai--mistral-small-instruct"},
        {"model": "gpt-4o"},
        {"model": "gemini-1.5-flash"}
    ];
    return llms;
}    