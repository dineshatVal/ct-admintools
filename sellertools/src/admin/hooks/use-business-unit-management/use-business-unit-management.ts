import { useState, useCallback } from 'react';
import { useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import type { ApolloError } from '@apollo/client';
import gql from 'graphql-tag';

// GraphQL Mutations and Queries
const CREATE_BUSINESS_UNIT = gql`
  mutation CreateBusinessUnit($draft: BusinessUnitDraft!) {
    createBusinessUnit(draft: $draft) {
      id
      version
      key
      name
      unitType
      contactEmail
      createdAt
      addresses {
        id
        key
        country
        firstName
        lastName
        company
        phone
        streetName
        streetNumber
        city
        postalCode
        state
      }
      associates {
        customer {
          id
          email
          firstName
          lastName
        }
        associateRoleAssignments {
          associateRole {
            key
            name
          }
        }
      }
      stores {
        id
        key
        name(locale: "en-US")
      }
    }
  }
`;

// Types
export interface BusinessUnitDraft {
  key: string;
  name: string;
  unitType: 'Company' | 'Division';
  contactEmail?: string;
  parentUnit?: {
    typeId: 'business-unit';
    id: string;
  };
  addresses?: Array<{
    key?: string;
    country: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    streetName?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    state?: string;
  }>;
  associates?: Array<{
    customer: {
      typeId: 'customer';
      id: string;
    };
    associateRoleAssignments: Array<{
      associateRole: {
        typeId: 'associate-role';
        key: string;
      };
    }>;
  }>;
  stores?: Array<{
    typeId: 'store';
    key: string;
  }>;
  storeMode?: 'Explicit' | 'FromParent';
}

export interface BusinessUnit {
  id: string;
  version: number;
  key: string;
  name: string;
  status: string;
  unitType: 'Company' | 'Division';
  contactEmail?: string;
  createdAt: string;
  addresses?: Array<{
    id: string;
    key?: string;
    country: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    streetName?: string;
    streetNumber?: string;
    city?: string;
    postalCode?: string;
    state?: string;
  }>;
  associates?: Array<{
    customer: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    associateRoleAssignments: Array<{
      associateRole: {
        key: string;
        name: string;
      };
    }>;
  }>;
  stores?: Array<{
    id: string;
    key: string;
    name: string;
  }>;
}

export interface BusinessUnitSearchResult {
  results: BusinessUnit[];
  total: number;
}

export interface UseBusinessUnitManagement {
  createBusinessUnit: (
    draft: BusinessUnitDraft
  ) => Promise<BusinessUnit | null>;
  loading: boolean;
  error: ApolloError | null;
}

export const useBusinessUnitManagement = (): UseBusinessUnitManagement => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApolloError | null>(null);

  const [createBusinessUnitMutation] = useMcMutation(CREATE_BUSINESS_UNIT, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  // Create business unit function with associates and stores in single mutation
  const createBusinessUnit = useCallback(
    async (draft: BusinessUnitDraft): Promise<BusinessUnit | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await createBusinessUnitMutation({
          variables: { draft },
        });

        return (data as any)?.createBusinessUnit || null;
      } catch (err) {
        const apolloError = err as ApolloError;
        setError(apolloError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [createBusinessUnitMutation]
  );

  return {
    createBusinessUnit,
    loading,
    error,
  };
};

export default useBusinessUnitManagement;
