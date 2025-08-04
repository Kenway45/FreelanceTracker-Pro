import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CashfreeButtonProps {
  amount: string;
  currency: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  onSuccess: (orderId: string, paymentId: string) => void;
  onError: (error: string) => void;
}

export default function CashfreeButton({
  amount,
  currency,
  customerId,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
}: CashfreeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      onError("Please enter a valid amount");
      return;
    }

    if (!customerEmail || !customerPhone) {
      onError("Customer email and phone are required");
      return;
    }

    setIsProcessing(true);

    try {
      // Create order with Cashfree
      const orderResponse = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          customerId,
          customerEmail,
          customerPhone,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const orderData = await orderResponse.json();
      
      toast({
        title: "Order Created",
        description: `Order ${orderData.orderId} created successfully`,
      });

      // Redirect to Cashfree checkout
      if (orderData.paymentLink) {
        window.open(orderData.paymentLink, '_blank');
        
        // For demo purposes, simulate payment completion after a delay
        setTimeout(() => {
          onSuccess(orderData.orderId, `payment_${Date.now()}`);
          setIsProcessing(false);
        }, 3000);
      } else {
        throw new Error("No payment link received");
      }

    } catch (error) {
      console.error("Payment error:", error);
      onError(error instanceof Error ? error.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing || !amount || parseFloat(amount) <= 0}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
      size="lg"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing Payment...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ₹{amount} with Cashfree
        </>
      )}
    </Button>
  );
}