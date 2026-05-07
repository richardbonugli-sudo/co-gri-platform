import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  type: 'video' | 'article';
}

export default function NewsTicker() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch news items from multiple sources
    const fetchNews = async () => {
      try {
        // For now, we'll use static placeholder data since we need API keys for real data
        // In production, you would fetch from YouTube API and news RSS feeds
        const placeholderNews: NewsItem[] = [
          {
            title: 'Latest Geopolitical Analysis: Global Market Tensions Rise',
            url: 'https://www.youtube.com/@SeanFooGold',
            source: 'Sean Foo',
            type: 'video'
          },
          {
            title: 'Understanding Modern Conflict Dynamics',
            url: 'https://www.youtube.com/@dialogueworks01',
            source: 'Dialogue Works',
            type: 'video'
          },
          {
            title: 'Breaking: Major Geopolitical Developments in Asia-Pacific Region',
            url: 'https://thegeopolitics.com/',
            source: 'The Geopolitics',
            type: 'article'
          },
          {
            title: 'Gold Markets React to Global Uncertainty',
            url: 'https://www.youtube.com/@SeanFooGold',
            source: 'Sean Foo',
            type: 'video'
          },
          {
            title: 'Expert Interview: Future of International Relations',
            url: 'https://www.youtube.com/@dialogueworks01',
            source: 'Dialogue Works',
            type: 'video'
          },
          {
            title: 'Analysis: Economic Sanctions and Their Global Impact',
            url: 'https://thegeopolitics.com/',
            source: 'The Geopolitics',
            type: 'article'
          },
          {
            title: 'Market Update: Precious Metals in Times of Crisis',
            url: 'https://www.youtube.com/@SeanFooGold',
            source: 'Sean Foo',
            type: 'video'
          },
          {
            title: 'Deep Dive: Geopolitical Risk Assessment Strategies',
            url: 'https://www.youtube.com/@dialogueworks01',
            source: 'Dialogue Works',
            type: 'video'
          }
        ];

        setNewsItems(placeholderNews);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching news:', error);
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[#0a1520] border-y border-gray-700 py-3 overflow-hidden">
        <div className="text-[#D4A017] text-sm text-center">Loading latest news...</div>
      </div>
    );
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...newsItems, ...newsItems];

  return (
    <div className="bg-[#0a1520] border-y border-gray-700 py-3 overflow-hidden relative">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a1520] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a1520] to-transparent z-10 pointer-events-none" />
      
      {/* Ticker content */}
      <div className="flex animate-ticker hover:pause-ticker">
        {duplicatedItems.map((item, index) => (
          <a
            key={`${item.title}-${index}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-8 whitespace-nowrap text-[#D4A017] hover:text-[#FFD700] transition-colors group"
          >
            <span className="text-[#0d5f5f]">●</span>
            <span className="font-medium text-sm">{item.source}:</span>
            <span className="text-sm">{item.title}</span>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-ticker {
          animation: ticker 20s linear infinite;
        }

        .hover\\:pause-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}