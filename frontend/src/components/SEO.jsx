import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, image, url, productSchema }) {
  const defaultTitle = "STUNNA SWAG SEASON | ESPRE$$ YOUR $ELF";
  const defaultDescription = "Premium archival streetwear out of Lagos, Nigeria.";
  const defaultImage = "https://www.stunnaswagseason.store/logo/logo.png"; 
  const defaultUrl = "https://www.stunnaswagseason.store";

  const seo = {
    title: title || defaultTitle,
    description: description || defaultDescription,
    image: image || defaultImage,
    url: url || defaultUrl,
  };

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      
      {/* Geo & Local Tags */}
      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Lagos" />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={seo.image} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content={productSchema ? 'product' : 'website'} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={seo.image} />

      {/* JSON-LD for Products */}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": productSchema.name,
            "image": productSchema.image_urls?.[0] || seo.image,
            "description": productSchema.description,
            "brand": { "@type": "Brand", "name": "Stunna" },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "NGN",
              "price": productSchema.base_price,
              "availability": productSchema.variants?.some(v => v.stock > 0) ? "InStock" : "OutOfStock"
            }
          })}
        </script>
      )}
    </Helmet>
  );
}
