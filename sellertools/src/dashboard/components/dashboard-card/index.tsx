import React, { useEffect, useState } from 'react';
import Card from '@commercetools-uikit/card';
import Spacings from '@commercetools-uikit/spacings';
import styled from 'styled-components';
import Text from '@commercetools-uikit/text';

type DashboardCardProps = {
  title: string;
  icon: React.ReactElement;
  onClick: () => void;
  checkVisibility?: () => Promise<boolean>;
};

const StyledCard = styled(Card)`
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px solid transparent;
  overflow: hidden;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    border-color: var(--color-accent-40);
  }
`;

const StyledIconContainer = styled.div`
  padding: var(--spacing-m);
  background-color: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-m);
  width: 88px;
  height: 88px;
  flex-shrink: 0;
`;

const StyledIconWrapper = styled.div`
  transform: scale(1.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  onClick,
  checkVisibility,
}) => {
  const [isVisible, setIsVisible] = useState(checkVisibility ? false : true);

  useEffect(() => {
    if (checkVisibility) {
      checkVisibility().then((visible) => {
        setIsVisible(visible);
      });
    }
  }, [checkVisibility]);

  if (!isVisible) {
    return null;
  }

  return (
    <StyledCard onClick={onClick}>
      <Spacings.Stack alignItems="center" scale="m">
        <StyledIconContainer>
          <StyledIconWrapper>{icon}</StyledIconWrapper>
        </StyledIconContainer>
        <Text.Headline as="h3">{title}</Text.Headline>
      </Spacings.Stack>
    </StyledCard>
  );
};
