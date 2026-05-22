import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly configured: boolean;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    this.configured = Boolean(apiKey);
    this.model = process.env.AI_MODEL ?? 'gemini-2.0-flash';

    this.client = new OpenAI({
      apiKey: apiKey ?? 'not-configured',
      baseURL:
        process.env.AI_BASE_URL ??
        'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }

  /**
   * Generic text-in / text-out call. Works against any OpenAI-compatible
   * provider (Gemini, Hugging Face router, OpenAI, Groq, OpenRouter, Ollama).
   */
  async generateText(system: string, user: string): Promise<string> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'AI provider not configured. Set AI_API_KEY, AI_BASE_URL, AI_MODEL.',
      );
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return completion.choices[0]?.message?.content?.trim() ?? '';
    } catch (err) {
      this.logger.error(`AI call failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('AI provider request failed.');
    }
  }

  async summarize(title: string, content: string): Promise<string> {
    return this.generateText(
      'You are a concise editor. Summarize the blog post in exactly two ' +
        'sentences. Return only the summary text, no preamble.',
      `Title: ${title}\n\n${content}`,
    );
  }

  async suggestTags(
    title: string,
    content: string,
    availableCategories: string[],
  ): Promise<string[]> {
    if (availableCategories.length === 0) return [];

    const raw = await this.generateText(
      'You are a content classifier. From this exact list of categories: ' +
        `${availableCategories.join(', ')}. ` +
        'Pick the 1 to 3 categories that best fit the blog post. ' +
        'Return ONLY a comma-separated list of category names taken ' +
        'verbatim from that list. No other text.',
      `Title: ${title}\n\n${content}`,
    );

    const picked = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    // Only keep suggestions that actually exist — guards against
    // the model inventing a category that isn't real.
    return picked.filter((p) =>
      availableCategories.some(
        (c) => c.toLowerCase() === p.toLowerCase(),
      ),
    );
  }
}
