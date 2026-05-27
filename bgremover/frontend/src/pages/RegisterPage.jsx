import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Sparkles, Eye, EyeOff, ArrowRight, Mail, Lock, User, Check, ImageIcon, Chrome } from 'lucide-react';

const PERKS = [
  '7 free background removals',
  'No credit card required',
  'Results in under 3 seconds',
  'HD quality output (PNG)',
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle, firebaseAuthMessage, pendingImage } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: '#ff6b6b' };
    if (score <= 3) return { level: 2, label: 'Medium', color: '#FFC570' };
    return { level: 3, label: 'Strong', color: '#4ade80' };
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Google account connected! You have 7 free coins.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(firebaseAuthMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! You have 7 free coins 🪙');
      navigate('/dashboard');
    } catch (err) {
      toast.error(firebaseAuthMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12" style={{ background: 'linear-gradient(135deg, #0f1e3d, #1A3263)' }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,197,112,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,197,112,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #FFC570, transparent)' }} />

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)' }}>
              <Sparkles size={22} style={{ color: '#1A3263' }} />
            </div>
            <span className="font-display font-black text-2xl" style={{ color: '#EFD2B0' }}>
              ClearCut<span style={{ color: '#FFC570' }}>AI</span>
            </span>
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-4" style={{ border: '1px solid rgba(255,197,112,0.3)' }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(255,197,112,0.2)' }}>
                <img src={URL.createObjectURL(pendingImage)} alt="Your image" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#FFC570' }}>✨ Image Ready!</p>
                <p className="text-xs" style={{ color: '#547792' }}>Create your account to process this image</p>
                <p className="text-xs mt-1" style={{ color: '#EFD2B0', opacity: 0.6 }}>{pendingImage.name}</p>
              </div>
            </div>
          )}

          <h2 className="font-display font-bold text-2xl mb-8" style={{ color: '#EFD2B0' }}>
            What you'll get<br />
            <span style={{ color: '#FFC570' }}>absolutely free:</span>
          </h2>

          <div className="space-y-4">
            {PERKS.map((perk, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,197,112,0.15)', border: '1px solid rgba(255,197,112,0.3)' }}>
                  <Check size={12} style={{ color: '#FFC570' }} />
                </div>
                <span className="text-sm" style={{ color: '#EFD2B0' }}>{perk}</span>
              </div>
            ))}
          </div>

          {/* Coin display */}
          <div className="mt-10 glass rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(255,197,112,0.2)' }}>
            <div className="text-5xl mb-2">🪙</div>
            <div className="font-display font-black text-4xl mb-1" style={{ color: '#FFC570' }}>7</div>
            <div className="text-sm" style={{ color: '#547792' }}>Free coins on signup</div>
            <div className="text-xs mt-2" style={{ color: '#EFD2B0', opacity: 0.5 }}>1 coin = 1 background removal</div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: '#080f1f' }}>
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)' }}>
              <Sparkles size={16} style={{ color: '#1A3263' }} />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#EFD2B0' }}>ClearCut<span style={{ color: '#FFC570' }}>AI</span></span>
          </div>

          {/* Mobile pending image */}
          {pendingImage && (
            <div className="glass rounded-2xl p-3 mb-6 flex items-center gap-3 lg:hidden" style={{ border: '1px solid rgba(255,197,112,0.2)' }}>
              <ImageIcon size={16} style={{ color: '#FFC570' }} />
              <span className="text-xs" style={{ color: '#EFD2B0' }}>"{pendingImage.name}" ready to process</span>
            </div>
          )}

          <div className="mb-8">
            <h1 className="font-display font-black text-3xl mb-2" style={{ color: '#EFD2B0' }}>
              Create account
            </h1>
            <p className="text-sm" style={{ color: '#547792' }}>
              Start with 7 free coins — no card needed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#EFD2B0' }}>Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#547792' }} />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="John Doe"
                  className="input-field w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium mb-2" style={{ color: '#EFD2B0' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#547792' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Min. 6 characters"
                  className="input-field w-full pl-11 pr-12 py-3.5 rounded-xl text-sm"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#547792' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#EFD2B0' }}>Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#547792' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  placeholder="Repeat password"
                  className="input-field w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  required
                />
                {form.confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {form.password === form.confirmPassword
                      ? <Check size={16} color="#4ade80" />
                      : <span style={{ color: '#ff6b6b', fontSize: '12px' }}>✗</span>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs" style={{ color: '#547792' }}>
              By creating an account, you agree to our{' '}
              <span className="underline cursor-pointer" style={{ color: '#FFC570' }}>Terms of Service</span>
              {' '}and{' '}
              <span className="underline cursor-pointer" style={{ color: '#FFC570' }}>Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs" style={{ color: '#547792' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#EFD2B0', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <Chrome size={16} />
            Continue with Google
          </button>

          <p className="text-center text-sm mt-6" style={{ color: '#547792' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#FFC570' }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
