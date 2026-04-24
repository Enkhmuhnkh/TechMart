import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as aiService from './ai.service';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/ai/chat — Server-Sent Events streaming
router.post('/chat', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Message is required' } });
      return;
    }

    const sid = sessionId || uuidv4();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',       // Nginx buffering-г унтраана
      'X-Session-Id': sid,
    });

    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: sid })}\n\n`);

    let products: unknown[] = [];
    let sources: Array<{ url: string; title: string }> = [];

    await aiService.chat(
      message,
      sid,
      // onChunk — text stream
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
      },
      // onEvent — web search events
      (event: aiService.AiEvent) => {
        res.write(`data: ${JSON.stringify({ type: event.type, ...event })}\n\n`);
      },
    ).then(result => {
      products = result.products;
      sources = result.sources;
    });

    // Products + sources after stream
    res.write(`data: ${JSON.stringify({ type: 'products', products })}\n\n`);
    if (sources.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (err) {
    next(err);
  }
});

router.get('/sessions/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await aiService.getSession(req.params.token);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

router.delete('/sessions/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await aiService.clearSession(req.params.token);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;