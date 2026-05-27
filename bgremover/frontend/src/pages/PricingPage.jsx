import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Sparkles, Check, Zap, Crown, Star, ArrowLeft, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 749,
    coins: 50,
    coinIcon: 'coin',
    tagline: 'Perfect for freelancers',
    color: '#FFC570',
    bg: 'rgba(255,197,112,0.08)',
    border: 'rgba(255,197,112,0.25)',
    features: [
      '50 background removals',
      'HD quality output (PNG)',
      'Commercial usage rights',
      'Priority processing queue',
      'Email support',
    ],
    popular: false,
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2399,
    coins: 200,
    coinIcon: 'medal',
    tagline: 'For growing businesses',
    color: '#6495ED',
    bg: 'rgba(100,149,237,0.08)',
    border: 'rgba(100,149,237,0.3)',
    features: [
      '200 background removals',
      'Ultra-HD quality (up to 25MP)',
      'Batch processing support',
      'API access',
      'Priority support',
      'White-label downloads',
    ],
    popular: true,
    icon: Star,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 6499,
    coins: 999,
    coinIcon: 'gem',
    tagline: 'Power pack for teams',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.3)',
    features: [
      '999 background removals',
      'Maximum quality output',
      'Unlimited batch processing',
      'Full API access + webhooks',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
    ],
    popular: false,
    icon: Crown,
  },
];

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load Razorpay Checkout. Please check your internet connection.'));
  document.body.appendChild(script);
});

export default function PricingPage() {
  const { user, updateUser, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(null);

  const handleUpgrade = async (planId) => {
    if (!user) {
      toast.error('Please sign in first!');
      navigate('/register');
      return;
    }

    setUpgrading(planId);
    try {
      await loadRazorpayCheckout();
      const orderRes = await axios.post('/api/payments/create-order', { plan: planId });
      const order = orderRes.data;

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        notes: {
          plan: order.plan,
          coins: String(order.coins),
        },
        theme: {
          color: '#FFC570',
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/api/payments/verify', {
              plan: order.plan,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            updateUser({
              plan: verifyRes.data.plan,
              coins: verifyRes.data.coins,
              totalImagesProcessed: verifyRes.data.totalImagesProcessed,
            });
            await fetchProfile();
            toast.success(`${verifyRes.data.addedCoins || order.coins} coins added to your account!`);
            navigate('/dashboard');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setUpgrading(null);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled');
            setUpgrading(null);
          },
        },
      });

      razorpay.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed');
        setUpgrading(null);
      });

      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to start payment');
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen px-6 py-16" style={{ background: '#080f1f' }}>
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={() => navigate(user ? '/dashboard' : '/')}
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
          style={{ color: '#547792' }}
        >
          <ArrowLeft size={16} />
          {user ? 'Back to Dashboard' : 'Back to Home'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm" style={{ background: 'rgba(255,197,112,0.1)', border: '1px solid rgba(255,197,112,0.2)', color: '#FFC570' }}>
          <Sparkles size={14} />
          Razorpay secure checkout
        </div>
        <h1 className="font-display font-black text-5xl mb-4" style={{ color: '#EFD2B0' }}>
          Choose Your <span className="gold-text">Plan</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: '#547792' }}>
          Buy a coin package once. After Razorpay confirms payment, coins are added to your account instantly.
        </p>
      </div>

      <div className="max-w-5xl mx-auto mb-8">
        <div className="glass rounded-2xl p-5 flex items-center justify-between" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="text-3xl">C</div>
            <div>
              <div className="font-semibold" style={{ color: '#EFD2B0' }}>Free Plan - 7 Coins</div>
              <div className="text-sm" style={{ color: '#547792' }}>Every new account starts here. No credit card needed.</div>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: '#547792' }}>
            {user?.plan === 'free' ? 'Current' : 'Default'}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {PLANS.map((plan) => {
          const isCurrentPlan = user?.plan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className="relative rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{
                background: plan.popular ? `linear-gradient(135deg, ${plan.bg}, rgba(255,255,255,0.02))` : plan.bg,
                border: `1px solid ${plan.popular ? plan.color + '60' : plan.border}`,
                boxShadow: plan.popular ? `0 0 40px ${plan.color}20` : 'none',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)`, color: '#1A3263' }}
                >
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                    <Icon size={18} style={{ color: plan.color }} />
                  </div>
                  <span className="text-xs uppercase tracking-widest" style={{ color: plan.color }}>{plan.coinIcon}</span>
                </div>
                <div className="font-display font-black text-2xl mb-1" style={{ color: '#EFD2B0' }}>{plan.name}</div>
                <div className="text-xs" style={{ color: '#547792' }}>{plan.tagline}</div>
              </div>

              <div className="mb-6 pb-6" style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-display font-black" style={{ color: plan.color }}>Rs {plan.price}</span>
                  <span className="text-sm" style={{ color: '#547792' }}>/one-time</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: '#EFD2B0' }}>
                  <span className="font-bold">{plan.coins} coins</span>
                  <span style={{ color: '#547792' }}>= {plan.coins} removals</span>
                </div>
                <div className="mt-3 flex gap-1 flex-wrap">
                  {Array.from({ length: Math.min(plan.coins / (plan.id === 'elite' ? 100 : plan.id === 'pro' ? 20 : 5), 10) }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: `${plan.color}60` }} />
                  ))}
                  <span className="text-xs self-center ml-1" style={{ color: '#547792' }}>{plan.id === 'elite' ? '999 coins' : ''}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                      <Check size={11} style={{ color: plan.color }} />
                    </div>
                    <span className="text-sm" style={{ color: '#EFD2B0', opacity: 0.85 }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading === plan.id}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}bb)`, color: '#1A3263' }}
              >
                {upgrading === plan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Opening Razorpay...
                  </>
                ) : (
                  <>
                    {isCurrentPlan ? `Buy ${plan.name} Again` : `Buy ${plan.name}`}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto text-center">
        <div className="glass rounded-3xl p-8" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-display font-bold text-2xl mb-6" style={{ color: '#EFD2B0' }}>
            How do coins work?
          </h2>
          <div className="grid grid-cols-3 gap-6 mb-6">
            {[
              { step: '1', title: 'Buy a plan', desc: 'Pay with Razorpay' },
              { step: '2', title: 'Coins added', desc: 'Backend verifies first' },
              { step: '3', title: 'Remove BG', desc: '1 coin per image' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold" style={{ background: 'rgba(255,197,112,0.15)', border: '1px solid rgba(255,197,112,0.3)', color: '#FFC570' }}>
                  {s.step}
                </div>
                <div className="text-sm font-semibold mb-1" style={{ color: '#EFD2B0' }}>{s.title}</div>
                <div className="text-xs" style={{ color: '#547792' }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: '#547792' }}>
            Coins are credited only after server-side Razorpay signature verification.
          </p>
        </div>
      </div>
    </div>
  );
}
