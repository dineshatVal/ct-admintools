import React, { useState } from 'react';
import Card from '@commercetools-uikit/card';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import {
  AngleDownIcon,
  AngleUpIcon,
  InfoIcon,
} from '@commercetools-uikit/icons';
import type { PetInfo } from '../../hooks/use-customer-pets';
import styles from './customers.module.css';

interface PetCardProps {
  pet: PetInfo;
}

// Custom collapsible component since '@commercetools-uikit/collapsible-panel' might not be available
const CollapsibleSection: React.FC<{
  header: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onChange: () => void;
}> = ({ header, children, isOpen, onChange }) => {
  return (
    <div className={styles.collapsibleSection}>
      <div className={styles.collapsibleHeader} onClick={onChange}>
        {header}
        {isOpen ? (
          <AngleUpIcon size="medium" />
        ) : (
          <AngleDownIcon size="medium" />
        )}
      </div>
      {isOpen && <div className={styles.collapsibleContent}>{children}</div>}
    </div>
  );
};

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const [isVaccinationsOpen, setIsVaccinationsOpen] = useState(false);
  const [isPrescriptionsOpen, setIsPrescriptionsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className={styles.petCardExpanded}>
      {/* Pet Header Section */}
      <div className={styles.petCardHeader}>
        <Spacings.Inline alignItems="center">
          <Text.Headline as="h3">{pet.name}</Text.Headline>
          {pet.gender && (
            <span
              className={`${styles.genderBadge} ${
                pet.gender === 'male' ? styles.male : styles.female
              }`}
            >
              {pet.gender}
            </span>
          )}
          <div className={styles.petIdentifier}>
            <Text.Detail>
              {pet.species} • {pet.breed}
            </Text.Detail>
          </div>
        </Spacings.Inline>
        <div className={styles.petKey}>
          <Text.Detail tone="secondary">ID: {pet.key}</Text.Detail>
        </div>
      </div>

      {/* Main Content Section */}
      <div className={styles.petCardContent}>
        {/* Pet Details Grid */}
        <div className={styles.petDetailsSection}>
          <CollapsibleSection
            header={
              <Spacings.Inline
                alignItems="center"
                justifyContent="space-between"
                scale="s"
              >
                <Text.Subheadline as="h4" isBold>
                  Pet Details
                </Text.Subheadline>
              </Spacings.Inline>
            }
            isOpen={isDetailsOpen}
            onChange={() => setIsDetailsOpen(!isDetailsOpen)}
          >
            <div className={styles.petDetailsGrid}>
              <div className={styles.petDetailItem}>
                <Text.Detail tone="secondary">Species</Text.Detail>
                <Text.Body>{pet.species || 'N/A'}</Text.Body>
              </div>
              <div className={styles.petDetailItem}>
                <Text.Detail tone="secondary">Breed</Text.Detail>
                <Text.Body>{pet.breed || 'N/A'}</Text.Body>
              </div>
              <div className={styles.petDetailItem}>
                <Text.Detail tone="secondary">Gender</Text.Detail>
                <Text.Body>{pet.gender || 'N/A'}</Text.Body>
              </div>
              <div className={styles.petDetailItem}>
                <Text.Detail tone="secondary">Color</Text.Detail>
                <Text.Body>{pet.color || 'N/A'}</Text.Body>
              </div>
              <div className={styles.petDetailItem}>
                <Text.Detail tone="secondary">Weight</Text.Detail>
                <Text.Body>{pet.weight || 'N/A'}</Text.Body>
              </div>
              <div className={styles.petDetailItem}>
                <Text.Detail tone="secondary">Birth Date</Text.Detail>
                <Text.Body>{formatDate(pet.birthDate)}</Text.Body>
              </div>
              {pet.microchipId && (
                <div className={styles.petDetailItem}>
                  <Text.Detail tone="secondary">Microchip ID</Text.Detail>
                  <Text.Body>{pet.microchipId}</Text.Body>
                </div>
              )}
            </div>

            {pet.notes && (
              <div className={styles.petNotes}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <InfoIcon size="small" color="neutral60" />
                  <Text.Detail isBold>Notes</Text.Detail>
                </Spacings.Inline>
                <Text.Body>{pet.notes}</Text.Body>
              </div>
            )}
          </CollapsibleSection>
        </div>

        {/* Medical Records Section */}
        <div className={styles.petMedicalSection}>
          {/* Vaccinations Panel */}
          <CollapsibleSection
            header={
              <Spacings.Inline
                alignItems="center"
                justifyContent="space-between"
                scale="s"
              >
                <Text.Subheadline as="h4" isBold>
                  Vaccinations ({pet.vaccinations.length})
                </Text.Subheadline>
              </Spacings.Inline>
            }
            isOpen={isVaccinationsOpen}
            onChange={() => setIsVaccinationsOpen(!isVaccinationsOpen)}
          >
            {pet.vaccinations.length === 0 ? (
              <Text.Body>No vaccinations recorded</Text.Body>
            ) : (
              <div className={styles.vaccinationsGrid}>
                {pet.vaccinations.map((vaccination) => (
                  <Card
                    key={`vaccination-${vaccination.id}`}
                    className={styles.medicalCard}
                  >
                    <Spacings.Stack scale="xs">
                      <div className={styles.medicalCardHeader}>
                        <Text.Subheadline as="h5">
                          {vaccination.name}
                        </Text.Subheadline>
                        {vaccination.active !== undefined && (
                          <span
                            className={`${styles.statusBadge} ${
                              vaccination.active
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {vaccination.active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>

                      {(vaccination.date || vaccination.expiryDate) && (
                        <Spacings.Inline
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          {vaccination.date && (
                            <Text.Detail tone="secondary">
                              Date: {formatDate(vaccination.date)}
                            </Text.Detail>
                          )}
                          {vaccination.expiryDate && (
                            <Text.Detail tone="secondary">
                              Expires: {formatDate(vaccination.expiryDate)}
                            </Text.Detail>
                          )}
                        </Spacings.Inline>
                      )}

                      {vaccination.veterinarian && (
                        <Spacings.Inline alignItems="center">
                          <Text.Detail isBold>Administered by:</Text.Detail>
                          <Text.Detail>{vaccination.veterinarian}</Text.Detail>
                        </Spacings.Inline>
                      )}

                      {vaccination.notes && (
                        <div className={styles.medicalNotes}>
                          <Text.Detail>{vaccination.notes}</Text.Detail>
                        </div>
                      )}
                    </Spacings.Stack>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Prescriptions Panel */}
          <CollapsibleSection
            header={
              <Spacings.Inline
                alignItems="center"
                justifyContent="space-between"
                scale="s"
              >
                <Text.Subheadline as="h4" isBold>
                  Prescriptions ({pet.prescriptions.length})
                </Text.Subheadline>
              </Spacings.Inline>
            }
            isOpen={isPrescriptionsOpen}
            onChange={() => setIsPrescriptionsOpen(!isPrescriptionsOpen)}
          >
            {pet.prescriptions.length === 0 ? (
              <Text.Body>No prescriptions recorded</Text.Body>
            ) : (
              <div className={styles.prescriptionsGrid}>
                {pet.prescriptions.map((prescription) => (
                  <Card
                    key={`prescription-${prescription.id}`}
                    className={styles.medicalCard}
                  >
                    <Spacings.Stack scale="xs">
                      <div className={styles.medicalCardHeader}>
                        <Text.Subheadline as="h5">
                          {prescription.medication}
                        </Text.Subheadline>
                        {prescription.active !== undefined && (
                          <span
                            className={`${styles.statusBadge} ${
                              prescription.active
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            {prescription.active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>

                      <Spacings.Inline alignItems="center">
                        <Text.Detail isBold>Dosage:</Text.Detail>
                        <Text.Detail>{prescription.dosage}</Text.Detail>
                      </Spacings.Inline>

                      {prescription.frequency && (
                        <Spacings.Inline alignItems="center">
                          <Text.Detail isBold>Frequency:</Text.Detail>
                          <Text.Detail>{prescription.frequency}</Text.Detail>
                        </Spacings.Inline>
                      )}

                      {(prescription.startDate || prescription.endDate) && (
                        <Spacings.Inline
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          {prescription.startDate && (
                            <Text.Detail tone="secondary">
                              Start: {formatDate(prescription.startDate)}
                            </Text.Detail>
                          )}
                          {prescription.endDate && (
                            <Text.Detail tone="secondary">
                              End: {formatDate(prescription.endDate)}
                            </Text.Detail>
                          )}
                        </Spacings.Inline>
                      )}

                      {prescription.prescribedBy && (
                        <Spacings.Inline alignItems="center">
                          <Text.Detail isBold>Prescribed by:</Text.Detail>
                          <Text.Detail>{prescription.prescribedBy}</Text.Detail>
                        </Spacings.Inline>
                      )}

                      {prescription.refills !== undefined && (
                        <Spacings.Inline alignItems="center">
                          <Text.Detail isBold>Refills:</Text.Detail>
                          <Text.Detail>{prescription.refills}</Text.Detail>
                        </Spacings.Inline>
                      )}

                      {prescription.authorized !== undefined && (
                        <div className={styles.authorizationInfo}>
                          <Text.Detail tone="secondary">
                            {prescription.authorized
                              ? 'Authorized'
                              : 'Not Authorized'}
                            {prescription.authorized &&
                              prescription.authorizedBy &&
                              ` by ${prescription.authorizedBy}`}
                          </Text.Detail>
                        </div>
                      )}

                      {prescription.notes && (
                        <div className={styles.medicalNotes}>
                          <Text.Detail>{prescription.notes}</Text.Detail>
                        </div>
                      )}
                    </Spacings.Stack>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      </div>
    </Card>
  );
};

export default PetCard;
