'use client';

import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Building2, 
  Globe, 
  TrendingUp, 
  Shield,
  Database,
  Zap,
  Target,
  Compass
} from 'lucide-react';

const navigation = [
  {
    name: 'COGRI',
    href: '/',
    icon: BarChart3,
    description: 'Country-Specific Geopolitical Risk Intelligence'
  },
  {
    name: 'Portfolio',
    href: '/cogri-portfolio',
    icon: Building2,
    description: 'Portfolio Risk Analysis'
  },
  {
    name: 'Strategic Forecast',
    href: '/strategic-forecast',
    icon: Compass,
    description: 'Company Geopolitical Outlook'
  },
  {
    name: 'Data Quality',
    href: '/data-quality',
    icon: Shield,
    description: 'Data Quality Management'
  },
  {
    name: 'Data Expansion',
    href: '/data-expansion',
    icon: Target,
    description: 'Expand to 500+ Companies'
  },
  {
    name: 'Trading Signals',
    href: '/trading-signal-service',
    icon: TrendingUp,
    description: 'AI Trading Signal Service'
  }
];

export function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Globe className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-xl">GeoRisk Intelligence</span>
              </a>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <a>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex items-center space-x-2",
                          isActive && "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Button>
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              340 Companies
            </Button>
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Live Data
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}