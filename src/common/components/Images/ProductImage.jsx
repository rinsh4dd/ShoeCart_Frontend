import React, { useState } from 'react';

function ProductImage({ src, alt = "", className = "" }) {
  const [imgError, setImgError] = useState(false);
  const finalSrc = !src || imgError 
    ? "https://res.cloudinary.com/dmubfrefi/image/private/s--IfN8NC9z--/c_crop,h_2133,w_3200,x_0,y_0/f_auto/q_auto/v1/dee-about-cms-prod-medias/8ad980fd-87c8-4533-98cf-c34277d797f8/nike-x-hyperice-boot-1.jpeg?_a=BAACwmBs" 
    : src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main image */}
      <img
        className="w-full h-full object-contain transition-all duration-500 ease-out 
                   hover:scale-105 hover:opacity-95"
        src={finalSrc}
        alt={alt}
        loading="lazy"
        onError={() => setImgError(true)}
      />

      {/* Gloss overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent 
                      opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Loading shimmer (only if no src initially) */}
      {!src && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 
                        animate-pulse" />
      )}
    </div>
  );
}

export default ProductImage;
