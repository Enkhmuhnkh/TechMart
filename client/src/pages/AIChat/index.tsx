import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Trash2, User, ShoppingCart, ExternalLink,
  Sparkles, Globe, History, ChevronRight, Plus, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api';
import { formatPrice, effectivePrice, discountPercent, imgUrl } from '../../utils';
import { useAddToCart } from '../../hooks';
import { useAuthStore } from '../../store';
import type { Product } from '../../types';
import { cn } from '../../utils';
import { useQuery } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  isStreaming?: boolean;
  isWebSearch?: boolean;
}

const SUGGESTED = [
  '3 сая доторх gaming laptop санал болго',
  'Camera хамгийн сайн утас аль вэ?',
  'Programming хийх зориулалттай laptop',
  '144Hz gaming monitor харьцуул',
  'AirPods ба Sony WH-1000XM5 аль нь дээр?',
  'Хямдралтай earbuds байна уу?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      {[0,1,2].map(i => (
        <motion.span key={i} className="block w-2 h-2 rounded-full bg-brand-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
          transition={{ duration: 1.1, delay: i * 0.22, repeat: Infinity }} />
      ))}
    </div>
  );
}

function ProductMiniCard({ product }: { product: Product }) {
  const { mutate: addToCart, isPending } = useAddToCart();
  const { isAuthenticated } = useAuthStore();
  const price = effectivePrice(product.price, product.sale_price);
  const discount = discountPercent(product.price, product.sale_price);
  const outOfStock = product.stock_quantity === 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border hover:border-brand-primary/30 transition-colors group"
      style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
      <Link to={`/products/${product.slug}`}>
        <div className="relative h-32 flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--surface-1)' }}>
          {product.image_url
            ? <img src={imgUrl(product.image_url)} alt={product.name}
                className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-4xl">📦</span>}
          {discount && <span className="absolute top-2 left-2 badge-danger text-xs">-{discount}%</span>}
        </div>
      </Link>
      <div className="p-2.5 space-y-1.5">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{product.brand_name}</p>
        <Link to={`/products/${product.slug}`}>
          <p className="text-xs font-semibold line-clamp-2 leading-snug hover:text-brand-primary transition-colors"
            style={{ color: 'var(--text-primary)' }}>{product.name}</p>
        </Link>
        <p className="text-sm font-bold text-brand-primary">{formatPrice(price)}</p>
        {product.sale_price && (
          <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>{formatPrice(Number(product.price))}</p>
        )}
        <div className="flex gap-1.5 pt-0.5">
          <Link to={`/products/${product.slug}`}
            className="w-7 h-7 rounded-lg border flex items-center justify-center hover:border-brand-primary transition-colors flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}>
            <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <button
            onClick={() => isAuthenticated && !outOfStock && addToCart({ productId: product.id })}
            disabled={outOfStock || isPending || !isAuthenticated}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold rounded-lg py-1 bg-brand-primary text-white disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all">
            <ShoppingCart className="w-3 h-3" />
            {outOfStock ? 'Дууссан' : 'Нэмэх'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn('w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5',
        isUser ? 'bg-[var(--surface-2)]' : 'bg-brand-primary')}>
        {isUser
          ? <User className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          : <Bot className="w-3.5 h-3.5 text-white" />}
      </div>

      <div className={cn('flex flex-col gap-2.5', isUser ? 'items-end' : 'items-start', 'max-w-[85%]')}>
        {/* Web search indicator */}
        {msg.isWebSearch && !isUser && (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
            <Globe className="w-3 h-3 animate-spin" style={{ animationDuration: '2s' }} />
            Интернетээс мэдээлэл хайж байна...
          </div>
        )}

        {/* Text bubble */}
        {(msg.content || msg.isStreaming) && (
          <div className={cn('px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser ? 'bg-brand-primary text-white rounded-tr-sm' : 'rounded-tl-sm border')}
            style={!isUser ? {
              background: 'var(--surface-0)', borderColor: 'var(--border)',
              color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
            } : { whiteSpace: 'pre-wrap' }}>
            {msg.isStreaming && !msg.content ? <TypingDots /> : msg.content}
          </div>
        )}

        {/* Product cards */}
        {msg.products && msg.products.length > 0 && (
          <div className="w-full">
            <p className="text-xs mb-2 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <span className="w-1 h-3 rounded-full bg-brand-primary inline-block" />
              {msg.products.length} бүтээгдэхүүн олдлоо:
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {msg.products.map(p => <ProductMiniCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {!isUser && !msg.isStreaming && msg.products?.length === 0 && msg.content && (
          <Link to="/shop" className="text-xs text-brand-primary hover:underline flex items-center gap-1">
            → Дэлгүүрт бүгдийг харах
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function AIChatPage() {
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Chat history from API
  const { data: chatHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => aiApi.getHistory(),
    enabled: isAuthenticated && showHistory,
  });

  const scrollToBottom = useCallback((force = false) => {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length, scrollToBottom]);

  const startNewChat = () => {
    setMessages([]);
    setSessionId(Math.random().toString(36).slice(2) + Date.now().toString(36));
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const loadSession = async (token: string) => {
    try {
      const history = await aiApi.getSession(token);
      setSessionId(token);
      setMessages(history.map((m: any, i: number) => ({
        id: i.toString(),
        role: m.role,
        content: m.content,
        products: [],
      })));
      setShowHistory(false);
    } catch {}
  };

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
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await aiApi.chat(text, sessionId);
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let products: Product[] = [];
      let isWebSearch = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              // Web search signal
              if (data.content === '\n' && !isWebSearch) {
                isWebSearch = true;
                setMessages(prev => prev.map(m => m.id === aid ? { ...m, isWebSearch: true } : m));
              } else {
                content += data.content;
                setMessages(prev => prev.map(m => m.id === aid ? { ...m, content, isWebSearch: false } : m));
                scrollToBottom();
              }
            } else if (data.type === 'products') {
              products = data.products || [];
            }
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content, products, isStreaming: false, isWebSearch: false } : m
      ));
      setTimeout(() => scrollToBottom(true), 100);
      if (isAuthenticated) refetchHistory();
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.', isStreaming: false } : m
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, sessionId, scrollToBottom, isAuthenticated, refetchHistory]);

  return (
    <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>

      {/* History sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-72 flex-shrink-0 flex flex-col border-r overflow-hidden"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>

            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Яриын түүх</span>
              <button onClick={() => setShowHistory(false)} className="btn-ghost p-1.5 rounded-lg">
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            <button onClick={startNewChat}
              className="mx-3 mt-3 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed text-sm font-medium transition-all hover:border-brand-primary hover:text-brand-primary"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <Plus className="w-4 h-4" /> Шинэ яриа
            </button>

            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
              {!isAuthenticated ? (
                <div className="text-center py-8 px-4">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Яриын түүх харахын тулд нэвтэрнэ үү</p>
                  <Link to="/login" className="btn-primary btn-sm mt-3 inline-flex text-xs">Нэвтрэх</Link>
                </div>
              ) : chatHistory?.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--text-tertiary)' }}>Яриа байхгүй байна</p>
              ) : chatHistory?.map((s: any) => (
                <button key={s.session_token} onClick={() => loadSession(s.session_token)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[var(--surface-1)] transition-colors group flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.title || 'Яриа'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {s.message_count} мессеж
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(!showHistory)}
              className={cn('p-1.5 rounded-lg transition-colors', showHistory ? 'bg-brand-primary/10 text-brand-primary' : 'btn-ghost')}
              title="Яриын түүх">
              <History className="w-4 h-4" style={{ color: showHistory ? '#6C63FF' : 'var(--text-secondary)' }} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>TechMart AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Дэлгүүр + Интернет мэдлэгтэй
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={startNewChat}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                style={{ color: 'var(--text-secondary)' }}>
                <Plus className="w-3.5 h-3.5" /> Шинэ
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5"
          style={{ background: 'var(--surface-1)' }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-lg mx-auto">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)', boxShadow: '0 8px 24px rgba(108,99,255,0.4)' }}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--surface-1)] animate-pulse" />
              </motion.div>

              <div>
                <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                  TechMart AI туслагч
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Дэлгүүрийн бараануудаас хайх, харьцуулах<br />
                  болон интернетээс мэдээлэл олоход туслана
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-3.5 py-2 rounded-xl border hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-0)' }}>
                    {s}
                  </motion.button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span className="flex items-center gap-1"><Bot className="w-3 h-3" /> Монгол & English</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Интернет хайлт</span>
                <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Шууд нэмэх</span>
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          </div>
          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t px-4 py-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="max-w-3xl mx-auto flex gap-2 items-center">
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="3 сая доторх gaming laptop санал болго..."
              disabled={isLoading}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#6C63FF'; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
            />
            <motion.button type="submit" disabled={!input.trim() || isLoading}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)', boxShadow: '0 4px 12px rgba(108,99,255,0.35)' }}>
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </form>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Powered by Groq · Llama 3.3 · Интернет хайлттай
          </p>
        </div>
      </div>
    </div>
  );
}
