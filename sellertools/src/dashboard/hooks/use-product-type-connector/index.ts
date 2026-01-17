import {
  useAsyncDispatch,
  actions,
  TSdkAction,
} from '@commercetools-frontend/sdk';
import { MC_API_PROXY_TARGETS } from '@commercetools-frontend/constants';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  Attribute,
  AttributeConstraintEnum,
  AttributeDefinition,
  PagedQueryResponse,
  ProductType,
} from '@commercetools/platform-sdk';
import { buildUrlWithParams } from '../../../utils/params';

export const useProductTypeConnector = () => {
  const dispatchProductsRead = useAsyncDispatch<
    TSdkAction,
    PagedQueryResponse
  >();
  const dispatchProductTypeRead = useAsyncDispatch<TSdkAction, ProductType>();
  const context = useApplicationContext((context) => context);

  const getProductTypes = async (
    where?: string,
    limit: number = 100
  ): Promise<ProductType[]> => {
    const result = await dispatchProductsRead(
      actions.get({
        mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
        uri: buildUrlWithParams(`/${context?.project?.key}/product-types`, {
          ...(where ? { where } : {}),
          ...(limit ? { limit: limit.toString() } : {}),
        }),
      })
    );
    return result?.results as ProductType[];
  };

  const getProductType = async (id: string): Promise<ProductType> => {
    const result = await dispatchProductTypeRead(
      actions.get({
        mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
        uri: buildUrlWithParams(
          `/${context?.project?.key}/product-types/${id}`,
          {}
        ),
      })
    );
    return result;
  };

  const getProductTypeAttributeDefinitions = async (
    id: string
  ): Promise<AttributeDefinition[] | undefined> => {
    return getProductType(id).then((productType) => productType.attributes);
  };

  const getAttributes = async (
    id?: string,
    isRequired?: boolean,
    attributeConstraints?: AttributeConstraintEnum[]
  ): Promise<AttributeDefinition[]> => {
    if (!id) return [];
    const result = await dispatchProductTypeRead(
      actions.get({
        mcApiProxyTarget: MC_API_PROXY_TARGETS.COMMERCETOOLS_PLATFORM,
        uri: buildUrlWithParams(
          `/${context?.project?.key}/product-types/${id}`,
          {}
        ),
      })
    );

    let attributes = result.attributes ?? [];
    if (typeof isRequired !== 'undefined') {
      attributes = attributes?.filter(
        (attr: AttributeDefinition) => attr.isRequired === isRequired
      );
    }
    if (
      typeof attributeConstraints !== 'undefined' &&
      attributeConstraints.length > 0
    ) {
      attributes = attributes?.filter((attr: AttributeDefinition) =>
        attributeConstraints.includes(attr.attributeConstraint)
      );
    }

    return attributes;
  };

  return {
    getProductTypes,
    getProductType,
    getProductTypeAttributeDefinitions,
    getAttributes,
  };
};
