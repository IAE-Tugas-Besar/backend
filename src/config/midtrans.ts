import * as midtransClient from "midtrans-client";

// Midtrans Sandbox credentials
const MIDTRANS_SERVER_KEY =
  process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SERVER_KEY";
const MIDTRANS_CLIENT_KEY =
  process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-YOUR_CLIENT_KEY";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

// Snap client for creating transactions
export const snap = new midtransClient.Snap({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

// Core API client for checking transaction status
export const coreApi = new midtransClient.CoreApi({
  isProduction: MIDTRANS_IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

export { MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY };
