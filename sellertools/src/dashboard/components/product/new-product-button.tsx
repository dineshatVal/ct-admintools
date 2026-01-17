import {
  Drawer,
  useModalState,
} from '@commercetools-frontend/application-components';
import { PlusBoldIcon } from '@commercetools-uikit/icons';
import PrimaryButton from '@commercetools-uikit/primary-button';
import { useIntl } from 'react-intl';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import messages from '../products/messages';
import ProductForm from '../products/product-form';

const AddNewProductButton = ({ onSubmit }: { onSubmit: () => void }) => {
  const { isModalOpen, openModal, closeModal } = useModalState();
  const { createProduct } = useStoreProducts({});
  const intl = useIntl();

  return (
    <>
      <PrimaryButton
        label={intl.formatMessage(messages.addProduct)}
        onClick={() => openModal()}
        iconLeft={<PlusBoldIcon />}
        size="small"
      />
      <Drawer
        isOpen={isModalOpen}
        title="Create a product"
        hideControls
        size={20}
        onClose={closeModal}
      >
        <ProductForm
          isCreate={true}
          isEdit={false}
          onBack={() => closeModal()}
          onSubmit={async (productData) => {
            const success = await createProduct(productData);
            if (success) {
              onSubmit();
              closeModal();
            }
          }}
        />
      </Drawer>
    </>
  );
};

export default AddNewProductButton;
