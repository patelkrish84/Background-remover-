import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Sparkles, Zap, Shield, Star, ArrowRight, Upload, ChevronDown } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'Lightning Fast', desc: 'AI-powered removal in under 3 seconds' },
  { icon: Shield, title: 'Privacy First', desc: 'Images never stored. Processed & deleted instantly.' },
  { icon: Star, title: 'HD Quality', desc: 'Up to 25 megapixel output, pixel-perfect edges' },
];

const STATS = [
  { value: '10M+', label: 'Images Processed' },
  { value: '98.7%', label: 'Accuracy Rate' },
  { value: '<3s', label: 'Avg. Processing' },
  { value: '150+', label: 'Countries' },
];

const BEFORE_AFTER = [
  { 
    before: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
    label: 'Portrait'
  },
  { 
    before: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    label: 'Product'
  },
  { 
    before: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
    label: 'Animal'
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, setPendingImage } = useAuth();
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Only image files are allowed! (JPG, PNG, WEBP)');
      return;
    }
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file only!');
        return;
      }
      setPendingImage(file);
      if (user) {
        navigate('/dashboard');
      } else {
        toast.success('Image selected! Create an account to continue.');
        navigate('/register');
      }
    }
  }, [user, navigate, setPendingImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 12 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleStartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(user ? '/dashboard' : '/register');
  };

  return (
    <div className="min-h-screen relative">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)' }}>
              <Sparkles size={16} style={{ color: '#1A3263' }} />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: '#EFD2B0' }}>ClearCut<span style={{ color: '#FFC570' }}>AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/pricing')} className="px-4 py-2 text-sm rounded-lg transition-all hover:text-yellow-400" style={{ color: '#EFD2B0' }}>
              Pricing
            </button>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-gold px-5 py-2 rounded-xl text-sm font-semibold">
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm rounded-lg transition-all" style={{ color: '#EFD2B0' }}>
                  Sign In
                </button>
                <button onClick={() => navigate('/register')} className="btn-gold px-5 py-2 rounded-xl text-sm font-semibold">
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #FFC570, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #547792, transparent)' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Headline */}
          <h1 className="font-display font-black leading-tight mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            Remove Backgrounds
            <br />
            <span className="gold-text">Instantly & Perfectly</span>
          </h1>

          <p className="text-lg mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#EFD2B0', opacity: 0.8 }}>
            Upload any image and watch our AI erase the background in seconds. Professional-grade results for portraits, products, logos & more.
          </p>

          {/* Upload Zone */}
          <div
            {...getRootProps({ onClick: handleStartClick })}
            className={`drop-zone rounded-3xl p-12 cursor-pointer mb-4 relative overflow-hidden transition-all ${isDragActive || dragActive ? 'active' : ''}`}
            style={{ maxWidth: '600px', margin: '0 auto 16px' }}
          >
            <input {...getInputProps()} />
            {/* Shimmer on drag */}
            {isDragActive && <div className="absolute inset-0 shimmer rounded-3xl" />}

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, rgba(255,197,112,0.2), rgba(84,119,146,0.2))', border: '1px solid rgba(255,197,112,0.3)' }}>
                <Upload size={32} style={{ color: '#FFC570' }} />
              </div>
              <div>
                <p className="text-xl font-semibold mb-1" style={{ color: '#EFD2B0' }}>
                  {isDragActive ? '✨ Drop your image here!' : 'Drop your image here'}
                </p>
                <p className="text-sm" style={{ color: '#547792' }}>or create an account to upload • JPG, PNG, WEBP • Max 12MB</p>
              </div>
              <button
                type="button"
                onClick={handleStartClick}
                className="btn-gold px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
              >
                <Upload size={16} />
                Upload Image
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <p className="text-xs" style={{ color: '#547792' }}>
            🔒 7 free removals • No credit card required • Results in seconds
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} style={{ color: '#547792' }} />
        </div>
      </section>

      {/* BEFORE/AFTER SHOWCASE */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl mb-4" style={{ color: '#EFD2B0' }}>
              See the <span className="gold-text">Magic</span>
            </h2>
            <p style={{ color: '#547792' }}>Real examples processed by ClearCut AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BEFORE_AFTER.map((item, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden group">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.before}
                    alt={item.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex items-end p-4" style={{ background: 'linear-gradient(to top, rgba(26,50,99,0.8), transparent)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#FFC570' }} />
                      <span className="text-sm font-medium" style={{ color: '#EFD2B0' }}>{item.label}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-center gap-2">
                  <Sparkles size={14} style={{ color: '#FFC570' }} />
                  <span className="text-sm" style={{ color: '#547792' }}>AI Processed in &lt;2s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-black text-4xl mb-1 gold-text">{stat.value}</div>
                <div className="text-sm" style={{ color: '#547792' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl mb-4" style={{ color: '#EFD2B0' }}>
              Why Choose <span className="gold-text">ClearCut AI?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass rounded-2xl p-8 hover:glow-border transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(255,197,112,0.2), rgba(84,119,146,0.2))', border: '1px solid rgba(255,197,112,0.2)' }}>
                  <f.icon size={22} style={{ color: '#FFC570' }} />
                </div>
                <h3 className="font-display font-bold text-xl mb-3" style={{ color: '#EFD2B0' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#547792' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-12">
            <h2 className="font-display font-black text-4xl mb-4" style={{ color: '#EFD2B0' }}>
              Ready to get started?
            </h2>
            <p className="mb-8" style={{ color: '#547792' }}>Join 10M+ users. 7 free removals, no card needed.</p>
            <button onClick={() => navigate('/register')} className="btn-gold px-10 py-4 rounded-2xl text-lg font-bold flex items-center gap-3 mx-auto">
              Start for Free
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-sm" style={{ color: '#547792' }}>
          © 2026 ClearCutAI. AI-powered background removal for creators.
        </p>
      </footer>
    </div>
  );
}
