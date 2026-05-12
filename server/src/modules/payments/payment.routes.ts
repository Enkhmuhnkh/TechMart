import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import * as paymentService from './payment.service';

const router = Router();

// ── Create QPay invoice for order ────────────────────────────────────────────
router.post('/qpay/create', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, amount, description } = req.body;
    if (!orderId || !amount) {
      res.status(400).json({ success: false, error: { message: 'orderId, amount шаардлагатай' } });
      return;
    }
    const result = await paymentService.createQPayInvoice(orderId, Number(amount), description || 'TechMart захиалга');
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// ── Check payment status ─────────────────────────────────────────────────────
router.get('/qpay/status/:invoiceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await paymentService.checkQPayStatus(req.params.invoiceId);
    res.json({ success: true, data: { status } });
  } catch (err) { next(err); }
});

// ── QPay webhook callback ────────────────────────────────────────────────────
router.post('/qpay/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoice_id } = req.body;
    if (invoice_id) await paymentService.handleQPayCallback(invoice_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Get payment by order ─────────────────────────────────────────────────────
router.get('/order/:orderId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.getPaymentByOrder(req.params.orderId);
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

// ── Admin: get gateways ──────────────────────────────────────────────────────
router.get('/gateways', requireAuth, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const gateways = await paymentService.getGateways();
    res.json({ success: true, data: gateways });
  } catch (err) { next(err); }
});

// ── Admin: save gateway ──────────────────────────────────────────────────────
router.post('/gateways', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, config, is_active, is_sandbox } = req.body;
    await paymentService.saveGateway(provider, config, is_active, is_sandbox);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
