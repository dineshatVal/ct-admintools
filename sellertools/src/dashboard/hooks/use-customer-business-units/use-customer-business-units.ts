import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import {
  useMcQuery,
  useMcMutation,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { ApolloError } from '@apollo/client';

// Define the interface for the business unit address
interface BusinessUnitAddress {
  id?: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  country: string;
}

// Define the interface for the custom field
interface CustomField {
  name: string;
  value: string | string[];
}

// Define the interface for the business unit
interface BusinessUnit {
  id: string;
  version: number;
  name: string;
  addresses: BusinessUnitAddress[];
  custom: {
    customFieldsRaw: CustomField[];
  };
}

// GraphQL query to fetch customer by ID
const GET_CUSTOMER_QUERY = gql`
  query GetCustomer($id: String!) {
    customer(id: $id) {
      id
      email
      firstName
      lastName
      version
    }
  }
`;

// GraphQL query to fetch business units by customer ID
const GET_BUSINESS_UNITS_BY_CUSTOMER_QUERY = gql`
  query GetBusinessUnitsByCustomer($where: String!) {
    businessUnits(where: $where) {
      results {
        id
        version
        name
        addresses {
          id
          streetNumber
          streetName
          city
          state
          postalCode
          phone
          country
        }
        custom {
          customFieldsRaw {
            name
            value
          }
        }
      }
    }
  }
`;

// GraphQL mutation to update business unit
const UPDATE_BUSINESS_UNIT_MUTATION = gql`
  mutation UpdateBusinessUnit(
    $id: String!
    $version: Long!
    $actions: [BusinessUnitUpdateAction!]!
  ) {
    updateBusinessUnit(id: $id, version: $version, actions: $actions) {
      id
      version
      name
      addresses {
        id
        streetNumber
        streetName
        city
        state
        postalCode
        phone
        country
      }
      custom {
        customFieldsRaw {
          name
          value
        }
      }
    }
  }
`;

// Response type for the customer GraphQL query
interface GetCustomerResponse {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    version: number;
  };
}

// Response type for the business units GraphQL query
interface GetBusinessUnitsResponse {
  businessUnits: {
    results: BusinessUnit[];
  };
}

// Response type for the update business unit mutation
interface UpdateBusinessUnitResponse {
  updateBusinessUnit: BusinessUnit;
}

// Return type for the hook
interface UseCustomerBusinessUnitsHook {
  businessUnits: BusinessUnit[];
  selectedBusinessUnit: BusinessUnit | null;
  loading: boolean;
  error: Error | null;
  fetchBusinessUnitsByCustomerId: (customerId: string) => Promise<void>;
  selectBusinessUnit: (businessUnitId: string) => void;
  updateBusinessUnit: (
    businessUnitId: string,
    addressData: Partial<BusinessUnitAddress>,
    customFields: Record<string, string | string[]>
  ) => Promise<BusinessUnit | null>;
}

// Helper function to validate and format action objects for the GraphQL mutation
const validateActions = (
  actions: Array<Record<string, any>>
): Array<Record<string, any>> => {
  return actions.map((action) => {
    // Ensure each action only has one key at the top level
    const keys = Object.keys(action);
    if (keys.length !== 1) {
      console.error(
        'Invalid action format. Each action must have exactly one top-level key.',
        action
      );
      throw new Error('Invalid action format');
    }

    const actionType = keys[0];
    const actionData = action[actionType];

    // Format: { actionType: { ...actionData } }
    return { [actionType]: actionData };
  });
};

