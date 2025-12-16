// Override @types/midtrans-client with correct types
declare module "midtrans-client" {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  interface CustomerDetails {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
  }

  interface TransactionParameter {
    transaction_details: TransactionDetails;
    item_details?: ItemDetails[];
    customer_details?: CustomerDetails;
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  interface TransactionStatusResponse {
    transaction_status: string;
    fraud_status?: string;
    order_id: string;
    gross_amount: string;
    payment_type?: string;
    transaction_time?: string;
    transaction_id?: string;
    status_code?: string;
    status_message?: string;
    [key: string]: any;
  }

  export class Snap {
    constructor(config: MidtransConfig);
    createTransaction(
      parameter: TransactionParameter
    ): Promise<TransactionResult>;
  }

  export class CoreApi {
    constructor(config: MidtransConfig);
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
      cancel(orderId: string): Promise<any>;
      expire(orderId: string): Promise<any>;
      approve(orderId: string): Promise<any>;
      deny(orderId: string): Promise<any>;
      refund(orderId: string, params?: any): Promise<any>;
    };
  }
}
