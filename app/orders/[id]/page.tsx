import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data/orders";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderActions } from "./order-actions";
import { OrderForm } from "./order-form";

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

      {/* Right Column: Editable Form (Scrollable) */}
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

          {/* Editable Form - Always in edit mode */}
          <OrderForm order={order} />
        </div>
      </div>
    </div>
  );
}