const useCustomerBusinessUnits = (): UseCustomerBusinessUnitsHook => {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] =
    useState<BusinessUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  // Set up the GraphQL query for customer details
  const { refetch: refetchCustomer } = useMcQuery<GetCustomerResponse>(
    GET_CUSTOMER_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  // Set up the GraphQL query for business units
  const { refetch: refetchBusinessUnits } =
    useMcQuery<GetBusinessUnitsResponse>(GET_BUSINESS_UNITS_BY_CUSTOMER_QUERY, {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    });

  // Set up the GraphQL mutation for updating business unit
  const [executeUpdateBusinessUnit] = useMcMutation<
    UpdateBusinessUnitResponse,
    {
      id: string;
      version: number;
      actions: any[];
    }
  >(UPDATE_BUSINESS_UNIT_MUTATION, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  // Function to fetch business units by customer ID
  const fetchBusinessUnitsByCustomerId = useCallback(
    async (customerId: string) => {
      setLoading(true);
      setError(null);

      try {
        // First, verify the customer exists
        const customerResult = await refetchCustomer({ id: customerId });

        if (customerResult?.data?.customer) {
          console.log('Customer found:', customerResult.data.customer);

          // Then, fetch the business units associated with this customer
          const where = `associates(customer(id="${customerId}"))`;
          const businessUnitsResult = await refetchBusinessUnits({ where });

          if (businessUnitsResult?.data?.businessUnits?.results) {
            const units = businessUnitsResult.data.businessUnits.results;
            console.log('Fetched business units:', units);
            setBusinessUnits(units);

            // Don't automatically select the first unit - let the context handle this
            // to avoid multiple selection events
          }
        } else {
          setError(new Error('Customer not found'));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Error fetching business units data')
        );
        console.error('Error fetching business units data:', err);
      } finally {
        setLoading(false);
      }
    },
    [refetchCustomer, refetchBusinessUnits]
  );

  // Function to select a specific business unit by ID
  const selectBusinessUnit = useCallback(
    (businessUnitId: string) => {
      // Only update if the ID is different than current selection
      if (selectedBusinessUnit?.id !== businessUnitId) {
        const unit = businessUnits.find((unit) => unit.id === businessUnitId);
        if (unit) {
          setSelectedBusinessUnit(unit);
        } else {
          console.warn(`Business unit with ID ${businessUnitId} not found`);
        }
      }
    },
    [businessUnits, selectedBusinessUnit]
  );

  // Function to update business unit
  const updateBusinessUnit = useCallback(
    async (
      businessUnitId: string,
      addressData: Partial<BusinessUnitAddress>,
      customFields: Record<string, string | string[]>
    ): Promise<BusinessUnit | null> => {
      try {
        const unit = businessUnits.find((unit) => unit.id === businessUnitId);

        if (!unit) {
          throw new Error(`Business unit with ID ${businessUnitId} not found`);
        }

        // Prepare update actions
        const actions = [];

        // If there are address updates, add changeAddress action
        if (Object.keys(addressData).length > 0) {
          // Find the address to update
          const addressId = unit.addresses[0]?.id;

          if (addressId) {
            // Update existing address
            actions.push({
              changeAddress: {
                addressId,
                address: {
                  ...addressData,
                  country: 'US', // Always include country
                },
              },
            });
          } else {
            // Add new address
            actions.push({
              addAddress: {
                address: {
                  ...addressData,
                  country: 'US', // Always include country
                },
              },
            });
          }
        }

        // Handle custom fields updates
        if (Object.keys(customFields).length > 0) {
          // Convert custom field values to properly escaped JSON strings
          const preparedFields = Object.entries(customFields).map(
            ([name, value]) => ({
              name,
              value: JSON.stringify(value),
            })
          );

          // Check if business unit already has a custom type
          const hasCustomType =
            unit.custom && unit.custom.customFieldsRaw.length > 0;

          if (!hasCustomType) {
            // If no custom type exists yet, set it with all fields at once
            actions.push({
              setCustomType: {
                type: {
                  key: 'seller-store-configuration',
                  typeId: 'type',
                },
                fields: preparedFields,
              },
            });
          } else {
            // If custom type already exists, update individual fields
            for (const { name, value } of preparedFields) {
              actions.push({
                setCustomField: {
                  name,
                  value,
                },
              });
            }
          }
        }

        if (actions.length === 0) {
          console.log('No actions to perform');
          return unit;
        }

        const validatedActions = validateActions(actions);
        console.log(
          'Executing update with actions:',
          JSON.stringify(validatedActions, null, 2)
        );

        try {
          // Execute mutation
          const result = await executeUpdateBusinessUnit({
            variables: {
              id: businessUnitId,
              version: unit.version,
              actions: validatedActions,
            },
          });

          // Update state with new data
          if (result.data?.updateBusinessUnit) {
            const updatedUnit = result.data.updateBusinessUnit;

            console.log(
              'Business unit updated successfully:',
              JSON.stringify(updatedUnit, null, 2)
            );

            // Update business units array
            setBusinessUnits((prev) =>
              prev.map((bu) => (bu.id === updatedUnit.id ? updatedUnit : bu))
            );

            // Update selected business unit if it's the one that was updated
            if (selectedBusinessUnit?.id === updatedUnit.id) {
              setSelectedBusinessUnit(updatedUnit);
            }

            return updatedUnit;
          } else {
            console.error(
              'Update mutation returned successfully but no data was returned'
            );
            return null;
          }
        } catch (mutationError) {
          console.error('GraphQL mutation error:', mutationError);
          // Log detailed information about the error for debugging
          if (mutationError instanceof ApolloError) {
            if (mutationError.graphQLErrors) {
              console.error(
                'GraphQL errors:',
                JSON.stringify(mutationError.graphQLErrors, null, 2)
              );
            }
            if (mutationError.networkError) {
              console.error('Network error:', mutationError.networkError);
            }
          }
          throw mutationError;
        }
      } catch (err) {
        console.error('Error updating business unit:', err);
        throw err;
      }
    },
    [businessUnits, selectedBusinessUnit, executeUpdateBusinessUnit]
  );

  return {
    businessUnits,
    selectedBusinessUnit,
    loading,
    error,
    fetchBusinessUnitsByCustomerId,
    selectBusinessUnit,
    updateBusinessUnit,
  };
};

export default useCustomerBusinessUnits;
