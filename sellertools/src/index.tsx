import { createRoot } from 'react-dom/client';
/// <reference types="@commercetools-frontend/application-config/client" />

import EntryPoint from './entry-point';

const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(<EntryPoint />);
