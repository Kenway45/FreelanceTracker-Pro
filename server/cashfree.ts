import { Request, Response } from "express";

/* Cashfree Controllers Setup */

const { CASHFREE_APP_ID, CASHFREE_SECRET_KEY } = process.env;

if (!CASHFREE_APP_ID) {
  throw new Error("Missing CASHFREE_APP_ID");
}
if (!CASHFREE_SECRET_KEY) {
  throw new Error("Missing CASHFREE_SECRET_KEY");
}

const CASHFREE_BASE_URL = process.env.NODE_ENV === "production" 
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

/* Token generation helpers */

export async function getCashfreeAccessToken() {
  const response = await fetch(`${CASHFREE_BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      "x-client-id": CASHFREE_APP_ID,
      "x-client-secret": CASHFREE_SECRET_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Cashfree access token");
  }

  const data = await response.json();
  return data.access_token;
}

/* Process transactions */

export async function createCashfreeOrder(req: Request, res: Response) {
  try {
    const { amount, currency = "INR", customerId, customerEmail, customerPhone } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!customerId || !customerEmail) {
      return res
        .status(400)
        .json({ error: "Customer ID and email are required." });
    }

    const accessToken = await getCashfreeAccessToken();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const orderData = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: currency,
      customer_details: {
        customer_id: customerId,
        customer_email: customerEmail,
        customer_phone: customerPhone || "",
      },
      order_meta: {
        return_url: `${req.protocol}://${req.get('host')}/payment/success`,
        notify_url: `${req.protocol}://${req.get('host')}/api/cashfree/webhook`,
      },
    };

    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cashfree API error: ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Failed to create Cashfree order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
}

export async function getCashfreeOrderStatus(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const accessToken = await getCashfreeAccessToken();

    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "x-api-version": "2023-08-01",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cashfree API error: ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Failed to get Cashfree order status:", error);
    res.status(500).json({ error: "Failed to get order status." });
  }
}

export async function handleCashfreeWebhook(req: Request, res: Response) {
  try {
    const webhookData = req.body;
    
    console.log("Cashfree webhook received:", webhookData);
    
    // Verify webhook signature (implement based on Cashfree documentation)
    // This is a basic implementation - you should verify the webhook signature
    
    const { order_id, order_status, payment_id } = webhookData;
    
    if (order_status === "PAID") {
      // Handle successful payment
      console.log(`Payment successful for order ${order_id}, payment ID: ${payment_id}`);
      
      // Update your database, send confirmation emails, etc.
      // You can add your business logic here
    } else if (order_status === "FAILED") {
      // Handle failed payment
      console.log(`Payment failed for order ${order_id}`);
    }
    
    // Respond with success to acknowledge receipt
    res.status(200).json({ status: "OK" });
  } catch (error) {
    console.error("Failed to process Cashfree webhook:", error);
    res.status(500).json({ error: "Failed to process webhook." });
  }
}

export async function initiateCashfreePayment(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const accessToken = await getCashfreeAccessToken();

    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}/pay`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cashfree API error: ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Failed to initiate Cashfree payment:", error);
    res.status(500).json({ error: "Failed to initiate payment." });
  }
}