<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://commercetools.com/_build/images/logos/commercetools-logo-2024.svg?v4">
  </a>
</p>

# sellertools

sellertools is a powerful multi-vendor application built on the commercetools Merchant Center Apps framework, offering businesses the tools they need to streamline B2B2C, marketplace, franchise, field sales, and other multi-seller models. The platform provides third-party sellers with a dedicated dashboard featuring order management, intuitive product selection, store configuration tools, and promotional capabilities—empowering sellers to efficiently manage their complete business operations while maintaining brand consistency and operational control across your distributed selling network.

## Features

### Order Management
- Comprehensive order list, including a detailed view
  - Line item breakdown with pricing
  - Shipping and billing address information
  - Customer details for each order
- Real-time refresh of order data
- Interactive status dropdown for order state changes
- Real-time updates to the commercetools backend

### Product Management
- **Product Selection**:
  - Dual-table interface for managing product selections
  - View master catalog products and your store's current selection
  - Add products to your store with a single click
  - Remove products from your store's selection
  - Real-time updates with synchronization to commercetools
  - Selection checkboxes with clear visual feedback

- **Product Search**:
  - Powerful real-time search across both tables:
    - Master Products Search: GraphQL-based search on the commercetools API
    - Store Products Search: Client-side filtering of the store's products
  - Implementation details:
    ```graphql
    # GraphQL search query structure
    query ProductSearch($text: String, $filter: [SearchFilterInput!]) {
      productProjectionSearch(
        markMatchingVariants: true
        text: $text
        filters: $filter
        locale: "en-US"
        limit: 20
        fuzzy: true
      ) {
        results {
          id
          nameAllLocales {
            locale
            value
          }
          masterVariant {
            sku
            images {
              url
            }
          }
        }
      }
    }
    ```

- **Price Management**:
  - Channel-specific pricing for products in a seller's store
  - Clear visual indication of products with and without pricing

- **Product Creation**:
  - Form-based interface for creating new products
  - Image URL preview functionality
  - Automatic addition to the store's product selection
  - Proper implementation of commercetools' money format:
    ```graphql
    prices: [{
      value: {
        centPrecision: {
          currencyCode: "USD",
          centAmount: 1000
        }
      }
    }]
    ```

### Promotion Management
- Create and manage store-specific product discounts
- Support for percentage and fixed amount discount types
- Apply discounts to all products or specific products with conditions:
  - Filter by SKUs or categories
- Combine multiple conditions with AND logic
- Channel-specific filtering for seller's products
- Status management with toggle controls for activation/deactivation
- Editing capabilities with pre-populated forms and field comparison
- Bulk actions (activate, deactivate, delete)

### Customer Management
- View customers associated with the seller's store
- Detailed customer profile information with intuitive card-based interface
- Address information displayed in user-friendly cards
- Recently placed orders displayed within the customer profile
- Custom fields display for extended customer information
- Streamlined account details for better focus on key information

### Store Configuration
- Complete store configuration management interface
- Update store information
- Custom fields support for extensible data storage

## Setup & Configuration

### Seller Setup

This application requires a specific configuration for stores, channels, and product selections:

1. **Store Creation**:
   - Create a store in commercetools with a unique key (e.g., `seller-store-1`)
   - The store key is used as the identifier for all seller-related operations

2. **Channel Alignment**:
   - Create a distribution channel with the same key as the store
   - Associate this channel with the store
   - Ensure the channel has roles of "InventorySupply" and "ProductDistribution"
   - This alignment is essential for proper pricing and product distribution

3. **Product Selection Setup**:
   - Create a product selection with the same key as the store
   - This alignment of keys (store, channel, product selection) is essential

4. **Product Variant Configuration**:
   - The application manages pricing exclusively through the master variant
   - All channel-specific prices are attached to the master variant
   - This approach simplifies price management while allowing seller-specific pricing

### Seller Association

Sellers (customers who manage stores) are not directly assigned to stores in this implementation. Instead:

1. **Custom Type Requirements**:
   - Create a custom type for customers named `seller-store-association`
   - Add a field named `store-key` of type String to this custom type
   - Label: "Store Key", Required: No

2. **Customer Configuration**:
   - Apply the custom type to seller customer records
   - Set the `store-key` field to match the store key they should manage

3. **Authentication Flow**:
   - When a seller logs in, the application reads this custom field
   - If valid, the seller is granted access to manage that store

### Business Unit Integration

The application employs a sophisticated business unit selection mechanism:

#### Customer-Based Business Unit Discovery
- Business units are fetched based on the customer ID of the logged-in user
- Uses GraphQL query with `associates(customer(id="..."))` filter
- No hardcoded business unit IDs required in the codebase

#### Multiple Business Units Support
- Automatically handles scenarios where a customer is associated with multiple business units
- Dropdown selector for choosing between business units
- Preserves selection between sessions for consistent user experience
- Automatically selects the first business unit by default

