import { CONTEXT_HYDRATION_PROMPT } from '../contants';

export const hydratePrompt = (prompt: string, context: any) => {
  if (context.storeKey) {
    prompt += CONTEXT_HYDRATION_PROMPT.storeKey.replace('{{storeKey}}', context.storeKey);
  }
  return prompt;
};
