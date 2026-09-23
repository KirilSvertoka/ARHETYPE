import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

type Status = 'loading' | 'paid' | 'pending' | 'failed' | 'notfound';

const FAILED_STATUSES = ['failed', 'expired', 'incomplete', 'declined'];

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!orderId) { setStatus('notfound'); return; }
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/orders/${orderId}/payment-status`);
        if (res.ok) {
          const data = await res.json();
          const ps = String(data.payment_status || 'pending');
          if (ps === 'paid') return setStatus('paid');
          if (FAILED_STATUSES.includes(ps)) return setStatus('failed');
        } else if (res.status === 404) {
          return setStatus('notfound');
        }
      } catch { /* network hiccup — retry */ }
      if (attempts < 40) timer = setTimeout(check, 3000);
      else setStatus('pending');
    };
    check();
    return () => clearTimeout(timer);
  }, [orderId]);

  const states = {
    loading: {
      icon: <Clock className="w-10 h-10 text-brand-accent animate-pulse" />,
      title: 'Проверяем оплату…',
      desc: 'Это занимает не более минуты. Не закрывайте страницу.',
    },
    paid: {
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-600" />,
      title: 'Оплата прошла успешно',
      desc: `Спасибо! Заказ №${orderId} оплачен. Мы свяжемся с вами для подтверждения доставки.`,
    },
    pending: {
      icon: <Clock className="w-10 h-10 text-brand-accent" />,
      title: 'Платёж ещё не подтверждён',
      desc: 'Если вы оплатили заказ, банк может подтверждать платёж до нескольких минут. Мы свяжемся с вами в любом случае.',
    },
    failed: {
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      title: 'Платёж не прошёл',
      desc: 'Заказ сохранён и не оплачен. Вы можете повторить оплату или выбрать другой способ — мы свяжемся с вами.',
    },
    notfound: {
      icon: <XCircle className="w-10 h-10 text-red-500" />,
      title: 'Заказ не найден',
      desc: 'Проверьте ссылку или свяжитесь с нами.',
    },
  }[status];

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <Helmet>
        <title>{status === 'paid' ? 'Оплата прошла успешно' : 'Статус оплаты'} — АРХЕТИП</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-4"
      >
        <div className="w-20 h-20 border border-brand-border flex items-center justify-center rounded-full bg-brand-hover/50">
          {states.icon}
        </div>
        <h1 className="text-3xl font-serif text-brand-light">{states.title}</h1>
        <p className="text-brand-muted text-sm max-w-md leading-relaxed">{states.desc}</p>
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-accent text-white text-sm uppercase tracking-widest hover:bg-brand-accent-hover transition-colors"
          >
            В каталог <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-brand-border text-brand-light text-sm uppercase tracking-widest hover:border-brand-accent hover:text-brand-accent transition-colors"
          >
            На главную
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
