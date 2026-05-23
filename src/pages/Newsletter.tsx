import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, RefreshCw, Flame, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { newsletterAPI } from '../services/api';

interface Article {
  _id?: string;
  title: string;
  url: string;
  source?: string;
  category?: string;
  summary?: string;
  publishedAt?: string;
  relevanceScore?: number;
  tags?: string[];
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const categories = ['all', 'tech', 'ai', 'security', 'business', 'science', 'other'];

export default function Newsletter() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchArticles = useCallback(async (cat?: string) => {
    try {
      const res = await newsletterAPI.feed(cat === 'all' ? undefined : cat);
      setArticles(res.data.articles || res.data || []);
    } catch { toast.error('Failed to load feed'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchArticles(activeCategory); }, [activeCategory, fetchArticles]);

  const refresh = () => { setRefreshing(true); fetchArticles(activeCategory); };

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <span className="badge badge-blue">{articles.length}</span>
        </div>
        <button onClick={refresh} disabled={refreshing} className="btn btn-secondary text-sm">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => { setActiveCategory(cat); setLoading(true); }}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-all"
            style={{ background: activeCategory === cat ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))' : 'var(--bg-surface-light)', color: activeCategory === cat ? 'white' : 'var(--text-secondary)' }}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2">No articles found</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Try a different category or refresh</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Featured */}
          {featured && (
            <motion.a
              href={featured.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="card-interactive p-6 block group relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  {featured.relevanceScore && featured.relevanceScore > 0.8 && (
                    <span className="badge badge-warning flex items-center gap-1"><Flame size={10} /> Hot</span>
                  )}
                  {featured.category && <span className="badge badge-blue capitalize">{featured.category}</span>}
                  {featured.source && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{featured.source}</span>}
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">{featured.title}</h2>
                {featured.summary && <p className="text-sm line-clamp-3 mb-3" style={{ color: 'var(--text-secondary)' }}>{featured.summary}</p>}
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {featured.publishedAt && <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(featured.publishedAt)}</span>}
                  <span className="flex items-center gap-1 group-hover:text-[var(--accent-cyan)] transition-colors"><ExternalLink size={12} /> Read</span>
                </div>
                {featured.tags && featured.tags.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {featured.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="badge badge-purple text-[10px] flex items-center gap-0.5"><Tag size={8} /> {tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.a>
          )}

          {/* Rest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {rest.map((article, i) => (
                <motion.a
                  key={article._id || article.url}
                  href={article.url} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="card-interactive p-4 block group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-muted)' }}>
                      {(article.source || article.title).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{article.source || 'Unknown'}</span>
                    {article.relevanceScore && article.relevanceScore > 0.8 && <Flame size={12} style={{ color: 'var(--warning)' }} />}
                  </div>
                  <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-[var(--accent-cyan)] transition-colors">{article.title}</h3>
                  {article.summary && <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{article.summary}</p>}
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex items-center gap-2">
                      {article.publishedAt && <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(article.publishedAt)}</span>}
                      {article.category && <span className="badge badge-blue text-[10px] capitalize">{article.category}</span>}
                    </div>
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
