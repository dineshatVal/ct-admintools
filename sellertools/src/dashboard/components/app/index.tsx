import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import { FormattedMessage } from 'react-intl';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router-dom';
import { useAuthContext } from '../../contexts/auth-context';
import { useBusinessUnitContext } from '../../contexts/business-unit-context';
import AIAssistantWrapper from '../ai-assistant/ai-assistant-wrapper';
import Configuration from '../configuration';
import ContentItems from '../content/content-items';
import ContentPages from '../content/content-pages';
import CustomerDetailsModal from '../customers/customer-details-modal';
import Customers from '../customers/customers';
import OrderDetailsModal from '../orders/order-details-modal';
import Orders from '../orders/orders';
import Prices from '../prices/prices';
import Products from '../products';
import ProductDiscountWrapper from '../promotions/product-discount-wrapper';
import Promotions from '../promotions/promotions';
import Reports from '../reports/index';
import SellerDashboard from '../seller-dashboard/seller-dashboard';
import ProductDetails from '../product/details';

const App = () => {
  const match = useRouteMatch();
  const { push, goBack } = useHistory();
  const { isLoggedIn, storeKey, isLoading } = useAuthContext();
  const { loading: businessUnitIsLoading } = useBusinessUnitContext();

  const handleNavigate = (route: string) => {
    const refinedroute = route.startsWith('/') ? route.slice(1) : route;
    const refinedMatch = match.url.endsWith('/')
      ? match.url.slice(0, -1)
      : match.url;
    push(`${refinedMatch}/${refinedroute}`);
  };

  if ((!isLoggedIn || !storeKey) && !isLoading && !businessUnitIsLoading) {
    return (
      <Spacings.Stack alignItems="center">
        <Text.Body>
          <FormattedMessage
            id="You are not logged in"
            defaultMessage="You are not logged in. Please contact your administrator."
          />
        </Text.Body>
      </Spacings.Stack>
    );
  }

  return (
    <>
      <Switch>
        <Route path={`${match.path}/orders/:orderId`} exact>
          <OrderDetailsModal onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/orders`} exact>
          <Orders onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/customers/:customerId`} exact>
          <CustomerDetailsModal onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/customers`} exact>
          <Customers onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/products`}>
          <Products onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/prices`} exact>
          <Prices onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/promotions`} exact>
          <Promotions onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/promotions/add`} exact>
          <ProductDiscountWrapper onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/promotions/:promotionId`} exact>
          <ProductDiscountWrapper
            onBack={goBack}
            linkToWelcome={match.url}
            isEditing={true}
          />
        </Route>
        <Route path={`${match.path}/content-items`} exact>
          <ContentItems onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/content-pages`} exact>
          <ContentPages onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/reports`} exact>
          <Reports onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={`${match.path}/configuration`} exact>
          <Configuration onBack={goBack} linkToWelcome={match.url} />
        </Route>
        <Route path={match.path} exact>
          <SellerDashboard onNavigate={handleNavigate} />
        </Route>
      </Switch>
      <Switch>
        <Route path={`${match.path}/products/:productId`} exact>
          <ProductDetails onBack={goBack} linkToWelcome={match.url} />
        </Route>
      </Switch>
      <AIAssistantWrapper />
    </>
  );
};

export default App;