#### Store Context Handling
- Each business unit is associated with specific stores in the commercetools platform
- When a business unit is selected, the system fetches its associated stores
- The first store is automatically set as the active store in the auth context
- This active store context is used by all other components for queries and mutations

#### Technical Implementation
- React context-based architecture:
  - `business-unit-context.tsx` manages business unit state
  - `auth-context.tsx` handles store selection and propagation
- Custom hook (`useCustomerBusinessUnits`) that manages the business unit lifecycle
- GraphQL integration for real-time data fetching
- Performance optimizations:
  - Memoized business unit options
  - State update batching to prevent unnecessary renders
  - Store information caching to reduce API calls

### Business Unit as Seller Data Container

The business unit structure serves as the container for seller-specific information, enabling robust extensibility:

- Payment gateway credentials (e.g., Stripe account IDs)
- Shipping provider account information 
- Commission rates and payment terms
- Seller contact and support details

**Custom Type Framework**:
- Business units are extended with a `seller-store-configuration` custom type
- This type can be expanded with any field needed for seller operations
- Provides structured data storage with appropriate typing

**Data Access Pattern**:
- The `useCustomerBusinessUnits` hook provides a centralized access point
- Handles authentication, authorization, and data validation
- Maintains proper state management throughout the application

#### Adding New Seller Capabilities

To extend business units with new seller functionality:

1. Add necessary custom fields to the `seller-store-configuration` type
2. Update the configuration form to capture the new data
3. Integrate the new fields with relevant application features

This extensible approach enables the platform to rapidly adapt to different business models and seller requirements without requiring core application changes.

## Getting Started

### Prerequisites
- commercetools project with appropriate API scopes
- Node.js (v14+) and npm

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Build for production
npm run build
```

### Required API Scopes

Ensure you have the following scopes configured in your custom-application-config.mjs:
- `view_products`, `manage_products`
- `view_orders`, `manage_orders`
- `view_customers`
- `view_stores`, `manage_stores`
- `view_product_selections`, `manage_product_selections`
- `view_published_products`
- `view_product_discounts`, `manage_product_discounts`
- `view_business_units`, `manage_business_units`

## UI & Implementation Patterns

The application implements consistent design and implementation patterns across all features:

### Enhanced User Experience
- **Search Experience**:
  - Persistent tables during search with loading indicators
  - Debounced search to prevent excessive API calls
  - Width-constrained search fields (600px maximum) for better visual balance

- **Table Rendering**:
  - Optimized column width distribution
  - Enhanced cell styling with proper overflow handling
  - Fixed image dimensions for consistent presentation
  - Responsive horizontal scrolling for small screen support

- **CSS Refinements**:
  - Table container improvements for proper width distribution
  - Box-sizing rules for consistent column rendering
  - Text overflow handling for long content in cells
  - Mobile-responsive adjustments for smaller screens

### Component Patterns
- **Header Components**:
  - Left section: Title and navigation elements
  - Right section: Action buttons and controls
  - Consistent context information display

- **Form Patterns**:
  - Card-based sectional layout
  - Consistent field spacing and validation
  - Standard button placement (Cancel on left, Submit on right)

- **Modal Patterns**:
  - Standardized header with title and close button
  - Properly padded content areas with appropriate scrolling
  - Size appropriate to content (small, medium, large)

### Error Handling
- **API Error Handling**:
  - GraphQL error extraction and formatting
  - Network error detection with appropriate messaging
  - Detailed error logging in development

- **Form Validation**:
  - Field-level validation with immediate feedback
  - Form-level validation before submission
  - Clear, actionable error messages

- **Optimistic UI Updates**:
  - Temporary state updates before API confirmation
  - Rollback on error with appropriate notifications
  - Loading indicators during async operations

### Performance Optimizations
- **Logging Control**:
  - Environment-aware logging (development vs. production)
  - Different log levels (log, info, warn, error, debug, performance)
  - Suppressed informational logs in production

## Development Resources
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)



# admintools

This application provides a streamlined way to manage sellertools. In its current state, Business Users can easily onboard new Sellers.

## 🚀 Seller Onboarding Flow

When you fill out the onboarding form and submit it, here's exactly what happens behind the scenes:

### Step 1: 👤 Create Seller Account
- **What it does**: Creates a new Seller account with the provided information
- **Details**: Sets up the Seller and assigns them to the appropriate customer group
- **Why it matters**: This is the foundation - every business needs a verified Seller account to access the sellertools platform

### Step 2: 📺 Create Distribution & Supply Channel
- **What it does**: Sets up a channel for both inventory management and product distribution
- **Details**: Creates a single channel with dual roles: "InventorySupply" and "ProductDistribution"
- **Why it matters**: This channel configuration allows Sellers to track their own inventory and create their own prices

### Step 3: 🏪 Create Store
- **What it does**: Creates a dedicated store for the Seller
- **Details**: 
  - Enables segmentation of data per Seller. Each seller will only have access to their Orders, Customers, Product Selection, etc.
  - Previously created channel is assigned to Store
- **Why it matters**: Each business gets their own store with control over their Orders, Customers, Product Selection, and more!

### Step 4: 📦 Create & Assign Product Selection
- **What it does**: Creates a product catalog selection and properly assigns it to the store
- **Details**: 
  - Creates an "Inclusive" Product Selection for the Seller
  - Ensures the product selection is active and linked to the correct Store
- **Why it matters**: Product selections control which products can be sold by each Seller

### Step 5: 🏢 Create Business Unit
- **What it does**: Creates the main business entity that ties everything together
- **Details**: 
  - Links the Seller as an admin associate with proper role assignments
  - Assigns the store to the business unit for management
  - Sets up proper permissions and business relationships
  - Includes address information if phone number is provided
- **Why it matters**: Business units are the central hub that manages all business operations

### Step 6: 📨 Send Merchant Center Invitation
- **What it does**: Invites the seller to access the Merchant Center platform
- **Details**: 
  - Retrieves organization and team information from the current project
  - Validates the seller's email for invitation eligibility
  - Sends an invitation to join the configured team (from `MC_TEAM_NAME` environment variable)
- **Why it matters**: Gives sellers access to the Merchant Center interface to manage their business operations
- **Error Handling**: If invitation fails, the onboarding continues but shows a warning notification

## 🔗 How Everything Connects

Here's how all the pieces work together:

```
👤 Seller Account (Verified)
    ↓ (is admin associate of)
