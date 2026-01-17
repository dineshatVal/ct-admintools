import { ApolloError } from '@apollo/client';
import {
  useMcLazyQuery,
  useMcQuery,
} from '@commercetools-frontend/application-shell-connectors';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import { TCustomer } from '../../../types/generated/ctp';

type TCustomerSearchResult = {
  results?: (TCustomer & {
    customerGroupAssignments: { customerGroup: { key: string } }[];
  })[];
  total: number;
};

type TMCUser = {
  id: string;
  email: string;
  createdAt: string;
  firstName: string;
  lastName: string;
};

interface UseCustomerAuthResult {
  mcLoggedInUser?: {
    user: TMCUser;
  };
  mcLoggedInUserLoading: boolean;
  mcLoggedInUserError?: ApolloError;
  findCustomerByEmailLoading: boolean;
  findCustomerByEmail: ({
    variables,
  }: {
    variables: any;
  }) => Promise<{ data?: { customers?: TCustomerSearchResult } }>;
}

// Regular customer sign-in mutation
const FIND_CUSTOMER_BY_EMAIL = gql`
  query FindCustomerByEmail($where: String!) {
    customers(where: $where) {
      results {
        id
        email
        firstName
        lastName
        isEmailVerified
        customerGroupAssignments {
          customerGroup {
            key
          }
        }
        customerGroup {
          key
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

// MC User query
const FETCHED_LOGGED_IN_USER = gql`
  query FetchLoggedInUser {
    user: me {
      id
      email
      createdAt
      gravatarHash
      firstName
      lastName
    }
  }
`;

const useCustomerAuth = (): UseCustomerAuthResult => {
  // Regular customer sign-in mutation
  const [findCustomerByEmail, { loading: findCustomerByEmailLoading }] =
    useMcLazyQuery<{ customers: TCustomerSearchResult }>(
      FIND_CUSTOMER_BY_EMAIL,
      {
        context: {
          target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
        },
      }
    );

  // MC User query
  const {
    data: mcLoggedInUser,
    loading: mcLoggedInUserLoading,
    error: mcLoggedInUserError,
  } = useMcQuery<{ user: TMCUser }>(FETCHED_LOGGED_IN_USER, {
    context: {
      target: GRAPHQL_TARGETS.MERCHANT_CENTER_BACKEND,
    },
  });

  return {
    mcLoggedInUser,
    mcLoggedInUserLoading,
    mcLoggedInUserError,
    findCustomerByEmailLoading,
    findCustomerByEmail,
  };
};

export default useCustomerAuth;
