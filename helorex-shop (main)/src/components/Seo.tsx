import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

const Seo: React.FC<SeoProps> = ({ 
  title, 
  description = "Discover the latest premium digital trends, electronics, and accessories at Helorex Shop. Quality products with fast delivery.", 
  keywords = "ecommerce, technology, gadgets, digital trends, helorex",
  image = "/og-image.jpg",
  url = "https://helorexshop.com"
}) => {
  const [searchParams] = useSearchParams();
  
  // Logic to determine dynamic title if none is provided
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  
  let displayTitle = title;
  
  if (!displayTitle) {
    if (search) {
      displayTitle = `Search: ${search}`;
    } else if (category && category !== 'all') {
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      displayTitle = `${formattedCategory} Collection`;
    } else {
      displayTitle = "Helorex Shop | Premium Digital Trends";
    }
  }

  const fullTitle = displayTitle.includes("Helorex") ? displayTitle : `${displayTitle} | Helorex Shop`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Viewport & Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#dc2626" />
    </Helmet>
  );
};

export default Seo;
