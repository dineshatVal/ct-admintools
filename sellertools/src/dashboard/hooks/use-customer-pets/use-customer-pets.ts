import { useCallback, useState } from 'react';
import {
  useMcQuery,
  useMcMutation,
} from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// Define interfaces for pet-related data
export interface Vaccination {
  id: string;
  key: string;
  petId: string;
  name: string;
  date: string;
  expiryDate: string;
  veterinarian: string;
  notes?: string;
  active?: boolean;
}

export interface Prescription {
  id: string;
  key: string;
  petId: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  notes?: string;
  refills?: number;
  active?: boolean;
  authorized?: boolean;
  authorizedBy?: string;
}

export interface PetInfo {
  id: string;
  key: string;
  customerId: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  weight: string;
  color: string;
  gender: string;
  microchipId?: string;
  notes?: string;
  vaccinationKeys?: string[]; // Keys for vaccinations
  prescriptionKeys?: string[]; // Keys for prescriptions
  vaccinations: Vaccination[];
  prescriptions: Prescription[];
}

// GraphQL query to fetch pet custom objects
const GET_CUSTOMER_PETS_QUERY = gql`
  query GetCustomerPets($where: String!) {
    customObjects(container: "pet", where: $where) {
      results {
        id
        container
        key
        value
      }
    }
  }
`;

// GraphQL query to fetch a single custom object by container and key
const GET_CUSTOM_OBJECT_QUERY = gql`
  query GetCustomObject($container: String!, $key: String!) {
    customObject(container: $container, key: $key) {
      id
      container
      key
      value
    }
  }
`;

interface GetCustomerPetsResponse {
  customObjects: {
    results: Array<{
      id: string;
      container: string;
      key: string;
      value: string;
    }>;
  };
}

interface GetCustomObjectResponse {
  customObject: {
    id: string;
    container: string;
    key: string;
    value: string;
  };
}

interface UseCustomerPetsOptions {
  onError?: (error: Error) => void;
}

interface UseCustomerPetsReturn {
  pets: PetInfo[];
  loading: boolean;
  error: Error | null;
  fetchPetsByCustomerId: (customerId: string) => Promise<PetInfo[]>;
}

// Helper function to map custom object to PetInfo
const mapCustomObjectToPetInfo = (customObject: any): PetInfo => {
  // Parse the value if it's a string
  const value =
    typeof customObject.value === 'string'
      ? JSON.parse(customObject.value)
      : customObject.value;

  return {
    id: customObject.id,
    key: customObject.key || '',
    customerId: value.customer?.id || '',
    name: value.name || '',
    species: value.species || '',
    breed: value.breed || '',
    birthDate: value.dateOfBirth || '',
    weight: value.weight ? `${value.weight} ${value.weightUnit || ''}` : '',
    color: value.color || '',
    gender: value.gender || '',
    microchipId: value.microchipId || '',
    notes: value.notes || '',
    vaccinationKeys: value.vaccinationKeys || [], // Added to store vaccination keys
    prescriptionKeys: value.prescriptionKeys || [], // Added to store prescription keys
    vaccinations: [],
    prescriptions: [],
  };
};

// Helper function to map custom object to Vaccination
const mapCustomObjectToVaccination = (
  customObject: any
): Vaccination | null => {
  if (!customObject) return null;

  // Parse the value if it's a string
  const value =
    typeof customObject.value === 'string'
      ? JSON.parse(customObject.value)
      : customObject.value;

  return {
    id: customObject.id,
    key: customObject.key || '',
    petId: value.pet?.id || '',
    name: value.name || value.medication || '',
    date: value.date || value.startDate || '',
    expiryDate: value.expiryDate || value.endDate || '',
    veterinarian: value.veterinarian || value.prescribedBy || '',
    notes: value.notes || '',
    active: value.active,
  };
};

// Helper function to map custom object to Prescription
const mapCustomObjectToPrescription = (
  customObject: any
): Prescription | null => {
  if (!customObject) return null;

  // Parse the value if it's a string
  const value =
    typeof customObject.value === 'string'
      ? JSON.parse(customObject.value)
      : customObject.value;

  return {
    id: customObject.id,
    key: customObject.key || '',
    petId: value.pet?.id || '',
    medication: value.medication || '',
    dosage: value.dosage || '',
    frequency: value.frequency || '',
    startDate: value.startDate || '',
    endDate: value.endDate || '',
    prescribedBy: value.prescribedBy || '',
    notes: value.notes || '',
    refills: value.refills,
    active: value.active,
    authorized: value.authorized,
    authorizedBy: value.authorizedBy || '',
  };
};

const useCustomerPets = (
  options: UseCustomerPetsOptions = {}
): UseCustomerPetsReturn => {
  const [pets, setPets] = useState<PetInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Set up GraphQL query for pets
  const { refetch: refetchPets } = useMcQuery<GetCustomerPetsResponse>(
    GET_CUSTOMER_PETS_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  // Set up GraphQL query for custom objects
  const { refetch: refetchCustomObject } = useMcQuery<GetCustomObjectResponse>(
    GET_CUSTOM_OBJECT_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  // Function to fetch a single custom object by container and key
  const getCustomObject = useCallback(
    async (container: string, key: string) => {
      try {
        console.log(
          `Fetching custom object with container: ${container}, key: ${key}`
        );
        const response = await refetchCustomObject({ container, key });
        console.log(`Response for ${container}/${key}:`, response?.data);

        return response?.data?.customObject || null;
      } catch (err) {
        console.error(`Error fetching custom object ${container}/${key}:`, err);
        return null;
      }
    },
    [refetchCustomObject]
  );

  // Function to get vaccinations for a specific pet
  const getPetVaccinations = useCallback(
    async (pet: PetInfo): Promise<Vaccination[]> => {
      try {
        // Try using the pet's ID or key directly
        const vaccinationObject = await getCustomObject('vaccination', pet.key);
        console.log(
          `Fetching vaccination with key: ${pet.key}`,
          vaccinationObject
        );

        if (vaccinationObject) {
          const vaccination = mapCustomObjectToVaccination(vaccinationObject);
          return vaccination ? [vaccination] : [];
        }

        // If that fails, try using the pet's ID
        if (pet.id !== pet.key) {
          const vaccinationByIdObject = await getCustomObject(
            'vaccination',
            pet.id
          );
          console.log(
            `Fetching vaccination with ID: ${pet.id}`,
            vaccinationByIdObject
          );

          if (vaccinationByIdObject) {
            const vaccination = mapCustomObjectToVaccination(
              vaccinationByIdObject
            );
            return vaccination ? [vaccination] : [];
          }
        }

        return [];
      } catch (err) {
        console.error('Error fetching pet vaccination:', err);
        return [];
      }
    },
    [getCustomObject]
  );

  // Function to get prescriptions for a specific pet
  const getPetPrescriptions = useCallback(
    async (pet: PetInfo): Promise<Prescription[]> => {
      try {
        // Try using the pet's ID or key directly
        const prescriptionObject = await getCustomObject(
          'prescription',
          pet.key
        );
        console.log(
          `Fetching prescription with key: ${pet.key}`,
          prescriptionObject
        );

        if (prescriptionObject) {
          const prescription =
            mapCustomObjectToPrescription(prescriptionObject);
          return prescription ? [prescription] : [];
        }

        // If that fails, try using the pet's ID
        if (pet.id !== pet.key) {
          const prescriptionByIdObject = await getCustomObject(
            'prescription',
            pet.id
          );
          console.log(
            `Fetching prescription with ID: ${pet.id}`,
            prescriptionByIdObject
          );

          if (prescriptionByIdObject) {
            const prescription = mapCustomObjectToPrescription(
              prescriptionByIdObject
            );
            return prescription ? [prescription] : [];
          }
        }

        return [];
      } catch (err) {
        console.error('Error fetching pet prescription:', err);
        return [];
      }
    },
    [getCustomObject]
  );

  // Main function to fetch pets by customer ID
  const fetchPetsByCustomerId = useCallback(
    async (customerId: string): Promise<PetInfo[]> => {
      setLoading(true);
      setError(null);

      try {
        // Construct the where clause for the query to match the customer.id format
        const where = `value(customer(id="${customerId}"))`;
        console.log('Fetching pets with where clause:', where);

        // Fetch pets
        const petsResponse = await refetchPets({ where });
        console.log('Pet response:', petsResponse?.data);

        if (!petsResponse?.data?.customObjects?.results) {
          setPets([]);
          return [];
        }

        // Map custom objects to pet info and fetch related data
        const petResults = petsResponse.data.customObjects.results;
        console.log('Found pets:', petResults.length);
        const enrichedPets: PetInfo[] = [];

        // Process each pet
        for (const petObject of petResults) {
          // Map the basic pet info
          const petInfo = mapCustomObjectToPetInfo(petObject);

          // Fetch vaccinations and prescriptions directly using the pet's identity
          const [vaccinations, prescriptions] = await Promise.all([
            getPetVaccinations(petInfo),
            getPetPrescriptions(petInfo),
          ]);

          // Combine all data
          enrichedPets.push({
            ...petInfo,
            vaccinations,
            prescriptions,
          });
        }

        console.log(
          'Enriched pets with vaccinations and prescriptions:',
          enrichedPets
        );

        // Update state
        setPets(enrichedPets);
        return enrichedPets;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Error fetching pet data');
        setError(error);
        if (options.onError) {
          options.onError(error);
        }
        console.error('Error fetching customer pets:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetchPets, getPetVaccinations, getPetPrescriptions, options.onError]
  );

  return {
    pets,
    loading,
    error,
    fetchPetsByCustomerId,
  };
};

export default useCustomerPets;
