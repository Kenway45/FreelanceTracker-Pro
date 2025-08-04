import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, CreditCard, Key, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function PaymentConfig() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [provider, setProvider] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [showKeyValue, setShowKeyValue] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: paymentKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ["/api/admin/payment-keys"],
    retry: false,
  });

  const addKeyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/payment-keys", {
        provider,
        keyName,
        keyValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-keys"] });
      toast({
        title: "API key added",
        description: "The payment API key has been securely stored.",
      });
      setProvider("");
      setKeyName("");
      setKeyValue("");
      setShowAddModal(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add payment API key.",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest("DELETE", `/api/admin/payment-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-keys"] });
      toast({
        title: "API key deleted",
        description: "The payment API key has been removed.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete payment API key.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !keyName || !keyValue) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    addKeyMutation.mutate();
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return 'default';
      case 'cashfree':
        return 'secondary';
      case 'square':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Payment Configuration</h2>
              <p className="text-sm text-slate-500">Manage secure payment API keys and settings</p>
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment API Key</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={provider} onValueChange={setProvider} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="cashfree">Cashfree</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="keyName">Key Name</Label>
                    <Select value={keyName} onValueChange={setKeyName} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select key type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secret_key">Secret Key</SelectItem>
                        <SelectItem value="public_key">Public Key</SelectItem>
                        <SelectItem value="webhook_secret">Webhook Secret</SelectItem>
                        <SelectItem value="client_id">Client ID</SelectItem>
                        <SelectItem value="client_secret">Client Secret</SelectItem>
                        <SelectItem value="app_id">App ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="keyValue">API Key Value</Label>
                    <div className="relative">
                      <Input
                        id="keyValue"
                        type={showKeyValue ? "text" : "password"}
                        placeholder="Enter API key"
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowKeyValue(!showKeyValue)}
                      >
                        {showKeyValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAddModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={addKeyMutation.isPending}
                    >
                      {addKeyMutation.isPending ? "Adding..." : "Add Key"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Security Notice */}
          <Card className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Security Notice</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    All API keys are encrypted before storage. Only the encrypted values are stored in the database.
                    Never share your API keys or store them in plain text.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payment API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {keysLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : paymentKeys && paymentKeys.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Key Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentKeys.map((key: any) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            <Badge variant={getProviderColor(key.provider)} className="capitalize">
                              {key.provider}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{key.keyName.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.isActive ? "outline" : "secondary"}>
                            {key.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(key.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "Edit API Key",
                                  description: "API key editing functionality coming soon!",
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteKeyMutation.mutate(key.id)}
                              disabled={deleteKeyMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No payment API keys configured</p>
                  <p className="text-sm">Add your first API key to enable payment processing</p>
                  <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
