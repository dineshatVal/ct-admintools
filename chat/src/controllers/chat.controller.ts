import { CommercetoolsAgentToolkit } from '@commercetools-demo/ct-agent-toolkit/ai-sdk';
import { CoreMessage, generateObject, NoSuchToolError, pipeDataStreamToResponse, streamText } from 'ai';
import { Request, Response } from 'express';
import { injectNavigationTools } from '../navigation-tools';
import ModelProvider from '../services/modelProvider';
import { logger } from '../utils/logger.utils';
import { DEFAULT_SYSTEM_PROMPT } from '../contants';
import { hydratePrompt } from '../utils/prompt';

export function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

/**
 * Safely parses the AVAILABLE_TOOLS environment variable
 * Handles both regular JSON and escaped JSON strings
 */
export function parseAvailableActions(availableActionsStr: string): Object {
  try {
    // First try to parse as regular JSON
    return JSON.parse(availableActionsStr);
  } catch (error) {
    try {
      // If the first parse fails, try unescaping the string first
      // This handles double-encoded JSON strings like "{\"key\":\"value\"}"
      const unescaped = availableActionsStr.replace(/\\"/g, '"');
      return JSON.parse(unescaped);
    } catch (nestedError) {
      // If both parsing attempts fail, log the error and return an empty object
      logger.error(`Failed to parse AVAILABLE_TOOLS: ${availableActionsStr}`);
      return {};
    }
  }
}

export const createCommercetoolsAgentToolkit = (
  clientId: string,
  clientSecret: string,
  authUrl: string,
  projectKey: string,
  apiUrl: string,
  availableActions: Object,
  context: {
    storeKey: string;
  }
) => {
  return new CommercetoolsAgentToolkit({
    clientId,
    clientSecret,
    authUrl,
    projectKey,
    apiUrl,

    configuration: {
      context: {
        ...(context.storeKey && { storeKey: context.storeKey }),
      },
      actions: availableActions,
    },
  });
};

export const post = async (request: Request, response: Response) => {
  try {
    if (
      !process.env.CTP_CLIENT_ID ||
      !process.env.CTP_CLIENT_SECRET ||
      !process.env.CTP_AUTH_URL ||
      !process.env.CTP_PROJECT_KEY ||
      !process.env.CTP_API_URL ||
      !process.env.AVAILABLE_TOOLS
    ) {
      return response
        .status(500)
        .json({ error: 'Missing required environment variables' });
    }
    if (!process.env.AI_MODEL) {
      return response.status(500).json({ error: 'AI_MODEL is not set' });
    }
    if (!process.env.AI_PROVIDER) {
      return response.status(500).json({ error: 'AI_PROVIDER is not set' });
    }

    const { messages } = request.body as { messages: CoreMessage[] };

    if (!messages) {
      return response.status(400).json({ error: 'Messages are required' });
    }

    const { storeKey } = request.query;
    const context = { storeKey: storeKey as string };
    const availableActions = parseAvailableActions(
      process.env.AVAILABLE_TOOLS
    );

    const commercetoolsAgentToolkit = createCommercetoolsAgentToolkit(
      process.env.CTP_CLIENT_ID,
      process.env.CTP_CLIENT_SECRET,
      process.env.CTP_AUTH_URL,
      process.env.CTP_PROJECT_KEY,
      process.env.CTP_API_URL,
      availableActions,
      context
    );

    // Get the model instance from the ModelProvider
    const model = ModelProvider.getInstance().getModel();

    const tools = injectNavigationTools(commercetoolsAgentToolkit.getTools());

    const systemPrompt = hydratePrompt(process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT, context);

    // const repairToolCall = async ({
    //   toolCall,
    //   tools,
    //   parameterSchema,
    //   error,
    // }: any ) => {
    //   if (NoSuchToolError.isInstance(error)) {
    //     return null; // do not attempt to fix invalid tool names
    //   }
  
    //   const tool = tools[toolCall.toolName as keyof typeof tools];
  
    //   const { object: repairedArgs } = await generateObject({
    //     model: model,
    //     schema: tool.parameters,
    //     prompt: [
    //       `The model tried to call the tool "${toolCall.toolName}"` +
    //         ` with the following arguments:`,
    //       JSON.stringify(toolCall.args),
    //       `The tool accepts the following schema:`,
    //       JSON.stringify(parameterSchema(toolCall)),
    //       'Please fix the arguments.',
    //     ].join('\n'),
    //   });
  
    //   return { ...toolCall, args: JSON.stringify(repairedArgs) };
    // }

    pipeDataStreamToResponse(response, {
      status: 200,
      statusText: 'OK',
      execute: async (dataStreamWriter) => {
        const result = streamText({
          model: model,
          system: systemPrompt,
          messages,
          tools,
          maxSteps: parseInt(process.env.MAX_STEPS || '25'),
          // experimental_repairToolCall: repairToolCall,
        });

        result.mergeIntoDataStream(dataStreamWriter, {
          sendUsage: true,
          sendReasoning: true,
        });
      },
      onError: (error) => {
        logger.error('Error in streaming response:', error);
        response.status(500).json({
          error: 'Failed to process chat request: ' + errorHandler(error),
        });
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    return response.status(500).json({
      error: 'Failed to process chat request: ' + errorHandler(error),
    });
  }
};
