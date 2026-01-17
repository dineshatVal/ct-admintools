import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '../utils/logger.utils';

class ModelProvider {
  private static instance: ModelProvider;
  private model: any = null;

  private constructor() {
    this.initializeModel();
  }

  public static getInstance(): ModelProvider {
    if (!ModelProvider.instance) {
      ModelProvider.instance = new ModelProvider();
    }
    return ModelProvider.instance;
  }

  private initializeModel(): void {
    if (!process.env.AI_MODEL) {
      throw new Error('AI_MODEL is not set');
    }
    if (!process.env.AI_PROVIDER) {
      throw new Error('AI_PROVIDER is not set');
    }

    try {
      this.model =
        process.env.AI_PROVIDER === 'openai'
          ? createOpenAI({
              apiKey: process.env.OPENAI_API_KEY,
            })(process.env.AI_MODEL)
          : createAnthropic({
              apiKey: process.env.ANTHROPIC_API_KEY,
            })(process.env.AI_MODEL);

      logger.info(
        `AI model initialized with provider: ${process.env.AI_PROVIDER}, model: ${process.env.AI_MODEL}`
      );
    } catch (error) {
      logger.error(`Failed to initialize AI model: ${error}`);
      throw error;
    }
  }

  public getModel(): any {
    if (!this.model) {
      throw new Error('AI model not initialized');
    }
    return this.model;
  }
}

export default ModelProvider;
