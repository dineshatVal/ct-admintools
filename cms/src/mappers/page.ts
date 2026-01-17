import { ContentItem } from '../controllers/content-item.controller';
import { Page, ResolvedPage } from '../controllers/page.controller';

export const mapPageContentItems = (page: Page): ResolvedPage => {
  return {
    ...page,
    value: {
      ...page.value,
      components: page.value.components.map(
        (component) => component.obj?.value as ContentItem['value']
      ),
    },
  };
};
