import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Home = () => {
  const [lensDiscount, setLensDiscount] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Fetch active discounts on mount
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await api.get('/discounts', {
          params: { is_active: true, limit: 50 }
        });
        const data = res.data.data || {};
        const discounts = data.discounts || [];

        // Filter for active (not expired) discounts
        const now = new Date();
        const active = discounts.filter(d => {
          const end = new Date(d.end_date);
          return end >= now;
        });

        // Pick the highest value discount for hero offer display
        if (active.length > 0) {
          const sorted = [...active].sort((a, b) => b.discount_value - a.discount_value);
          setLensDiscount(sorted[0]);
        }
      } catch (err) {
        console.error('Failed to load discounts', err);
      }
    };
    fetchDiscounts();
  }, []);

  // Countdown timer for the offer end date
  useEffect(() => {
    if (!lensDiscount?.end_date) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(lensDiscount.end_date);
      end.setHours(23, 59, 59, 999);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lensDiscount]);

    // Rotate trust badges notification
  const notifications = [
    { icon: 'local_shipping', text: 'Free shipping on orders over 500,000₫' },
    { icon: 'replay', text: '30-day easy returns' },
    { icon: 'verified', text: '1-year warranty on all frames' },
  ];
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNoticeIndex((prev) => (prev + 1) % notifications.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Build the offer description dynamically
  const getOfferDescription = () => {
    if (!lensDiscount) {
      return 'Get 50% off all premium lens coatings (anti-reflective, scratch-resistant) when you purchase any new frame this week.';
    }

    if (lensDiscount.type_discount === 'Percent') {
      return `🔥 Get ${lensDiscount.discount_value}% off on premium lenses — anti-reflective, scratch-resistant coatings included.`;
    }
    return `🔥 Save ${formatPrice(lensDiscount.discount_value)} on premium lenses — anti-reflective, scratch-resistant coatings included.`;
  };

  const getOfferTitle = () => {
    if (!lensDiscount) return 'Upgrade Your Lenses';
    const code = lensDiscount.discount_id ? `OFFER${lensDiscount.discount_id}` : '';
    return `Upgrade Your Lenses ${code}`;
  };

    return (
    <div className="w-full">
      {/* Hero Banner */}
      <section className="relative w-full h-[600px] bg-surface-variant flex items-center justify-center overflow-hidden mb-xl rounded-xl">
        <img 
          alt="Hero Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-90" 
          src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=2000" 
        />
        <div className="relative z-10 text-center px-lg py-xl bg-surface-container-lowest/80 backdrop-blur-md rounded-xl max-w-[672px] border border-outline-variant/30">
          <h1 className="text-display-lg font-display-lg text-primary mb-sm leading-tight">Clarity meets Style</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant mb-lg max-w-[448px] mx-auto">Discover our new collection of precision-crafted frames designed for modern life.</p>
          <Link to="/products" className="inline-block bg-primary text-on-primary px-xl py-3 rounded-DEFAULT font-label-md hover:bg-inverse-surface transition-colors">
            Shop New Arrivals
          </Link>
        </div>
      </section>

      {/* Featured Categories (Bento Grid) */}
      <section className="py-xl">
        <div className="flex items-center justify-between mb-lg">
          <h2 className="text-headline-lg font-headline-lg text-primary">Shop by Category</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter auto-rows-[300px]">
          {/* Category 1 */}
          <Link to="/products?category=1" className="group relative rounded-xl overflow-hidden bg-surface flex flex-col justify-end p-lg border border-outline-variant/50 hover:border-outline-variant transition-colors md:col-span-2">
            <img 
              alt="Eyeglasses" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-headline-md font-headline-md text-on-primary">Eyeglasses</h3>
              <p className="text-body-md font-body-md text-on-primary/80 mt-1">Prescription ready frames</p>
            </div>
          </Link>
          
          {/* Category 2 */}
          <Link to="/products?category=2" className="group relative rounded-xl overflow-hidden bg-surface flex flex-col justify-end p-lg border border-outline-variant/50 hover:border-outline-variant transition-colors">
            <img 
              alt="Sunglasses" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-headline-md font-headline-md text-on-primary">Sunglasses</h3>
              <p className="text-body-md font-body-md text-on-primary/80 mt-1">UV protection & style</p>
            </div>
          </Link>
          
          {/* Category 3 */}
          <Link to="/products?category=3" className="group relative rounded-xl overflow-hidden bg-surface flex flex-col justify-end p-lg border border-outline-variant/50 hover:border-outline-variant transition-colors md:col-span-3 h-[250px]">
            <img 
              alt="Contact Lenses" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-center" 
              src="https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=1600" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/20 to-transparent"></div>
            <div className="relative z-10 max-w-[512px]">
              <h3 className="text-headline-md font-headline-md text-on-primary">Contact Lenses</h3>
              <p className="text-body-md font-body-md text-on-primary/80 mt-1 mb-sm">Comfortable lenses for daily use.</p>
              <span className="inline-block text-label-md font-label-md text-on-primary uppercase tracking-wider group-hover:underline">Explore Collection &rarr;</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Promotional Banner — Upgrade Your Lenses */}
      <section className="py-xl">
        <div className="w-full bg-secondary-container rounded-xl flex flex-col md:flex-row items-center justify-between p-lg md:p-xl border border-outline-variant/20 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-surface-container-highest rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-[512px] mb-lg md:mb-0">
            <h2 className="text-headline-lg font-headline-lg text-on-secondary-container mb-sm">
              {getOfferTitle()}
            </h2>
            <p className="text-body-md font-body-md text-on-secondary-container/80 mb-md">
              {getOfferDescription()}
            </p>

            {/* Countdown Timer */}
            {timeLeft && (
              <div className="flex items-center gap-3 mb-md">
                <span className="text-label-md font-label-md text-on-secondary-container/70 uppercase tracking-wider">Ends in</span>
                <div className="flex items-center gap-1.5">
                  {timeLeft.days > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="bg-surface-container-lowest text-on-secondary-container font-headline-sm text-headline-sm rounded-lg px-2 py-1 min-w-[40px] text-center font-bold">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-label-sm font-label-sm text-on-secondary-container/60 uppercase mt-0.5">Days</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center">
                    <span className="bg-surface-container-lowest text-on-secondary-container font-headline-sm text-headline-sm rounded-lg px-2 py-1 min-w-[40px] text-center font-bold">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-label-sm font-label-sm text-on-secondary-container/60 uppercase mt-0.5">Hrs</span>
                  </div>
                  <span className="text-headline-sm font-headline-sm text-on-secondary-container font-bold -mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="bg-surface-container-lowest text-on-secondary-container font-headline-sm text-headline-sm rounded-lg px-2 py-1 min-w-[40px] text-center font-bold">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-label-sm font-label-sm text-on-secondary-container/60 uppercase mt-0.5">Min</span>
                  </div>
                  <span className="text-headline-sm font-headline-sm text-on-secondary-container font-bold -mt-4">:</span>
                  <div className="flex flex-col items-center">
                    <span className="bg-surface-container-lowest text-on-secondary-container font-headline-sm text-headline-sm rounded-lg px-2 py-1 min-w-[40px] text-center font-bold">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-label-sm font-label-sm text-on-secondary-container/60 uppercase mt-0.5">Sec</span>
                  </div>
                </div>
              </div>
            )}

            <Link
              to={`/products?category_id=3`}
              className="inline-block bg-secondary text-on-secondary px-lg py-2 rounded-DEFAULT font-label-md hover:bg-on-secondary-fixed-variant transition-colors"
            >
              Claim Offer
            </Link>
          </div>
          
                    {/* Animated Trust Badges — replaces static icons */}
          <div className="relative z-10 w-full max-w-[200px]">
            {/* Rotating notification */}
            <div className="w-full h-24 bg-surface-container-lowest rounded-2xl flex items-center justify-center gap-sm shadow-sm border border-outline-variant/20 transition-all duration-500">
              <span className="material-symbols-outlined text-secondary text-3xl flex-shrink-0">
                {notifications[currentNoticeIndex].icon}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-left leading-tight max-w-[100px]">
                {notifications[currentNoticeIndex].text}
              </span>
            </div>
            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {notifications.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    i === currentNoticeIndex
                      ? 'bg-secondary w-3'
                      : 'bg-outline-variant/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
