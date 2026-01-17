import { tool } from 'ai';
import { z } from 'zod';

const navigatetoPageTool = tool({
  description:
    `Navigate to a specific page. pages are: Orders, Customers, Products, Settings, Prices, Promotions, CMS and Reports.`,
  parameters: z.object({
    page: z.enum(['Orders', 'Customers', 'Products', 'Settings', 'Prices', 'Promotions', 'CMS', 'Reports']).describe('The page to navigate to'),
  }),
});

export const injectNavigationTools = (tools: Record<string, any>) => {
  return {
    ...tools,
    navigateToPage: navigatetoPageTool,
  };
};
