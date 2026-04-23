/**
 * Standard E-commerce and Analytics events for GTM/GA4/Yandex
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const pushEvent = (event: string, data: any = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackViewItem = (product: any, variant?: any) => {
  pushEvent('view_item', {
    ecommerce: {
      currency: 'BYN',
      value: variant?.price || product.price,
      items: [{
        item_id: variant?.sku || product.id.toString(),
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.scentFamilies?.[0] || 'Perfume',
        item_variant: variant?.size || 'Standard',
        price: variant?.price || product.price,
        quantity: 1
      }]
    }
  });
};

export const trackAddToCart = (product: any, variant: any, quantity: number = 1) => {
  pushEvent('add_to_cart', {
    ecommerce: {
      currency: 'BYN',
      value: variant.price * quantity,
      items: [{
        item_id: variant.sku || `v${variant.id}`,
        item_name: product.name,
        item_brand: product.brand,
        item_category: product.scentFamilies?.[0] || 'Perfume',
        item_variant: variant.size,
        price: variant.price,
        quantity
      }]
    }
  });
};

export const trackBeginCheckout = (items: any[], total: number) => {
  pushEvent('begin_checkout', {
    ecommerce: {
      currency: 'BYN',
      value: total,
      items: items.map(item => ({
        item_id: item.sku || `v${item.variantId}` || item.id.toString(),
        item_name: item.name,
        item_brand: item.brand,
        item_variant: item.size,
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackPurchase = (orderId: string, items: any[], total: number) => {
  pushEvent('purchase', {
    ecommerce: {
      transaction_id: orderId,
      currency: 'BYN',
      value: total,
      items: items.map(item => ({
        item_id: item.sku || `v${item.variantId}` || item.id.toString(),
        item_name: item.name,
        item_brand: item.brand,
        item_variant: item.size,
        price: item.price,
        quantity: item.quantity
      }))
    }
  });
};

export const trackGoal = (goalName: string, label?: string) => {
  pushEvent('goal_reach', {
    goal_name: goalName,
    goal_label: label
  });
};
