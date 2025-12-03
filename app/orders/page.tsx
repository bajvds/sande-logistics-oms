import Link from "next/link";
import { DatabaseOrderTableRow } from "@/types";
import { getOrders } from "@/lib/data/orders";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, ChevronRight } from "lucide-react";

// Helper function to get debiteur name from email
function getDebiteurFromEmail(email: string | null): string {
  if (!email) return "-";
  if (email.includes("hittra")) return "Hittra";
  if (email.includes("gmail")) return "Gmail";
  if (email.includes("pgm")) return "Pgm";
  if (email.includes("pure-and-noble")) return "Pure-And-Noble";
  return email.split("@")[0];
}

// Helper function to format date
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Helper function to format time
function formatTime(timeString: string | null): string {
  if (!timeString || timeString === "00:00") return "-";
  return timeString;
}

// Helper to format datetime for table
function formatDateTime(dateStr: string | null, timeStr: string | null): string {
  const date = formatDate(dateStr);
  const time = formatTime(timeStr);
  if (date === "-" && time === "-") return "-";
  if (time === "-") return date;
  return `${date} - ${time}`;
}

interface OrderTableProps {
  orders: DatabaseOrderTableRow[];
  showVerwerker?: boolean;
}

function OrderTable({ orders, showVerwerker = false }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">Geen orders gevonden.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/30">
          <TableHead className="w-[80px]">Order #</TableHead>
          <TableHead>Debiteur</TableHead>
          {showVerwerker && <TableHead>Verwerker</TableHead>}
          <TableHead>Transport type</TableHead>
          <TableHead>Laden van</TableHead>
          <TableHead>Laden tot</TableHead>
          <TableHead>Lossen van</TableHead>
          <TableHead>Lossen tot</TableHead>
          <TableHead className="w-[120px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>{getDebiteurFromEmail(order.klant_email)}</TableCell>
            {showVerwerker && <TableCell>-</TableCell>}
            <TableCell>{order.order_data?.transport_details?.transport_type || "-"}</TableCell>
            <TableCell>
              {formatDateTime(
                order.order_data?.transport_details?.datum_laden,
                order.order_data?.transport_details?.tijd_van
              )}
            </TableCell>
            <TableCell>
              {formatDateTime(
                order.order_data?.transport_details?.datum_laden,
                order.order_data?.transport_details?.tijd_tot
              )}
            </TableCell>
            <TableCell>
              {formatDateTime(
                order.order_data?.transport_details?.datum_laden,
                order.order_data?.transport_details?.tijd_van
              )}
            </TableCell>
            <TableCell>
              {formatDateTime(
                order.order_data?.transport_details?.datum_laden,
                order.order_data?.transport_details?.tijd_tot
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Link href={`/orders/${order.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function OrdersPage() {
  // Fetch real orders from Supabase
  const orders = await getOrders();

  // Helper function to clean and parse order_data (optimized - no logging)
  function parseOrderData(data: unknown): object | null {
    if (!data) return null;
    if (typeof data === 'object') return data as object;
    if (typeof data !== 'string') return null;
    
    let str = data.trim();
    // Remove markdown code blocks
    if (str.startsWith('```')) {
      str = str.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  // Parse order_data for all orders
  const parsedOrders: DatabaseOrderTableRow[] = orders.map(order => ({
    ...order,
    order_data: parseOrderData(order.order_data) || {}
  }));

  // Group orders by status
  // Note: n8n creates orders with status "Review", we also support "Nieuw"
  const reviewOrders = parsedOrders.filter((o) => o.status === "Review" || o.status === "Nieuw");
  const inBehandelingOrders = parsedOrders.filter((o) => o.status === "In Behandeling");
  const verwerktOrders = parsedOrders.filter((o) => o.status === "Verwerkt");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">ORDERS OVERZICHT</h1>
        <AutoRefresh intervalSeconds={60} />
      </div>

      {/* NIEUW / REVIEW Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-green-700 text-lg border-l-4 border-green-700 pl-3">
            NIEUW ({reviewOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable orders={reviewOrders} />
        </CardContent>
      </Card>

      {/* IN BEHANDELING Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-green-700 text-lg border-l-4 border-green-700 pl-3">
            IN BEHANDELING ({inBehandelingOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable orders={inBehandelingOrders} showVerwerker={true} />
        </CardContent>
      </Card>

      {/* VERWERKT Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-green-700 text-lg border-l-4 border-green-700 pl-3">
            VERWERKT ({verwerktOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable orders={verwerktOrders} showVerwerker={true} />
        </CardContent>
      </Card>
    </div>
  );
}
