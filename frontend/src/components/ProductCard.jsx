import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProductCard = forwardRef(({ product }, ref) => {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col group cursor-pointer"
    >
      <Link to={`/product/${product.slug}`} className="flex flex-col h-full">
        <div className="w-full aspect-[3/4] bg-stunna-text/5 mb-4 overflow-hidden relative border-[1px] border-stunna-text/10">
          {product.thumbnail_url || (product.image_urls && product.image_urls.length > 0) ? (
            <img 
              src={product.thumbnail_url || product.image_urls[0]} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity duration-500">
              <span className="lowercase text-4xl tracking-tighter text-stunna-text">stunna swag season</span>
            </div>
          )}
        </div>
        <div className="flex flex-col px-1">
          <h3 className="text-[10px] md:text-xs uppercase tracking-widest font-medium mb-1 text-stunna-text group-hover:text-stunna-accent transition-colors">{product.name}</h3>
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-stunna-text/70">₦{product.base_price.toLocaleString()}</p>
        </div>
      </Link>
    </motion.div>
  );
});

export default ProductCard;
