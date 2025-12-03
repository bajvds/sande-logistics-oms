import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/orders";
import { AIOrderData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderActions } from "./order-actions";

// Helper function to get debiteur name from email
function getDebiteurFromEmail(email: string | null): string {
  if (!email) return "-";
  if (email.includes("hittra")) return "Hittra";
  if (email.includes("gmail")) return "Gmail";
  if (email.includes("pgm")) return "Pgm";
  if (email.includes("pure-and-noble")) return "Pure-And-Noble";
  return email.split("@")[0];
}

// Status badge variant helper
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Review":
    case "Nieuw":
      return "default";
    case "In Behandeling":
      return "secondary";
    case "Verwerkt":
      return "outline";
    default:
      return "default";
  }
}

// Helper to safely display values
function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "NULL") return "-";
  return String(value);
}

// Helper to format date for display
function formatDate(dateString: string | null): string {
  if (!dateString || dateString === "NULL") return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  // Helper function to clean and parse order_data
  function parseOrderData(data: unknown): object | null {
    if (!data) return null;
    
    // If it's already an object, return it
    if (typeof data === 'object' && data !== null) {
      return data as object;
    }
    
    // If it's a string, clean it and parse
    if (typeof data === 'string') {
      let cleanedData = data.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      if (cleanedData.startsWith('```')) {
        cleanedData = cleanedData.replace(/^```(?:json)?\s*\n?/, '');
        cleanedData = cleanedData.replace(/\n?```\s*$/, '');
      }
      
      try {
        return JSON.parse(cleanedData);
      } catch (e) {
        console.error('Failed to parse order_data:', e);
        return null;
      }
    }
    
    return null;
  }

  // Safely access nested data with fallbacks
  const parsedData = parseOrderData(order.order_data);
  const orderData: AIOrderData = (parsedData as AIOrderData) || {};

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Left Column: PDF Viewer or Email Info */}
      <div className="hidden w-1/2 flex-col border-r bg-muted/30 lg:flex overflow-hidden">
        {order.pdf_url && !order.pdf_url.includes('storage.googleapis.com') ? (
          // Show actual PDF (only if not GCS - those require auth)
          <iframe
            src={order.pdf_url}
            className="w-full h-full"
            title={`PDF voor order ${order.id}`}
          />
        ) : (
          // Show email info when no PDF
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-white">
              <h3 className="font-semibold text-sm text-muted-foreground">EMAIL INFORMATIE</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Van</Label>
                  <p className="text-sm font-medium">{order.klant_email || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Onderwerp</Label>
                  <p className="text-sm font-medium">{order.email_onderwerp || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ontvangen</Label>
                  <p className="text-sm font-medium">
                    {new Date(order.created_at).toLocaleString("nl-NL", {
                      day: "2-digit",
                      month: "2-digit", 
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Email inhoud</Label>
                  {order.email_body ? (
                    <div className="mt-2 p-4 bg-white border rounded-lg text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {order.email_body}
                    </div>
                  ) : (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg text-sm text-muted-foreground italic">
                      Geen email tekst beschikbaar.
                      <br /><br />
                      <span className="text-xs">Voeg <code className="bg-gray-200 px-1 rounded">email_body</code> toe in de n8n workflow.</span>
                    </div>
                  )}
                </div>
                {!order.pdf_url ? (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      ⚠️ Geen PDF bijlage gevonden voor deze order
                    </p>
                  </div>
                ) : order.pdf_url.includes('storage.googleapis.com') ? (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      📄 PDF is opgeslagen in Google Cloud Storage maar niet publiek toegankelijk.
                    </p>
                    <a 
                      href={order.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 underline mt-1 block"
                    >
                      Open in GCS Console (vereist inlog)
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Form (Scrollable) */}
      <div className="flex w-full flex-col overflow-y-auto lg:w-1/2 bg-gray-50">
        <div className="flex-1 p-6">
          {/* Header with Actions */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                ORDER #{order.id}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {order.email_onderwerp || "Geen onderwerp"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/orders">
                <Button variant="outline" size="sm">
                  ← OVERZICHT
                </Button>
              </Link>
              <OrderActions orderId={order.id} currentStatus={order.status} />
            </div>
          </div>

          <div className="space-y-4">
            {/* ALGEMEEN & LADEN side by side */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* ALGEMEEN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-700 text-base border-l-4 border-green-700 pl-3">
                    ALGEMEEN
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Debiteur</Label>
                      <p className="text-sm font-medium">{getDebiteurFromEmail(order.klant_email)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Transport type</Label>
                      <p className="text-sm font-medium">{displayValue(orderData.transport_details?.transport_type)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium truncate">{displayValue(order.klant_email)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LADEN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-700 text-base border-l-4 border-green-700 pl-3">
                    LADEN
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Datum laden</Label>
                      <p className="font-medium">{formatDate(orderData.transport_details?.datum_laden)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tijd van - tot</Label>
                      <p className="font-medium">
                        {displayValue(orderData.transport_details?.tijd_van)} - {displayValue(orderData.transport_details?.tijd_tot)}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Contactpersoon</Label>
                    <p className="font-medium">{displayValue(orderData.laad_locatie?.contactpersoon)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Adres</Label>
                    <p className="font-medium">{displayValue(orderData.laad_locatie?.straat)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Postcode</Label>
                      <p className="font-medium">{displayValue(orderData.laad_locatie?.postcode)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Plaats</Label>
                      <p className="font-medium">{displayValue(orderData.laad_locatie?.plaats)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Land</Label>
                    <p className="font-medium">{displayValue(orderData.laad_locatie?.land)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PRODUCTEN & LOSSEN side by side */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* PRODUCTEN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-700 text-base border-l-4 border-green-700 pl-3">
                    PRODUCTEN ({orderData.goederen?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderData.goederen && orderData.goederen.length > 0 ? (
                    orderData.goederen.map((item, index) => (
                      <div key={index} className="space-y-2 text-sm">
                        {index > 0 && <Separator />}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Omschrijving</Label>
                            <p className="font-medium">{displayValue(item.omschrijving)}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Aantal</Label>
                            <p className="font-medium">{displayValue(item.aantal)}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Gewicht</Label>
                          <p className="font-medium">{item.gewicht_kg ? `${item.gewicht_kg} kg` : "-"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Geen producten opgegeven</p>
                  )}
                </CardContent>
              </Card>

              {/* LOSSEN */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-700 text-base border-l-4 border-green-700 pl-3">
                    LOSSEN
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Contactpersoon / Ontvanger</Label>
                    <p className="font-medium">{displayValue(orderData.los_locatie?.contactpersoon)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Adres</Label>
                    <p className="font-medium">{displayValue(orderData.los_locatie?.straat)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Postcode</Label>
                      <p className="font-medium">{displayValue(orderData.los_locatie?.postcode)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Plaats</Label>
                      <p className="font-medium">{displayValue(orderData.los_locatie?.plaats)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Land</Label>
                    <p className="font-medium">{displayValue(orderData.los_locatie?.land)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
