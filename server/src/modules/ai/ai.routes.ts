import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as aiService from './ai.service';
import { optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/ai/chat — Server-Sent Events streaming response
router.post('/chat', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Message is required' } });
      return;
    }

    const sid = sessionId || uuidv4();

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Session-Id': sid,
    });

    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: sid })}\n\n`);

    let products: unknown[] = [];

    await aiService.chat(message, sid, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
    }).then((result) => {
      products = result.products;
    });

    // Send products after text stream
    res.write(`data: ${JSON.stringify({ type: 'products', products })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/sessions/:token — resume session history
router.get('/sessions/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await aiService.getSession(req.params.token);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

// DELETE /api/ai/sessions/:token — clear session
router.delete('/sessions/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await aiService.clearSession(req.params.token);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
