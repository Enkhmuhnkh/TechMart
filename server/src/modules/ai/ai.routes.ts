import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as aiService from './ai.service';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/ai/chat — streaming SSE
router.post('/chat', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Message required' } });
      return;
    }
    const sid = sessionId || uuidv4();
    const userId = (req as any).user?.id;

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
    }, userId).then(r => { products = r.products; });

    res.write(`data: ${JSON.stringify({ type: 'products', products })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) { next(err); }
});

// GET /api/ai/sessions/:token
router.get('/sessions/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await aiService.getSession(req.params.token);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
});

// DELETE /api/ai/sessions/:token
router.delete('/sessions/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await aiService.clearSession(req.params.token);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

// GET /api/ai/history — хэрэглэгчийн бүх яриа
router.get('/history', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const sessions = await aiService.getUserSessions(userId);
    res.json({ success: true, data: sessions });
  } catch (err) { next(err); }
});

export default router;