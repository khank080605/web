import { Link } from 'react-router-dom';

const Home = () => {
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

      {/* Promotional Banner */}
      <section className="py-xl">
        <div className="w-full bg-secondary-container rounded-xl flex flex-col md:flex-row items-center justify-between p-lg md:p-xl border border-outline-variant/20 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-surface-container-highest rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-[512px] mb-lg md:mb-0">
            <h2 className="text-headline-lg font-headline-lg text-on-secondary-container mb-sm">Upgrade Your Lenses</h2>
            <p className="text-body-md font-body-md text-on-secondary-container/80 mb-md">Get 50% off all premium lens coatings (anti-reflective, scratch-resistant) when you purchase any new frame this week.</p>
            <button className="bg-secondary text-on-secondary px-lg py-2 rounded-DEFAULT font-label-md hover:bg-on-secondary-fixed-variant transition-colors">Claim Offer</button>
          </div>
          
          <div className="relative z-10 flex space-x-sm">
            <div className="w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-sm border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-4xl">lens_blur</span>
            </div>
            <div className="w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-sm border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-4xl">light_mode</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
