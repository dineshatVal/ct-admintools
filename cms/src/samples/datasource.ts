export default [
  {
    container: 'datasource',
    key: 'product-by-sku',
    value: {
      name: 'Get Product by SKU',
      key: 'product-by-sku',
      params: [
        {
          key: 'sku',
          type: 'string',
          required: true,
        },
      ],
    },
  },
  {
    container: 'datasource',
    key: 'products-by-sku',
    value: {
      name: 'Get Products by SKU',
      key: 'products-by-sku',
      params: [
        {
          key: 'skus',
          type: 'string',
          required: true,
        },
      ],
    },
  },
];
