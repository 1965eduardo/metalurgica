'use client';

import React, { useState } from 'react';
import { EditableText } from './EditableText';
import { slugify } from '../utils/slugify';
import { ArrowUpRight } from 'lucide-react';

interface ProductGridProps {
  products: any[];
  onSelectProduct?: (produto: any) => void;
}

export default function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  const [visibleCount, setVisibleCount] = useState(12);

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 12);
  };

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  return (
    <div className="w-full space-y-10">
      {/* GRID DE PRODUTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleProducts.map((product) => {
          const productTitle = product.titulo || product.name || '';
          const productSlug = slugify(productTitle) || product.id?.toString() || '';
          const productUrl = `/produto/${productSlug}`;

          return (
            <div
              key={product.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('button')) return;
                if (!e.ctrlKey && !e.metaKey && onSelectProduct) {
                  e.preventDefault();
                  onSelectProduct(product);
                }
              }}
              className="border border-gray-800 bg-[#1f2128] rounded-xl p-4 shadow flex flex-col justify-between hover:border-theme-primary/50 transition-all duration-200 cursor-pointer"
            >
              <div>
                <a
                  href={productUrl}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && onSelectProduct) {
                      e.preventDefault();
                      onSelectProduct(product);
                    }
                  }}
                  className="no-underline block group"
                >
                  <h3 className="font-bold text-white text-base group-hover:text-theme-primary transition-colors">{productTitle}</h3>
                </a>
                {product.codigo_referencia && (
                  <p className="text-xs text-theme-primary font-mono mt-1">REF: {product.codigo_referencia}</p>
                )}
                {product.descricao && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.descricao}</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800/80">
                <a
                  href={productUrl}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && onSelectProduct) {
                      e.preventDefault();
                      onSelectProduct(product);
                    }
                  }}
                  className="w-full h-10 px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 bg-theme-primary text-white hover:brightness-110 shadow-sm cursor-pointer no-underline"
                >
                  <span>Mais Detalhes</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* ÁREA DO BOTÃO / FIM DO CATÁLOGO */}
      <div className="flex justify-center pt-6 pb-12">
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            className="relative overflow-visible bg-theme-primary hover:brightness-110 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <EditableText contentKey="catalog_btn_load_more" defaultText="Carregar mais" as="span" />
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium py-2 px-4 bg-gray-800/20 rounded-full border border-gray-800">
            <span>✨</span>
            <span>Sem mais produtos</span>
          </div>
        )}
      </div>
    </div>
  );
}
