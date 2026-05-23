import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Lock, Eye, Zap, Globe, Key, Github, Twitter, ArrowRight, Menu, X } from 'lucide-react';

const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 120;

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
      }));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.x -= dx * 0.005;
          p.y -= dy * 0.005;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / CONNECTION_DISTANCE)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouse);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed(text.slice(0, idx + 1));
        setIdx(idx + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [idx, text]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  );
}

function FeatureCard({ icon: Icon, title, desc, i }: { icon: React.ElementType; title: string; desc: string; i: number }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    setRotate({ x, y });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.5 }}
      onMouseMove={onMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      style={{ transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, transition: 'transform 0.1s ease' }}
      className="card-interactive p-6 cursor-default"
    >
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p style={{ color: 'var(--text-secondary)' }} className="text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

const features = [
  { icon: Lock, title: 'End-to-End Encrypted', desc: 'Your data is encrypted with your personal key before it ever leaves your device.' },
  { icon: Shield, title: 'Zero-Knowledge Architecture', desc: 'We never see your passwords. Not even we can decrypt your vault.' },
  { icon: Eye, title: 'Private Notes', desc: 'Keep encrypted journals and notes that only you can read.' },
  { icon: Zap, title: 'Instant Access', desc: 'Lightning fast access to your vault across all devices.' },
  { icon: Globe, title: 'Curated Newsletter', desc: 'Stay informed with AI-curated news tailored to your interests.' },
  { icon: Key, title: 'Password Generator', desc: 'Generate cryptographically strong passwords with one click.' },
];

const stats = [
  { value: '256-bit', label: 'AES Encryption' },
  { value: 'Zero', label: 'Knowledge Architecture' },
  { value: '100%', label: 'Open Source' },
  { value: '∞', label: 'Vault Items' },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <ParticleCanvas />

      {/* Navbar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong shadow-lg' : ''}`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Amantra" className="w-8 h-8" />
            <span className="text-xl font-bold gradient-text">Amantra</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="link-animated text-sm" style={{ color: 'var(--text-secondary)' }}>Features</a>
            <a href="#stats" className="link-animated text-sm" style={{ color: 'var(--text-secondary)' }}>Security</a>
            <Link to="/login" className="btn btn-ghost text-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary text-sm">Get Started</Link>
          </div>
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: 'transparent' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden glass-strong p-4 mx-4 mb-4 rounded-lg flex flex-col gap-3">
            <a href="#features" className="text-sm py-2" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#stats" className="text-sm py-2" style={{ color: 'var(--text-secondary)' }} onClick={() => setMenuOpen(false)}>Security</a>
            <Link to="/login" className="btn btn-ghost text-sm justify-start" onClick={() => setMenuOpen(false)}>Log in</Link>
            <Link to="/register" className="btn btn-primary text-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero */}
      <motion.section style={{ opacity: heroOpacity }} className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mb-6">
            <span className="badge badge-purple text-sm px-4 py-1">🔐 Your Digital Fortress</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Secure Everything.</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Remember Nothing.</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="mb-10">
            <p className="text-lg md:text-xl" style={{ color: 'var(--text-secondary)' }}>
              <TypewriterText text="Passwords, notes, watchlists — encrypted and always within reach." />
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary text-base px-8 py-3">
              Start for Free <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary text-base px-8 py-3">Learn More</a>
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, <span className="gradient-text">nothing you don't</span></h2>
            <p style={{ color: 'var(--text-secondary)' }} className="max-w-xl mx-auto">Built with security-first principles and a clean interface that gets out of your way.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{s.value}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center card p-12 animate-border-glow">
          <h2 className="text-3xl font-bold mb-4">Ready to take control?</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Join thousands who trust Amantra with their digital lives.</p>
          <Link to="/register" className="btn btn-primary text-base px-8 py-3">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>© 2024 Amantra. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="btn btn-ghost btn-icon" aria-label="GitHub"><Github size={18} /></a>
            <a href="#" className="btn btn-ghost btn-icon" aria-label="Twitter"><Twitter size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
