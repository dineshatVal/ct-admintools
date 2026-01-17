import {
  Drawer,
  useModalState,
} from '@commercetools-frontend/application-components';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { TCurrencyCode } from '@commercetools-uikit/money-input';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../../contexts/auth-context';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import ProductForm from '../products/product-form';
import { mapProductTailoringToProductFormData } from './mappers';
import {
  ProductDraft,
  ProductTailoring,
  ProductTailoringUpdateAction,
} from '@commercetools/platform-sdk';

export interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  price: {
    currencyCode: TCurrencyCode;
    amount: string;
  };
  imageUrl: string;
  imageLabel: string;
  productType: {
    typeId: 'product-type';
    id: string;
  };
}

const compareProductValues = (
  currentData: ProductFormData,
  newDraft: ProductDraft,
  locale: string
): Partial<ProductFormData> => {
  const changes: Partial<ProductFormData> = {};

  // Compare name
  if (currentData.name !== newDraft.name?.[locale]) {
    changes.name = newDraft.name?.[locale] || '';
  }

  // Compare description
  if (currentData.description !== newDraft.description?.[locale]) {
    changes.description = newDraft.description?.[locale] || '';
  }

  // Compare image
  const newImage = newDraft.masterVariant?.images?.[0];
  if (newImage) {
    if (
      currentData.imageUrl !== newImage.url ||
      currentData.imageLabel !== newImage.label
    ) {
      changes.imageUrl = newImage.url;
      changes.imageLabel = newImage.label || '';
    }
  }

  return changes;
};

const ProductDetails = ({
  onBack,
  linkToWelcome,
}: {
  onBack: () => void;
  linkToWelcome: string;
}) => {
  const { productId } = useParams<{ productId: string }>();
  const { isModalOpen, openModal, closeModal } = useModalState(true);
  const { storeKey } = useAuthContext();
  const {
    getProductById,
    getProductTailoringInStore,
    createProductTailoring,
    updateProductTailoring,
  } = useStoreProducts({});
  const { dataLocale } = useApplicationContext();

  const [productData, setProductData] = useState<ProductFormData | null>(null);
  const [productTailoring, setProductTailoring] =
    useState<ProductTailoring | null>(null);

  const handleBack = () => {
    onBack();
    closeModal();
  };

  const handleUpdateProduct = useCallback(
    async (productDraft: ProductDraft): Promise<boolean> => {
      if (!productData || !dataLocale) return false;

      const changedValues = compareProductValues(
        productData,
        productDraft,
        dataLocale
      );
      if (Object.keys(changedValues).length === 0) {
        return true;
      }

      if (productTailoring) {
        const updateActions: ProductTailoringUpdateAction[] = [];
        if (changedValues.description) {
          updateActions.push({
            action: 'setDescription',
            description: {
              [dataLocale]: changedValues.description,
            },
          });
        }
        if (changedValues.name) {
          updateActions.push({
            action: 'setName',
            name: {
              [dataLocale]: changedValues.name,
            },
          });
        }
        if (changedValues.imageUrl) {
          updateActions.push({
            action: 'setImages',
            sku: productData.sku,
            images: [
              {
                url: changedValues.imageUrl!,
                dimensions: {
                  w: 100,
                  h: 100,
                },
                label: changedValues.imageLabel,
              },
            ],
          });
        }
        const success = await updateProductTailoring(productId, updateActions);
        return success !== null;
      } else {
        const success = await createProductTailoring({
          product: {
            typeId: 'product',
            id: productId,
          },
          ...(changedValues.description && {
            description: {
              [dataLocale]: changedValues.description,
            },
          }),
          ...(changedValues.name && {
            name: {
              [dataLocale]: changedValues.name,
            },
          }),
          ...((changedValues.imageUrl || changedValues.imageLabel) && {
            variants: [
              {
                sku: productData.sku,
                images: [
                  {
                    url: changedValues.imageUrl!,
                    dimensions: {
                      w: 100,
                      h: 100,
                    },
                    label: changedValues.imageLabel,
                  },
                ],
              },
            ],
          }),
        });
        return success !== null;
      }

      // TODO: Implement the actual update logic using changedValues
      return true;
    },
    [productData, dataLocale, productTailoring]
  );

  useEffect(() => {
    const fetchProductData = async () => {
      const productData = await getProductById(productId);
      const productTailoring = await getProductTailoringInStore(productId);
      setProductTailoring(productTailoring);
      setProductData(
        mapProductTailoringToProductFormData(productData, dataLocale!)
      );
    };
    if (storeKey) {
      fetchProductData();
    }
  }, [productId, storeKey]);

  if (!productData) {
    return null;
  }

  return (
    <Drawer
      isOpen={isModalOpen}
      title="Product Details"
      hideControls
      size={20}
      onClose={handleBack}
    >
      <ProductForm
        isEdit={true}
        isCreate={false}
        initialData={productData}
        onBack={handleBack}
        onSubmit={async (productData) => {
          const success = await handleUpdateProduct(productData);
          if (success) {
            closeModal();
            onBack();
          }
        }}
      />
    </Drawer>
  );
};

export default ProductDetails;
