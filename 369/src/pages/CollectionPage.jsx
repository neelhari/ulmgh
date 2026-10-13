import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';
import { ArrowLeft, PackageOpen } from 'lucide-react';

export function CollectionPage() {
  const { type } = useParams();
  const { products, loading } = useStoreData();

  // Determine filtering logic and titles based on collection type
  let filteredProducts = [];
  let title = '';
  let subtitle = '';

  if (type === 'best-sellers') {
    title = 'Best Sellers';
    subtitle = 'Our most loved and purchased products by customers.';
    filteredProducts = products.filter(p => p.is_bestseller);
  } else if (type === 'trending') {
    title = 'Trending Now';
    subtitle = 'Hot products that everyone is talking about right now.';
    filteredProducts = products.filter(p => p.is_trending);
  } else if (type === 'top-picks') {
    title = 'Top Picks For You';
    subtitle = 'Specially curated products with great offers just for you.';
    filteredProducts = products.filter(p => p.is_offer);
  } else {
    title = 'Collection Not Found';
    filteredProducts = [];
  }

  return (
    <div className="bg-transparent min-h-screen pb-24 md:pb-12">
      <Header variant="back" title={title} />
      
      {/* Desktop Title Banner */}
      <div className="hidden md:block bg-white border-b border-gray-100 py-8 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">
          <Link to="/" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-6">
        {!loading && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : !loading && filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900">No products found</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
              We couldn't find any products in this collection right now. Please check back later!
            </p>
            <Link to="/" className="mt-6 bg-brand-blue text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
