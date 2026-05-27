import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Sparkles, Eye, EyeOff, ArrowRight, Mail, Lock, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, firebaseAuthMessage } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(firebaseAuthMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(firebaseAuthMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12" style={{ background: 'linear-gradient(135deg, #0f1e3d, #1A3263)' }}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #FFC570, transparent)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #547792, transparent)' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,197,112,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,197,112,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)' }}>
              <Sparkles size={22} style={{ color: '#1A3263' }} />
            </div>
            <span className="font-display font-black text-2xl" style={{ color: '#EFD2B0' }}>
              ClearCut<span style={{ color: '#FFC570' }}>AI</span>
            </span>
          </div>

          {/* Floating image mockup */}
          <div className="relative w-72 h-72 mx-auto mb-10">
            <div className="absolute inset-0 rounded-3xl overflow-hidden" style={{ border: '2px solid rgba(255,197,112,0.3)' }}>
              <img
                src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop"
                alt="Example"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 glass rounded-2xl px-4 py-3 flex items-center gap-2 animate-float" style={{ border: '1px solid rgba(255,197,112,0.3)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FFC570' }} />
              <span className="text-xs font-semibold" style={{ color: '#EFD2B0' }}>Background Removed ✓</span>
            </div>
            <div className="absolute -top-4 -left-4 glass rounded-2xl px-4 py-3 animate-float" style={{ animationDelay: '1s', border: '1px solid rgba(84,119,146,0.3)' }}>
              <span className="text-xs font-semibold" style={{ color: '#FFC570' }}>⚡ 1.8 seconds</span>
            </div>
          </div>

          <h2 className="font-display font-bold text-2xl mb-3" style={{ color: '#EFD2B0' }}>
            Professional Results,<br />Zero Effort
          </h2>
          <p className="text-sm" style={{ color: '#547792' }}>
            AI-powered background removal trusted by<br />10 million+ professionals worldwide.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#080f1f' }}>
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)' }}>
              <Sparkles size={16} style={{ color: '#1A3263' }} />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#EFD2B0' }}>ClearCut<span style={{ color: '#FFC570' }}>AI</span></span>
          </div>

          <div className="mb-8">
            <h1 className="font-display font-black text-3xl mb-2" style={{ color: '#EFD2B0' }}>
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: '#547792' }}>
              Sign in to continue removing backgrounds
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#EFD2B0' }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#547792' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="you@example.com"
                  className="input-field w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: '#EFD2B0' }}>Password</label>
                <span className="text-xs cursor-pointer hover:underline" style={{ color: '#FFC570' }}>Forgot password?</span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#547792' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  className="input-field w-full pl-11 pr-12 py-3.5 rounded-xl text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#547792' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: '#547792' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#EFD2B0', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Chrome size={16} />
            Continue with Google
          </button>

          {/* Register link */}
          <p className="text-center text-sm mt-6" style={{ color: '#547792' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#FFC570' }}>
              Sign up free →
            </Link>
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6">
            {['🔒 Secure', '⚡ Fast', '🎯 Accurate'].map((badge, i) => (
              <span key={i} className="text-xs" style={{ color: '#547792' }}>{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
