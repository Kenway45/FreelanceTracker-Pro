import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, FileText, Search, Calendar, DollarSign, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/invoices", {
        clientId: "",
        amount: "100.00",
        totalAmount: "100.00",
        status: "draft",
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice created",
        description: "A new draft invoice has been created.",
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
        description: "Failed to create invoice.",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      await apiRequest("PUT", `/api/invoices/${invoiceId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice updated",
        description: "Invoice status has been updated.",
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
        description: "Failed to update invoice.",
        variant: "destructive",
      });
    },
  });

  const getClientName = (clientId: string) => {
    const client = clients?.find((c: any) => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'paid':
        return 'outline';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const filteredInvoices = invoices?.filter((invoice: any) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(invoice.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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
              <h2 className="text-2xl font-semibold text-slate-900">Invoices</h2>
              <p className="text-sm text-slate-500">Manage and track your invoices</p>
            </div>
            <Button onClick={() => createInvoiceMutation.mutate()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {invoice.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getClientName(invoice.clientId)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {parseFloat(invoice.totalAmount).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(invoice.status)} className="capitalize">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(invoice.issueDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {invoice.dueDate ? (
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </div>
                          ) : (
                            "No due date"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Template {invoice.templateVariant}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {invoice.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateInvoiceStatusMutation.mutate({
                                  invoiceId: invoice.id,
                                  status: 'sent'
                                })}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            {invoice.status === 'sent' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateInvoiceStatusMutation.mutate({
                                  invoiceId: invoice.id,
                                  status: 'paid'
                                })}
                              >
                                Mark Paid
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "Edit Invoice",
                                  description: "Invoice editing coming soon!",
                                });
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No invoices found</p>
                  <p className="text-sm">Create your first invoice to get started</p>
                  <Button className="mt-4" onClick={() => createInvoiceMutation.mutate()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
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
