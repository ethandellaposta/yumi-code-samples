import React from "react";

export interface ShopifyContextProps {
  actions: {
    getCheckoutLink: (cart: any, coupon?: string) => Promise<string>;
    createCart: (products) => Promise<any>;
  };
}

export const defaultVal: ShopifyContextProps = {
  actions: {
    getCheckoutLink: async () => "",
    createCart: async () => {}
  }
};

export default React.createContext<ShopifyContextProps>(defaultVal);
