import { useState, useCallback } from 'react';
import {
  useMcMutation,
  useMcQuery,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// GraphQL Mutations and Queries
const CREATE_CUSTOMER = gql`
  mutation CustomerSignUp($draft: CustomerSignUpDraft!) {
    customerSignUp(draft: $draft) {
      customer {
        id
        version
        email
        firstName
        lastName
        companyName
        isEmailVerified
        customerNumber
        createdAt
        customerGroup {
          id
          key
          name
        }
      }
    }
  }
`;

const CREATE_EMAIL_VERIFICATION_TOKEN = gql`
  mutation CreateEmailVerificationToken($id: String!, $ttlMinutes: Int!) {
    customerCreateEmailVerificationToken(id: $id, ttlMinutes: $ttlMinutes) {
      id
      customerId
      value
      expiresAt
      createdAt
    }
  }
`;

const CONFIRM_EMAIL = gql`
  mutation ConfirmEmail($tokenValue: String!) {
    customerConfirmEmail(tokenValue: $tokenValue) {
      id
      version
      email
      isEmailVerified
    }
  }
`;

const FIND_CUSTOMER_BY_EMAIL = gql`
  query FindCustomerByEmail($where: String!) {
    customers(where: $where) {
      results {
        id
        email
        firstName
        lastName
        isEmailVerified
        customerNumber
      }
      total
    }
  }
`;

// Types
export interface CustomerDraft {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  customerNumber?: string;
  authenticationMode?: 'ExternalAuth';
  customerGroup?: {
    typeId: 'customer-group';
    key: string;
  };
}

export interface Customer {
  id: string;
  version: number;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  isEmailVerified: boolean;
  customerNumber?: string;
  customerGroup?: {
    id: string;
    key: string;
    name: string;
  };
  createdAt: string;
}

export interface CustomerSearchResult {
  results: Customer[];
  total: number;
}

export interface UseCustomerManagementResult {
  // State
  loading: boolean;
  error: string | null;

  // Actions
  createCustomer: (draft: CustomerDraft) => Promise<Customer | null>;
  createEmailVerificationToken: (
    customerId: string,
    ttlMinutes?: number
  ) => Promise<string | null>;
  confirmEmail: (tokenValue: string) => Promise<Customer | null>;
  findCustomerByEmail: (email: string) => Promise<CustomerSearchResult | null>;
  clearError: () => void;
}

export const useCustomerManagement = (): UseCustomerManagementResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutations using commercetools hooks
  const [createCustomerMutation] = useMcMutation(CREATE_CUSTOMER, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const [createEmailVerificationTokenMutation] = useMcMutation(
    CREATE_EMAIL_VERIFICATION_TOKEN,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const [confirmEmailMutation] = useMcMutation(CONFIRM_EMAIL, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  // Queries
  const { refetch: findCustomerQuery } = useMcQuery(FIND_CUSTOMER_BY_EMAIL, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  // Create customer function
  const createCustomer = async (draft: CustomerDraft) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await createCustomerMutation({
        variables: { draft },
      });

      return (data as any)?.customerSignUp?.customer || null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create email verification token function
  const createEmailVerificationToken = async (
    customerId: string,
    ttlMinutes: number = 10
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await createEmailVerificationTokenMutation({
        variables: { id: customerId, ttlMinutes },
      });

      return (data as any)?.customerCreateEmailVerificationToken?.value || null;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to create email verification token';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirm email function
  const confirmEmail = async (tokenValue: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await confirmEmailMutation({
        variables: { tokenValue },
      });

      return (data as any)?.customerConfirmEmail || null;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to confirm email';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Find customer by email function
  const findCustomerByEmail = useCallback(
    async (email: string): Promise<CustomerSearchResult | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await findCustomerQuery({
          where: `email="${email}"`,
        });

        return (data as any)?.customers || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get customer';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [findCustomerQuery]
  );

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createCustomer,
    createEmailVerificationToken,
    confirmEmail,
    findCustomerByEmail,
    clearError,
  };
};

export default useCustomerManagement;
