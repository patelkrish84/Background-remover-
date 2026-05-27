import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const PLAN_MAX = { free: 7, starter: 50, pro: 200, elite: 999 };
const PLAN_COLORS = {
  free:    { bg: 'rgba(84,119,146,0.2)',    border: 'rgba(84,119,146,0.4)',    fill: '#547792',  label: 'FREE' },
  starter: { bg: 'rgba(255,197,112,0.1)',   border: 'rgba(255,197,112,0.3)',   fill: '#FFC570',  label: 'STARTER' },
  pro:     { bg: 'rgba(100,149,237,0.1)',   border: 'rgba(100,149,237,0.3)',   fill: '#6495ED',  label: 'PRO' },
  elite:   { bg: 'rgba(168,85,247,0.1)',    border: 'rgba(168,85,247,0.3)',    fill: '#a855f7',  label: 'ELITE' },
};

export default function CoinBar({ compact = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const max = PLAN_MAX[user.plan] || 7;
  const pct = Math.max(0, Math.min(100, (user.coins / max) * 100));
  const c = PLAN_COLORS[user.plan] || PLAN_COLORS.free;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}
        onClick={() => navigate('/pricing')}
      >
        <span className="text-sm">🪙</span>
        <span className="text-sm font-bold font-mono" style={{ color: c.fill }}>{user.coins}</span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>coins</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5" style={{ border: `1px solid ${c.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪙</span>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-2xl" style={{ color: c.fill }}>{user.coins}</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>/ {max === 999 ? '∞' : max}</span>
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>coins remaining</div>
          </div>
        </div>
        <div className="px-2 py-1 rounded-lg text-xs font-bold font-mono" style={{ background: c.bg, color: c.fill, border: `1px solid ${c.border}` }}>
          {c.label}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full progress-coin"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${c.fill}aa, ${c.fill})`,
            boxShadow: `0 0 10px ${c.fill}50`
          }}
        />
      </div>

      {/* Upgrade CTA if low */}
      {user.plan === 'free' && user.coins <= 3 && (
        <button
          onClick={() => navigate('/pricing')}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)', color: '#1A3263' }}
        >
          <Zap size={12} />
          Upgrade for more coins
        </button>
      )}

      {user.plan !== 'free' && (
        <div className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {user.totalImagesProcessed} images processed in total
        </div>
      )}
    </div>
  );
}
