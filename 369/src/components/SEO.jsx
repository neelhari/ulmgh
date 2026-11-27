import { useEffect } from 'react';

const SITE_NAME = 'ULMGH369';
const SITE_URL = 'https://www.ulmgh-369.com';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_DESC = 'Experience the next generation of e-commerce. Discover top quality products curated exclusively for you. Shop easily, securely, and get fast delivery with ULMGH369.';

/**
 * Reusable SEO Component for dynamic page titles, meta tags, OpenGraph, Twitter, and JSON-LD structured data.
 */
export function SEO({
  title,
  description = DEFAULT_DESC,
  keywords,
  image = DEFAULT_IMAGE,
  canonical,
  type = 'website',
  schema = null,
  noindex = false,
}) {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title 
      ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`)
      : `${SITE_NAME} | Shop Smart. Live Better.`;
    document.title = formattedTitle;

    // Helper to set or create meta tag by name or property
    const setMeta = (attribute, attrValue, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', description);
    if (keywords) {
      setMeta('name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
    }
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 3. Canonical Link
    const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 4. OpenGraph Tags (Facebook, WhatsApp, LinkedIn)
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', formattedTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', currentUrl);
    setMeta('property', 'og:image', image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`);

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', formattedTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`);

    // 6. JSON-LD Structured Data Schema
    const scriptId = 'structured-data-jsonld';
    let scriptTag = document.getElementById(scriptId);

    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      // Clean up dynamic schema on route unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();
    };
  }, [title, description, keywords, image, canonical, type, schema, noindex]);

  return null;
}
