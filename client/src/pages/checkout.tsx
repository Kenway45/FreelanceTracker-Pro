import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import CashfreeButton from "@/components/CashfreeButton";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function Checkout() {
  const [amount, setAmount] = useState("100");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [customerPhone, setCustomerPhone] = useState("+918888888888");
  const { toast } = useToast();

  const handlePaymentSuccess = (orderId: string, paymentId: string) => {
    toast({
      title: "Payment Successful!",
      description: `Order ${orderId} completed successfully. Payment ID: ${paymentId}`,
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Payment Checkout</h1>
          <p className="text-slate-600 mt-2">Test Cashfree payment integration</p>
        </div>

        <div className="grid gap-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (INR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="0.01"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Customer Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Customer Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+918888888888"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Service Fee</span>
                <span>₹{amount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span>Processing Fee</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between items-center py-3 font-semibold text-lg">
                <span>Total Amount</span>
                <span>₹{amount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card>
            <CardContent className="pt-6">
              <CashfreeButton
                amount={amount}
                currency="INR"
                customerId={`customer_${Date.now()}`}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
              
              <div className="mt-4 text-center text-sm text-slate-500">
                <p>🔒 Secure payment powered by Cashfree</p>
                <p>Test Mode - No actual charges will be made</p>
              </div>
            </CardContent>
          </Card>

          {/* Test Instructions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Test Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <p className="mb-3">You can test the payment integration using Cashfree's test environment:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use any valid email address</li>
                <li>Use phone number format: +91xxxxxxxxxx</li>
                <li>Test cards and UPI IDs are available in Cashfree's test mode</li>
                <li>No real money will be charged during testing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}