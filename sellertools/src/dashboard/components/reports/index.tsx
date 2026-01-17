import React from 'react';
import Reports from './reports';

type Props = {
  onBack: () => void;
  linkToWelcome: string;
};

const ReportsWrapper: React.FC<Props> = (props) => {
  return <Reports {...props} />;
};

export default ReportsWrapper;
