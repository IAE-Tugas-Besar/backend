declare module "midtrans-client" {
  export interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  export interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  export interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  export interface CustomerDetails {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
  }

  export interface TransactionParameter {
    transaction_details: TransactionDetails;
    item_details?: ItemDetails[];
    customer_details?: CustomerDetails;
  }

  export interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  export class Snap {
    constructor(config: SnapConfig);
    createTransaction(
      parameter: TransactionParameter
    ): Promise<TransactionResult>;
  }

  export class CoreApi {
    constructor(config: SnapConfig);
    transaction: {
      status(orderId: string): Promise<any>;
    };
  }

  const midtransClient: {
    Snap: typeof Snap;
    CoreApi: typeof CoreApi;
  };

  export default midtransClient;
}
