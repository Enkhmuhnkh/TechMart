import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, User, ShoppingCart, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api';
import { formatPrice, effectivePrice, discountPercent } from '../../utils';
import { useAddToCart } from '../../hooks';
import { useAuthStore } from '../../store';
import type { Product } from '../../types';
import { cn } from '../../utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  isStreaming?: boolean;
}

const SUGGESTED_MN = [
  '3 сая доторх gaming laptop',
  'Camera сайн Samsung утас',
  'Programming хийх laptop',
  '144Hz gaming monitor',
  'Хямд earbuds санал болго',
];

const SUGGESTED_EN = [
  'Gaming laptop under 3 million',
  'Samsung phone with great camera',
  'Laptop for programming',
  '144Hz gaming monitor',
  'Budget earbuds recommendation',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      {[0,1,2].map(i => (
        <motion.span key={i}
          className="block w-2 h-2 rounded-full bg-brand-primary/60"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
      ))}
    </div>
  );
}

function ProductMiniCard({ product }: { product: Product }) {
  const { i18n } = useTranslation();
  const { mutate: addToCart, isPending } = useAddToCart();
  const { isAuthenticated } = useAuthStore();
  const name = i18n.language === 'mn' && product.name_mn ? product.name_mn : product.name;
  const price = effectivePrice(product.price, product.sale_price);
  const discount = discountPercent(product.price, product.sale_price);
  const outOfStock = product.stock_quantity === 0;

  return (
    <div className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border"
         style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
      <Link to={`/products/${product.slug}`}>
        <div className="relative h-32 flex items-center justify-center"
             style={{ background: 'var(--surface-1)' }}>
          {product.image_url
            ? <img src={product.image_url} alt={name} className="w-full h-full object-contain p-3" />
            : <span className="text-4xl">📦</span>}
          {discount && (
            <span className="absolute top-2 left-2 badge-danger text-xs">-{discount}%</span>
          )}
        </div>
      </Link>
      <div className="p-2.5 space-y-1.5">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{product.brand_name}</p>
        <Link to={`/products/${product.slug}`}>
          <p className="text-xs font-semibold line-clamp-2 leading-snug hover:text-brand-primary transition-colors"
             style={{ color: 'var(--text-primary)' }}>{name}</p>
        </Link>
        <p className="text-sm font-bold text-brand-primary">{formatPrice(price)}</p>
        <div className="flex gap-1.5 pt-0.5">
          <Link to={`/products/${product.slug}`}
            className="w-7 h-7 rounded-lg border flex items-center justify-center hover:border-brand-primary transition-colors flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}>
            <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <button onClick={() => isAuthenticated && !outOfStock && addToCart({ productId: product.id })}
            disabled={outOfStock || isPending || !isAuthenticated}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-medium rounded-lg py-1 bg-brand-primary text-white disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all">
            <ShoppingCart className="w-3 h-3" />
            {outOfStock ? 'Дууссан' : 'Нэмэх'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const suggested = i18n.language === 'mn' ? SUGGESTED_MN : SUGGESTED_EN;

  // Smart scroll — only auto-scroll if user is near bottom
  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  // Track if user is near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Scroll when new message arrives
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
    isAtBottomRef.current = true;

    const uid = Date.now().toString();
    const aid = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      { id: uid, role: 'user', content: text },
      { id: aid, role: 'assistant', content: '', isStreaming: true },
    ]);

    // Force scroll after adding messages
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await aiApi.chat(text, sessionId);
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let products: Product[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              content += data.content;
              setMessages(prev => prev.map(m =>
                m.id === aid ? { ...m, content } : m
              ));
              scrollToBottom();
            } else if (data.type === 'products') {
              products = data.products || [];
            }
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content, products, isStreaming: false } : m
      ));
      setTimeout(() => scrollToBottom(true), 100);
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.', isStreaming: false } : m
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, sessionId, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
           style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>TechMart AI</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                МН · EN хэлийг ойлгодог
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); aiApi.clearSession(sessionId); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <Trash2 className="w-3.5 h-3.5" /> Шинэ яриа
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4"
           style={{ background: 'var(--surface-1)', overflowAnchor: 'none' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-brand-primary" />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Юу хайж байна вэ?
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Монгол эсвэл Англи хэлээр бичнэ үү
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggested.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-2 rounded-xl border hover:border-brand-primary hover:text-brand-primary transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-0)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map(msg => (
            <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              {/* Avatar */}
              <div className={cn(
                'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5',
                msg.role === 'assistant' ? 'bg-brand-primary' : 'bg-[var(--surface-2)]'
              )}>
                {msg.role === 'assistant'
                  ? <Bot className="w-3.5 h-3.5 text-white" />
                  : <User className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />}
              </div>

              {/* Bubble + products */}
              <div className={cn('flex flex-col gap-2', msg.role === 'user' ? 'items-end' : 'items-start', 'max-w-[85%]')}>
                {/* Text */}
                {(msg.content || msg.isStreaming) && (
                  <div className={cn(
                    'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-brand-primary text-white rounded-tr-sm'
                      : 'rounded-tl-sm border'
                  )}
                  style={msg.role === 'assistant' ? {
                    background: 'var(--surface-0)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  } : { whiteSpace: 'pre-wrap' }}>
                    {msg.isStreaming && !msg.content ? <TypingDots /> : msg.content}
                  </div>
                )}

                {/* Product cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full">
                    <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                      {msg.products.length} бүтээгдэхүүн олдлоо:
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1"
                         style={{ scrollbarWidth: 'thin' }}>
                      {msg.products.map(p => <ProductMiniCard key={p.id} product={p} />)}
                    </div>
                  </div>
                )}

                {/* No products */}
                {msg.role === 'assistant' && !msg.isStreaming && msg.products?.length === 0 && msg.content && (
                  <Link to="/shop" className="text-xs text-brand-primary hover:underline">
                    → Дэлгүүрт бүгдийг харах
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t px-4 py-3"
           style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={i18n.language === 'mn' ? '3 сая доторх gaming laptop...' : 'Gaming laptop under 3 million...'}
            disabled={isLoading}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }}}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          />
          <button type="submit" disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all">
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Powered by Groq · Llama 3.3
        </p>
      </div>
    </div>
  );
}
