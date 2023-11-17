/**
 * TODO: Fill this entire type out
 */
export interface OrderCreateEvent {
  id: number;
  admin_graphql_api_id: string;
  app_id: number;
  browser_ip: string;
  buyer_accepts_marketing: boolean;
  cancel_reason: 'customer' | 'declined' | 'fraud' | 'inventory' | 'other';
  cancelled_at: Date;
  cart_token: string;
  checkout_id: number;
  checkout_token: string;
  client_details: any;
  customer_id?: string;
  contact_email: string;
  created_at: Date;
  currency: string;
  current_subtotal_price: string;
  email: string;
  name: string;
  note: string;
  number: number;
  order_number: number;
  order_status_url: string;
  phone: string;
  customer: any;
  line_items: Array<any>;
}
