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
import { Plus, Edit, Quote as QuoteIcon, Search, Calendar, DollarSign, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Quotes() {
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

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["/api/quotes"],
    retry: false,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quotes", {
        clientId: "",
        title: "New Quote",
        description: "Quote description",
        amount: "1000.00",
        totalAmount: "1000.00",
        status: "draft",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote created",
        description: "A new draft quote has been created.",
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
        description: "Failed to create quote.",
        variant: "destructive",
      });
    },
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      await apiRequest("PUT", `/api/quotes/${quoteId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({
        title: "Quote updated",
        description: "Quote status has been updated.",
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
        description: "Failed to update quote.",
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
      case 'accepted':
        return 'outline';
      case 'rejected':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const filteredQuotes = quotes?.filter((quote: any) => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClientName(quote.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || quote.status === statusFilter;
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
              <h2 className="text-2xl font-semibold text-slate-900">Quotes</h2>
              <p className="text-sm text-slate-500">Create and manage project quotes</p>
            </div>
            <Button onClick={() => createQuoteMutation.mutate()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search quotes..."
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
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredQuotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotes.map((quote: any) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {quote.quoteNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{quote.title}</div>
                            {quote.description && (
                              <div className="text-sm text-slate-500 truncate max-w-xs">
                                {quote.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getClientName(quote.clientId)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {parseFloat(quote.totalAmount).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(quote.status)} className="capitalize">
                            {quote.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {quote.validUntil ? (
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(quote.validUntil).toLocaleDateString()}
                            </div>
                          ) : (
                            "No expiry"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Template {quote.templateVariant}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {quote.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuoteStatusMutation.mutate({
                                  quoteId: quote.id,
                                  status: 'sent'
                                })}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            {quote.status === 'sent' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateQuoteStatusMutation.mutate({
                                    quoteId: quote.id,
                                    status: 'accepted'
                                  })}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateQuoteStatusMutation.mutate({
                                    quoteId: quote.id,
                                    status: 'rejected'
                                  })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "Edit Quote",
                                  description: "Quote editing coming soon!",
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
                  <QuoteIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No quotes found</p>
                  <p className="text-sm">Create your first quote to get started</p>
                  <Button className="mt-4" onClick={() => createQuoteMutation.mutate()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quote
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
