import React, { useState, useMemo } from 'react';
import {
  Flame,
  Star,
  Plus,
  Check,
  TrendingUp,
  Sparkles,
  UtensilsCrossed,
  Coffee
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LEGEND_MENU, MenuItem } from '../data/legendMenu';
import { StoreOrder } from '../data/orderStore';
import { CartItem } from '../App';
import { useTheme } from '../utils/theme';

interface PopularRecommendationsProps {
  allOrders: StoreOrder[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  formatRupiah: (val: number) => string;
}

type RecommendationTab = 'terlaris' | 'main_course' | 'beverages' | 'snack';

export const PopularRecommendations: React.FC<PopularRecommendationsProps> = ({
  allOrders,
  cart,
  onAddToCart,
  formatRupiah,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<RecommendationTab>('terlaris');

  // Compute order frequencies dynamically from real customer order history
  const orderStats = useMemo(() => {
    const countMap = new Map<string, number>();

    allOrders.forEach((order) => {
      // consider non-cancelled orders
      if (order.status === 'batal') return;
      order.items.forEach((ci) => {
        const id = ci.menu.id;
        const name = ci.menu.name.toLowerCase().trim();
        if (id) {
          countMap.set(id, (countMap.get(id) || 0) + ci.quantity);
        }
        countMap.set(name, (countMap.get(name) || 0) + ci.quantity);
      });
    });

    return countMap;
  }, [allOrders]);

  // Generate enriched recommended items
  const recommendations = useMemo(() => {
    const enriched = LEGEND_MENU.map((menu) => {
      const orderCount = Math.max(
        orderStats.get(menu.id) || 0,
        orderStats.get(menu.name.toLowerCase().trim()) || 0
      );

      // Score: order frequency weight + popularity flag bonus
      const score = orderCount * 12 + (menu.isPopular ? 18 : 0);

      return {
        ...menu,
        orderCount,
        score,
      };
    });

    let filtered = enriched;
    if (activeTab === 'main_course') {
      filtered = enriched.filter((m) => m.category === 'main_course');
    } else if (activeTab === 'beverages') {
      filtered = enriched.filter((m) => m.category === 'beverages');
    } else if (activeTab === 'snack') {
      filtered = enriched.filter((m) => m.category === 'snack' || m.category === 'classic');
    }

    // Sort descending by calculated score
    filtered.sort((a, b) => b.score - a.score);

    // Pick top 8 items
    return filtered.slice(0, 8);
  }, [orderStats, activeTab]);

  return (
    <section
      className={`mx-4 mt-3 rounded-2xl border p-3.5 shadow-xl relative overflow-hidden transition-colors ${
        isDark
          ? 'bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border-amber-500/30 shadow-amber-500/5'
          : 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 border-amber-500/40 shadow-neutral-200/60 text-neutral-900'
      }`}
    >
      {/* Decorative ambient background blur */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title & Live Order Indicator */}
      <div
        className={`flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 pb-2.5 border-b ${
          isDark ? 'border-neutral-800' : 'border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-sm">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-black text-amber-500 font-serif tracking-wide uppercase">
                Rekomendasi Terlaris
              </h2>
              <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                <TrendingUp className="w-2.5 h-2.5" />
                Trending
              </span>
            </div>
            <p className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              Paling sering dipesan oleh tamu lain di Legend Lounge
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 pt-2.5 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'terlaris', label: '🔥 Paling Favorit', icon: Sparkles },
          { id: 'main_course', label: '🥩 Main Course', icon: UtensilsCrossed },
          { id: 'beverages', label: '🍹 Minuman', icon: Coffee },
          { id: 'snack', label: '🍟 Snack & Classic', icon: Flame },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as RecommendationTab)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 border cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm font-black'
                  : isDark
                  ? 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-700/70'
                  : 'bg-white hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-300 shadow-2xs'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Horizontal Swipeable Showcase Cards */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1 pb-1 scroll-smooth snap-x snap-mandatory">
        {recommendations.map((item) => {
          const inCartCount = cart
            .filter((c) => c.menu.id === item.id)
            .reduce((sum, c) => sum + c.quantity, 0);

          return (
            <div
              key={item.id}
              className={`w-44 shrink-0 snap-start rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-md border ${
                isDark
                  ? 'bg-neutral-800/70 hover:bg-neutral-800 border-neutral-700/80 hover:border-amber-500/50'
                  : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-amber-500/50 shadow-xs'
              }`}
            >
              {/* Image & Badges */}
              <div className={`relative h-28 w-full overflow-hidden ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                <img
                  src={
                    item.image ||
                    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
                  }
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/20" />

                {/* Top Badge: Order Count or Popularity */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  {item.orderCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-neutral-950/90 text-amber-300 border border-amber-500/50 text-[9px] font-extrabold flex items-center gap-1 shadow-sm backdrop-blur-xs">
                      <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      <span>Dipesan {item.orderCount}x</span>
                    </span>
                  ) : item.isPopular ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-neutral-950 text-[9px] font-black shadow-sm">
                      👑 Pilihan Favorit
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-neutral-900/90 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                      ⭐ Chef's Pick
                    </span>
                  )}
                </div>

                {/* Rating badge */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-neutral-950/80 border border-neutral-700 text-[9px] font-bold text-amber-400 flex items-center gap-0.5 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>4.9</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3
                    className={`text-xs font-bold line-clamp-1 group-hover:text-amber-500 transition-colors ${
                      isDark ? 'text-neutral-100' : 'text-neutral-900'
                    }`}
                  >
                    {item.name}
                  </h3>
                  <p
                    className={`text-[10px] line-clamp-1 mt-0.5 ${
                      isDark ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    {item.subCategory || item.description}
                  </p>
                </div>

                {/* Price & Order Action */}
                <div
                  className={`pt-1.5 border-t flex items-center justify-between gap-1 ${
                    isDark ? 'border-neutral-700/60' : 'border-neutral-200'
                  }`}
                >
                  <div>
                    <span className={`text-[9px] block -mb-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Harga
                    </span>
                    <span className="text-xs font-black font-mono text-amber-500">
                      {formatRupiah(item.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCart(item)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer ${
                      inCartCount > 0
                        ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 font-extrabold'
                        : isDark
                        ? 'bg-neutral-800 hover:bg-amber-500 text-neutral-200 hover:text-neutral-950 border border-neutral-600 hover:border-amber-400'
                        : 'bg-neutral-100 hover:bg-amber-500 text-neutral-700 hover:text-neutral-950 border border-neutral-300 hover:border-amber-400'
                    }`}
                    title={`Pesan ${item.name}`}
                  >
                    {inCartCount > 0 ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>{inCartCount}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Pesan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

