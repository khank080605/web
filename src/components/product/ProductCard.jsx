import { Link } from 'react-router-dom';
import { resolveColor } from '../../utils/colorConfig';

const ProductCard = ({ product, openTryOn }) => {
  // Assume the product might have multiple variants. We use the first variant for default display.
  const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : {};
  const price = defaultVariant.price || 0;
  const image = defaultVariant.image || 'https://via.placeholder.com/400';
  const colors = product.variants ? [...new Set(product.variants.map(v => v.color || ''))].filter(Boolean) : [];

  // Discount logic
  const discount = product.discount || null;
  let discountedPrice = null;
  if (discount) {
    if (discount.type_discount === 'Percent') {
      discountedPrice = price - (price * discount.discount_value / 100);
    } else {
      discountedPrice = price - discount.discount_value;
    }
    discountedPrice = Math.max(0, discountedPrice);
  }

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const formatDiscountValue = (d) => {
    if (d.type_discount === 'Percent') return `-${d.discount_value}%`;
    return `-${formatPrice(d.discount_value)}`;
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <Link to={`/products/${product.product_id}`} className="flex flex-col flex-1">
        <div className="relative bg-surface-variant aspect-square overflow-hidden flex items-center justify-center">
          {/* Discount badge - top left corner */}
          {discount && (
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-error text-on-error text-xs font-bold px-2 py-1 rounded-br-lg shadow-sm flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">local_offer</span>
                {formatDiscountValue(discount)}
              </div>
            </div>
          )}
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
                style={{ backgroundColor: resolveColor(color) }}
               ></div>
             ))}
            {colors.length > 3 && (
               <span className="font-body-sm text-body-sm text-on-surface-variant ml-auto">+{colors.length - 3} Colors</span>
            )}
          </div>

          <p className="font-headline-sm text-headline-sm text-primary font-bold mt-base">
            {discount ? (
              <>
                <span className="line-through text-on-surface-variant text-body-sm font-normal mr-1">
                  {formatPrice(price)}
                </span>
                <span className="text-error">{formatPrice(discountedPrice)}</span>
              </>
            ) : (
              formatPrice(price)
            )}
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

