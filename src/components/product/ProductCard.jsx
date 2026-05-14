import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  // Assume the product might have multiple variants. We use the first variant for default display.
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : {};
  const price = defaultVariant.price || 0;
  const image = defaultVariant.image || 'https://via.placeholder.com/400';
  const colors = product.variants ? [...new Set(product.variants.map(v => v.color))] : [];

  return (
    <Link to={`/products/${product.product_id}`} className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
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
             <div key={index} className="w-4 h-4 rounded-full border border-outline" style={{backgroundColor: color.toLowerCase()}}></div>
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
  );
};

export default ProductCard;
