import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Produto } from '../types';

export interface QuoteItem {
  product: Produto;
  quantity: number;
}

interface QuoteContextType {
  quoteItems: QuoteItem[];
  addToQuote: (product: Produto, quantity?: number) => void;
  removeFromQuote: (productId: string | number) => void;
  updateQuantity: (productId: string | number, quantity: number) => void;
  clearQuote: () => void;
  totalItemsCount: number;
  isInQuote: (productId: string | number) => boolean;
  getItemQuantity: (productId: string | number) => number;
  isQuoteModalOpen: boolean;
  setIsQuoteModalOpen: (isOpen: boolean) => void;
  openQuoteModal: () => void;
  closeQuoteModal: () => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(() => {
    const saved = localStorage.getItem('quote_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('quote_items', JSON.stringify(quoteItems));
  }, [quoteItems]);

  const addToQuote = (product: Produto, quantity = 1) => {
    setQuoteItems(prev => {
      const existing = prev.find(item => (item.product.id || item.product.codigo_referencia) === (product.id || product.codigo_referencia));
      if (existing) {
        return prev.map(item => 
          (item.product.id || item.product.codigo_referencia) === (product.id || product.codigo_referencia) 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromQuote = (productId: string | number) => {
    setQuoteItems(prev => prev.filter(item => (item.product.id || item.product.codigo_referencia) !== productId));
  };

  const updateQuantity = (productId: string | number, quantity: number) => {
    setQuoteItems(prev => prev.map(item => 
      (item.product.id || item.product.codigo_referencia) === productId ? { ...item, quantity } : item
    ));
  };

  const clearQuote = () => setQuoteItems([]);
  
  const isInQuote = (productId: string | number) => quoteItems.some(item => (item.product.id || item.product.ref) === productId);
  const getItemQuantity = (productId: string | number) => quoteItems.find(item => (item.product.id || item.product.ref) === productId)?.quantity || 0;
  
  const totalItemsCount = quoteItems.reduce((acc, item) => acc + item.quantity, 0);

  const openQuoteModal = () => setIsQuoteModalOpen(true);
  const closeQuoteModal = () => setIsQuoteModalOpen(false);

  return (
    <QuoteContext.Provider value={{
      quoteItems, addToQuote, removeFromQuote, updateQuantity, clearQuote,
      totalItemsCount, isInQuote, getItemQuantity,
      isQuoteModalOpen, setIsQuoteModalOpen, openQuoteModal, closeQuoteModal
    }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (!context) throw new Error('useQuote must be used within QuoteProvider');
  return context;
};