🏢 Business Unit
    ↓ (manages)
🏪 Business Store
    ↓ (uses for distribution & supply)
📺 Unified Channel
    ↓ (controls inventory & distribution)
📦 Product Access & Inventory Management
    ↑ (filtered by)
📦 Product Selection (Assigned)
    ↓ (invited to access)
📨 Merchant Center Platform
```

## 📊 What Gets Created

For a seller named "Johnny Ortiz" from "Business X", the system creates:

- **Seller**: `johnny.ortiz@business-x.com` with verified email and customer group assignment
- **Business Unit**: "Business X" (key: `business-x`) with associate and store relationships
- **Store**: "Business X Store" (key: `business-x-store`) with both distribution and supply channels
- **Channel**: "Business X Channel" (key: `business-x-channel`) with dual roles [InventorySupply, ProductDistribution]
- **Product Selection**: "Business X Selection" (key: `business-x-selection`) properly assigned to store
- **Merchant Center Invitation**: Email invitation sent to `johnny.ortiz@business-x.com` to join the configured team

## 🎯 Benefits for Your Business

- **Automated Setup**: Complete end-to-end automation with no manual configuration
- **Consistent Structure**: Every seller gets the same professional, complete setup
- **Full Channel Control**: Both inventory supply and product distribution in one channel
- **Proper Product Assignment**: Product selections are correctly linked to stores
- **Scalable Architecture**: Handle hundreds of business sellers with ease
- **Clean Monitoring**: Streamlined console logging for easy tracking and debugging

## 🛠️ Technical Implementation

### Console Logging Flow
The system provides clean, emoji-enhanced logging:

```
🚀 Starting seller onboarding process...
📝 Onboarding: Business X (Johnny Ortiz)
👤 Step 1: Creating seller account...
✅ Seller account created and verified
📺 Step 2: Creating channel...
✅ Channel created with both supply and distribution roles
🏪 Step 3: Creating store...
✅ Store created with distribution and supply channels
📦 Step 4: Creating product selection...
✅ Product selection created and assigned to store
🏢 Step 5: Creating business unit...
✅ Business unit created with store assignment
📨 Step 6: Creating Merchant Center invitation...
✅ Merchant Center invitation sent successfully
🎉 === ONBOARD SELLER COMPLETE ===
📊 Summary:
👤 Seller: Johnny Ortiz (johnny.ortiz@business-x.com)
🏢 Business Unit: Business X (business-x)
📺 Channel: business-x-channel [InventorySupply, ProductDistribution]
🏪 Store: business-x-store (Distribution + Supply)
📦 Product Selection: business-x-selection
📨 Merchant Center Invitation: Sent ✅
🔗 All resources created and linked successfully!
```

### Key Technical Features
- **GraphQL Mutations**: For creating and updating resources in commercetools
- **Proper Resource Linking**: Uses correct actions like `setProductSelections` for store assignments
- **Dual Channel Roles**: Single channel handles both supply and distribution
- **React Hooks**: For state management and API calls
- **Form Validation**: Ensures data quality before submission
- **Error Handling**: Graceful handling with user-friendly notifications
- **Comprehensive Logging**: Clean, informative console output for debugging
- **Merchant Center Integration**: Automated invitation system using Merchant Center Backend API
- **Environment Configuration**: Requires `MC_TEAM_NAME` environment variable for team assignment
