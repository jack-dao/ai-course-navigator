import logger from '../lib/logger';
import { chatSchema } from '../validators/chat';
import { buildChatStream } from '../services/chatService';
import type { Request, Response } from 'express';

const handleChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, userSchedule, term } = chatSchema.parse(req.body);

    const result = await buildChatStream(
      message,
      term,
      userSchedule?.map((c: { code: string; name: string; days?: string; times?: string }) => c)
    );

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    });

    try {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(chunkText);
        }
      }
    } catch (streamError) {
      logger.error({ err: streamError }, 'Chat stream error');
      // Stream already started — write error message inline so the client sees it
      res.write('\n\n[Sorry, an error occurred while generating the response. Please try again.]');
    }

    res.end();
  } catch (error) {
    logger.error({ err: error }, 'AI Error');

    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    } else {
      res.end();
    }
  }
};

export { handleChat };
