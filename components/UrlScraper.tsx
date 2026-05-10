
'use client';

import { useState } from 'react';
import { Link, Loader2, Sparkles } from 'lucide-react';

interface UrlScraperProps {
  onScrape: (url: string) => void;
}

export default function UrlScraper({ onScrape }: UrlScraperProps) {
  const [url, setUrl] = useState('');

  const handleButtonClick = () => {
    if (url.trim()) {
      onScrape(url.trim());
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="url"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-400 transition-all duration-300"
            placeholder="https://mahwous.com/products/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleButtonClick()}
            dir="ltr"
          />
        </div>
        <button
          onClick={handleButtonClick}
          disabled={!url.trim()}
          className="bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Sparkles size={20} />
          <span>ابـدأ</span>
        </button>
      </div>
    </div>
  );
}
