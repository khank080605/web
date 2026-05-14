import { Link } from 'react-router-dom';

const ProductCard = ({ product, openTryOn }) => {
  // Assume the product might have multiple variants. We use the first variant for default display.
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : {};
  const price = defaultVariant.price || 0;
  const image = defaultVariant.image || 'https://via.placeholder.com/400';
  const colors = product.variants ? [...new Set(product.variants.map(v => v.color || ''))].filter(Boolean) : [];

  // Normalize and map common Vietnamese color names (or other human-friendly names)
  const normalize = (s = '') =>
    s
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();

  const mapVietnameseColor = (raw) => {
    if (!raw) return 'transparent';
    const value = raw.toString().trim();
    // If it's already a hex or valid CSS color (starts with # or a known keyword), return as-is
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return value;
    const n = normalize(value);
    if (n.includes('vang') || n.includes('kim')) return '#d4af37'; // gold
    if (n.includes('bac') || n.includes('silver')) return '#c0c0c0';
    if (n.includes('den')) return '#000000';
    if (n.includes('doi') || n.includes('moi') || n.includes('tortoise') || n.includes('doi moi')) return '#8b5e3c';
    if (n.includes('hong') || n.includes('rose')) return '#f4c2c2';
    if (n.includes('trong') || n.includes('transparent') || n.includes('khong')) return 'transparent';
    // fallback: return the raw value (may be English color name like "Black")
    return value;
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <Link to={`/products/${product.product_id}`} className="flex flex-col flex-1">
        <div className="relative bg-surface-variant aspect-square overflow-hidden flex items-center justify-center">
          {/* Replace with actual image url from backend, e.g., using a static server path or direct URL */}
          <img 
            alt={product.product_name} 
            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
            src={image.startsWith('http') ? image : `http://localhost:3000/uploads/${image}`}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400' }}
          />
          {!product.is_active && (
             <div className="absolute top-2 right-2 flex space-x-1">
               <span className="bg-error-container text-on-error-container text-xs font-label-md px-2 py-1 rounded-full border border-outline-variant/30 backdrop-blur-sm">Out of Stock</span>
             </div>
          )}
        </div>
        
        <div className="p-sm flex flex-col gap-base flex-1">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            {product.brand?.brand_name || product.brand_name || 'Brand'}
          </span>
          <h4 className="font-headline-sm text-headline-sm text-on-surface truncate">
            {product.product_name}
          </h4>
          
          <div className="flex gap-xs items-center mt-auto pt-sm border-t border-surface-container-high">
            {/* Mock color display based on count */}
             {colors.slice(0, 3).map((color, index) => (
               <div
                key={index}
                className="w-4 h-4 rounded-full border border-outline"
                style={{ backgroundColor: mapVietnameseColor(color) }}
               ></div>
             ))}
            {colors.length > 3 && (
               <span className="font-body-sm text-body-sm text-on-surface-variant ml-auto">+{colors.length - 3} Colors</span>
            )}
          </div>
          
          <p className="font-headline-sm text-headline-sm text-primary font-bold mt-base">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
          </p>
        </div>
      </Link>

      {openTryOn && (
        <div className="px-sm pb-sm">
          <button
            type="button"
            onClick={() => openTryOn(product)}
            className="w-full rounded-lg border border-outline-variant px-sm py-xs font-label-md text-label-md text-primary hover:border-secondary hover:text-secondary transition-colors flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">face</span>
            Thử kính
          </button>
        </div>
      )}
      </div>
  );
};

export default ProductCard;
