import React from 'react';
import Products from './products';
import { StoreProductsProvider } from './store-products-wrapper';
import { useAuthContext } from '../../contexts/auth-context';

interface ProductsProps {
  onBack: () => void;
  linkToWelcome: string;
}

const ProductsWrapper = ({ onBack, linkToWelcome }: ProductsProps) => {
  const { storeKey } = useAuthContext();
  if (!storeKey) {
    return null;
  }
  return (
    <StoreProductsProvider storeKey={storeKey}>
      <Products onBack={onBack} linkToWelcome={linkToWelcome} />
    </StoreProductsProvider>
  );
};

export default ProductsWrapper;
