import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import CoinBar from '../components/CoinBar';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Upload, Download, RefreshCw, Sparkles, LogOut, User,
  ZoomIn, ZoomOut, ChevronRight, ImageIcon, Layers, X, Crown
} from 'lucide-react';

const COIN_ICONS = ['🪙', '🥈', '🥇', '💎', '👑', '⚡', '🔥'];
const MAX_UPLOAD_EDGE = 512;
const UPLOAD_QUALITY = 0.7;

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    URL.revokeObjectURL(url);
    resolve(img);
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Unable to read this image.'));
  };

  img.src = url;
});

const resizeImageForUpload = async (file) => {
  if (file.type === 'image/gif') return file;

  const image = await loadImage(file);
  const largestEdge = Math.max(image.width, image.height);
  if (largestEdge <= MAX_UPLOAD_EDGE && file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  const scale = Math.min(1, MAX_UPLOAD_EDGE / largestEdge);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', UPLOAD_QUALITY);
  });

  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
};

export default function DashboardPage() {
  const { user, logout, updateUser, pendingImage, setPendingImage } = useAuth();
  const navigate = useNavigate();
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderRef = useRef(null);
  const hasMounted = useRef(false);

  // Process pending image from landing page
  useEffect(() => {
    if (pendingImage && !hasMounted.current) {
      hasMounted.current = true;
      handleFileSelected(pendingImage);
      setPendingImage(null);
    }
  }, []);

  const handleFileSelected = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed! No PDFs or other files.');
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalImage({ file, url, name: file.name });
    setProcessedImage(null);
    setShowOriginal(false);
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0]?.errors?.[0];
      if (err?.code === 'file-too-large') toast.error('File too large! Max 12MB');
      else if (err?.code === 'file-invalid-type') toast.error('Only image files allowed! (JPG, PNG, WEBP)');
      else toast.error('Invalid file. Only images allowed!');
      return;
    }
    if (acceptedFiles.length > 0) handleFileSelected(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 12 * 1024 * 1024,
    noClick: !!originalImage,
  });

  const removeBackground = async () => {
    if (!originalImage) return;
    if (user.coins <= 0) {
      toast.error('No coins left! Upgrade your plan.', { duration: 4000 });
      navigate('/pricing');
      return;
    }

    setProcessing(true);
    const toastId = toast.loading('Preparing image...');

    try {
      const uploadFile = await resizeImageForUpload(originalImage.file);
      const formData = new FormData();
      formData.append('image', uploadFile);

      toast.loading('AI is removing the background...', { id: toastId });

      const res = await axios.post('/api/images/remove-bg', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 240000,
      });

      setProcessedImage(res.data.image);
      updateUser({ coins: res.data.coinsLeft, totalImagesProcessed: res.data.totalProcessed });

      toast.success(`Background removed! ${res.data.coinsLeft} coins left.`, { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.data?.limitReached) {
        toast.error('🪙 Coin limit reached! Upgrade your plan.', { id: toastId, duration: 5000 });
        setTimeout(() => navigate('/pricing'), 2000);
      } else {
        toast.error(msg || 'Processing failed. The server may be busy; try a smaller image.', { id: toastId });
      }
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `clearcut_${originalImage.name.replace(/\.[^.]+$/, '')}.png`;
    link.click();
    toast.success('Image downloaded!');
  };

  const resetAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setShowOriginal(false);
  };

  // Slider interaction
  const handleSliderMove = (e) => {
    if (!isDraggingSlider || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  // Coin display for header
  const coinIcon = COIN_ICONS[Math.min(user?.plan === 'elite' ? 6 : user?.plan === 'pro' ? 4 : user?.plan === 'starter' ? 2 : 0, COIN_ICONS.length - 1)];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080f1f' }}>
      {/* TOP NAV */}
      <nav className="sticky top-0 z-40 px-6 py-4" style={{ background: 'rgba(8,15,31,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)' }}>
              <Sparkles size={16} style={{ color: '#1A3263' }} />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: '#EFD2B0' }}>ClearCut<span style={{ color: '#FFC570' }}>AI</span></span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Coins compact */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer" style={{ background: 'rgba(255,197,112,0.1)', border: '1px solid rgba(255,197,112,0.2)' }} onClick={() => navigate('/pricing')}>
              <span>{coinIcon}</span>
              <span className="text-sm font-bold font-mono" style={{ color: '#FFC570' }}>{user?.coins}</span>
              <span className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>coins</span>
            </div>

            {/* Upgrade */}
            {user?.plan === 'free' && (
              <button onClick={() => navigate('/pricing')} className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #FFC570, #e8a840)', color: '#1A3263' }}>
                <Crown size={12} />
                Upgrade
              </button>
            )}

            {/* User */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #547792, #1A3263)', color: '#FFC570' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm hidden sm:block" style={{ color: '#EFD2B0' }}>{user?.name?.split(' ')[0]}</span>
            </div>

            <button onClick={() => { logout(); navigate('/'); }} className="p-2 rounded-xl hover:opacity-70 transition-opacity" style={{ color: '#547792' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex">
        {/* SIDEBAR */}
        <div className="hidden lg:flex flex-col w-72 p-6 gap-6" style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <CoinBar />

          {/* Stats */}
          <div className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#547792' }}>Your Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Processed', value: user?.totalImagesProcessed || 0, icon: '🖼️' },
                { label: 'Plan', value: (user?.plan || 'free').toUpperCase(), icon: '✨' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{stat.icon}</span>
                    <span className="text-xs" style={{ color: '#547792' }}>{stat.label}</span>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: '#EFD2B0' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,197,112,0.05)', border: '1px solid rgba(255,197,112,0.1)' }}>
            <h3 className="text-xs font-semibold mb-3" style={{ color: '#FFC570' }}>💡 Pro Tips</h3>
            <ul className="space-y-2 text-xs" style={{ color: '#547792' }}>
              <li>• Use high-contrast subjects for best results</li>
              <li>• PNG output preserves transparency</li>
              <li>• Works best on portraits & products</li>
            </ul>
          </div>

          {user?.plan === 'free' && (
            <button onClick={() => navigate('/pricing')} className="btn-gold py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              <Crown size={14} />
              Upgrade Plan
            </button>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-display font-black text-3xl mb-1" style={{ color: '#EFD2B0' }}>
                Remove Background
              </h1>
              <p className="text-sm" style={{ color: '#547792' }}>
                Upload an image and our AI will remove the background instantly
              </p>
            </div>

            {/* UPLOAD AREA */}
            {!originalImage && (
              <div {...getRootProps()} className={`drop-zone rounded-3xl p-16 text-center cursor-pointer ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, rgba(255,197,112,0.15), rgba(84,119,146,0.15))', border: '1px solid rgba(255,197,112,0.2)' }}>
                    <Upload size={36} style={{ color: isDragActive ? '#FFC570' : '#547792' }} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold mb-2" style={{ color: isDragActive ? '#FFC570' : '#EFD2B0' }}>
                      {isDragActive ? '✨ Release to upload!' : 'Drop your image here'}
                    </p>
                    <p className="text-sm mb-4" style={{ color: '#547792' }}>
                      or click to browse your files
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs" style={{ color: '#547792' }}>
                      {['JPG', 'PNG', 'WEBP', 'GIF'].map(f => (
                        <span key={f} className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>{f}</span>
                      ))}
                      <span>• Max 12MB</span>
                    </div>
                  </div>
                  <button className="btn-gold px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
                    <Upload size={16} />
                    Choose Image
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* IMAGE EDITOR */}
            {originalImage && (
              <div className="animate-fade-in">
                {/* Image display area */}
                <div className="glass rounded-3xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <ImageIcon size={16} style={{ color: '#547792' }} />
                      <span className="text-sm font-medium" style={{ color: '#EFD2B0' }}>{originalImage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {processedImage && (
                        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                          <button
                            onClick={() => setShowOriginal(false)}
                            className="px-3 py-1.5 text-xs font-semibold transition-all"
                            style={{ background: !showOriginal ? 'rgba(255,197,112,0.2)' : 'transparent', color: !showOriginal ? '#FFC570' : '#547792' }}
                          >
                            Removed
                          </button>
                          <button
                            onClick={() => setShowOriginal(true)}
                            className="px-3 py-1.5 text-xs font-semibold transition-all"
                            style={{ background: showOriginal ? 'rgba(84,119,146,0.2)' : 'transparent', color: showOriginal ? '#EFD2B0' : '#547792' }}
                          >
                            Original
                          </button>
                        </div>
                      )}
                      <button onClick={resetAll} className="p-2 rounded-xl transition-all hover:opacity-70" style={{ color: '#547792' }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Image display */}
                  <div className="relative flex items-center justify-center p-6" style={{ minHeight: '400px', background: processedImage && !showOriginal ? undefined : 'rgba(0,0,0,0.2)' }}>
                    {processedImage && !showOriginal ? (
                      <div className="checker-bg rounded-2xl overflow-hidden" style={{ maxHeight: '500px' }}>
                        <img src={processedImage} alt="Background removed" className="max-h-96 max-w-full object-contain" />
                      </div>
                    ) : (
                      <img src={originalImage.url} alt="Original" className="max-h-96 max-w-full object-contain rounded-2xl" />
                    )}

                    {/* Processing overlay */}
                    {processing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl" style={{ background: 'rgba(8,15,31,0.8)', backdropFilter: 'blur(8px)' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse" style={{ background: 'linear-gradient(135deg, rgba(255,197,112,0.2), rgba(84,119,146,0.2))', border: '1px solid rgba(255,197,112,0.3)' }}>
                          <Sparkles size={28} style={{ color: '#FFC570' }} />
                        </div>
                        <p className="font-semibold mb-2" style={{ color: '#EFD2B0' }}>AI Processing...</p>
                        <p className="text-sm" style={{ color: '#547792' }}>Removing background with precision</p>
                        <div className="mt-4 w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full animate-shimmer" style={{ width: '60%', background: 'linear-gradient(90deg, transparent, #FFC570, transparent)', backgroundSize: '200% 100%' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {!processedImage ? (
                    <button
                      onClick={removeBackground}
                      disabled={processing || user?.coins <= 0}
                      className="btn-gold flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3"
                    >
                      {processing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : user?.coins <= 0 ? (
                        <>
                          <Crown size={18} />
                          No coins — Upgrade Plan
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Remove Background
                          <span className="text-xs opacity-70 ml-1">(-1 🪙)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={downloadImage}
                        className="flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #547792, #1A3263)', color: '#EFD2B0' }}
                      >
                        <Download size={18} />
                        Download PNG
                      </button>
                      <button
                        onClick={resetAll}
                        className="py-4 px-6 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#EFD2B0', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <RefreshCw size={16} />
                        New Image
                      </button>
                    </>
                  )}
                </div>

                {/* New upload drop zone */}
                {processedImage && (
                  <div className="mt-6">
                    <div {...getRootProps({ onClick: e => e.stopPropagation() })} className="drop-zone rounded-2xl p-6 text-center cursor-pointer">
                      <input {...getInputProps()} />
                      <div className="flex items-center justify-center gap-3">
                        <Upload size={18} style={{ color: '#547792' }} />
                        <span className="text-sm" style={{ color: '#547792' }}>
                          Drop another image or{' '}
                          <span style={{ color: '#FFC570', cursor: 'pointer' }}>click to browse</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile coin bar */}
            <div className="lg:hidden mt-8">
              <CoinBar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
