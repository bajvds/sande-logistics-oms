'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DatabaseOrderTableRow, AIOrderData, GoedItem } from '@/types';
import { updateOrderAction } from './actions';
import { Loader2, Save, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for map to avoid SSR issues
const AddressMap = dynamic(() => import('@/components/address-map').then(mod => mod.AddressMap), {
  ssr: false,
  loading: () => (
    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-sm text-muted-foreground">Kaart laden...</span>
    </div>
  )
});

interface OrderFormProps {
  order: DatabaseOrderTableRow;
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

// Helper function to get debiteur name from email
function getDebiteurFromEmail(email: string | null): string {
  if (!email) return "-";
  if (email.includes("hittra")) return "Hittra";
  if (email.includes("gmail")) return "Gmail";
  if (email.includes("pgm")) return "Pgm";
  if (email.includes("pure-and-noble")) return "Pure-And-Noble";
  return email.split("@")[0];
}

export function OrderForm({ order }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  // Parse order_data (handle string or object)
  function parseOrderData(data: unknown): AIOrderData {
    if (!data) return {};
    if (typeof data === 'object' && data !== null) {
      return data as AIOrderData;
    }
    if (typeof data === 'string') {
      let cleanedData = data.trim();
      if (cleanedData.startsWith('```')) {
        cleanedData = cleanedData.replace(/^```(?:json)?\s*\n?/, '');
        cleanedData = cleanedData.replace(/\n?```\s*$/, '');
      }
      try {
        return JSON.parse(cleanedData);
      } catch {
        return {};
      }
    }
    return {};
  }

  const initialOrderData = parseOrderData(order.order_data);

  // Form state
  const [formData, setFormData] = useState({
    status: order.status,
    // Laad locatie
    laad_straat: initialOrderData.laad_locatie?.straat || '',
    laad_postcode: initialOrderData.laad_locatie?.postcode || '',
    laad_plaats: initialOrderData.laad_locatie?.plaats || '',
    laad_land: initialOrderData.laad_locatie?.land || '',
    laad_contactpersoon: initialOrderData.laad_locatie?.contactpersoon || '',
    // Los locatie
    los_straat: initialOrderData.los_locatie?.straat || '',
    los_postcode: initialOrderData.los_locatie?.postcode || '',
    los_plaats: initialOrderData.los_locatie?.plaats || '',
    los_land: initialOrderData.los_locatie?.land || '',
    los_contactpersoon: initialOrderData.los_locatie?.contactpersoon || '',
    // Transport details
    datum_laden: initialOrderData.transport_details?.datum_laden || '',
    tijd_van: initialOrderData.transport_details?.tijd_van || '',
    tijd_tot: initialOrderData.transport_details?.tijd_tot || '',
    transport_type: initialOrderData.transport_details?.transport_type || '',
  });

  // Goederen state (array)
  const [goederen, setGoederen] = useState<GoedItem[]>(
    initialOrderData.goederen && initialOrderData.goederen.length > 0
      ? initialOrderData.goederen
      : [{ omschrijving: '', aantal: null, gewicht_kg: null }]
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleGoedChange = (index: number, field: keyof GoedItem, value: string | number | null) => {
    setGoederen(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setIsSaved(false);
  };

  const addGoed = () => {
    setGoederen(prev => [...prev, { omschrijving: '', aantal: null, gewicht_kg: null }]);
  };

  const removeGoed = (index: number) => {
    if (goederen.length > 1) {
      setGoederen(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        // Build order_data object
        const orderData: AIOrderData = {
          laad_locatie: {
            straat: formData.laad_straat || null,
            postcode: formData.laad_postcode || null,
            plaats: formData.laad_plaats || null,
            land: formData.laad_land || null,
            contactpersoon: formData.laad_contactpersoon || null,
          },
          los_locatie: {
            straat: formData.los_straat || null,
            postcode: formData.los_postcode || null,
            plaats: formData.los_plaats || null,
            land: formData.los_land || null,
            contactpersoon: formData.los_contactpersoon || null,
          },
          transport_details: {
            datum_laden: formData.datum_laden || null,
            tijd_van: formData.tijd_van || null,
            tijd_tot: formData.tijd_tot || null,
            transport_type: formData.transport_type || null,
          },
          goederen: goederen.map(g => ({
            omschrijving: g.omschrijving || null,
            aantal: g.aantal ? Number(g.aantal) : null,
            gewicht_kg: g.gewicht_kg ? Number(g.gewicht_kg) : null,
          })),
        };

        await updateOrderAction(order.id, {
          status: formData.status,
          order_data: orderData,
        });

        setIsSaved(true);
        router.refresh();
        
        // Reset saved indicator after 2 seconds
        setTimeout(() => setIsSaved(false), 2000);
      } catch (error) {
        alert('Er ging iets mis bij het opslaan');
        console.error(error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Save Button - Fixed at top */}
      <div className="flex justify-end sticky top-0 bg-gray-50 py-2 z-10">
        <Button 
          onClick={handleSave}
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : isSaved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Opgeslagen!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Opslaan
            </>
          )}
        </Button>
      </div>

      {/* ALGEMEEN & LADEN side by side */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ALGEMEEN */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700 text-base border-l-4 border-blue-700 pl-3">
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
                <Input
                  value={formData.transport_type}
                  onChange={(e) => handleInputChange('transport_type', e.target.value)}
                  placeholder="Bijv. Next day"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(formData.status)}>
                    {formData.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium truncate">{order.klant_email || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LADEN */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700 text-base border-l-4 border-blue-700 pl-3">
              LADEN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Datum laden</Label>
                <Input
                  type="date"
                  value={formData.datum_laden}
                  onChange={(e) => handleInputChange('datum_laden', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tijd van - tot</Label>
                <div className="flex gap-1">
                  <Input
                    type="time"
                    value={formData.tijd_van}
                    onChange={(e) => handleInputChange('tijd_van', e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    type="time"
                    value={formData.tijd_tot}
                    onChange={(e) => handleInputChange('tijd_tot', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <div>
              <Label className="text-xs text-muted-foreground">Contactpersoon</Label>
              <Input
                value={formData.laad_contactpersoon}
                onChange={(e) => handleInputChange('laad_contactpersoon', e.target.value)}
                placeholder="Naam contactpersoon"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Adres</Label>
              <Input
                value={formData.laad_straat}
                onChange={(e) => handleInputChange('laad_straat', e.target.value)}
                placeholder="Straatnaam + huisnummer"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Postcode</Label>
                <Input
                  value={formData.laad_postcode}
                  onChange={(e) => handleInputChange('laad_postcode', e.target.value)}
                  placeholder="1234 AB"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Plaats</Label>
                <Input
                  value={formData.laad_plaats}
                  onChange={(e) => handleInputChange('laad_plaats', e.target.value)}
                  placeholder="Plaatsnaam"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Land</Label>
              <Input
                value={formData.laad_land}
                onChange={(e) => handleInputChange('laad_land', e.target.value)}
                placeholder="Nederland"
                className="h-8 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PRODUCTEN & LOSSEN side by side */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* PRODUCTEN */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700 text-base border-l-4 border-blue-700 pl-3 flex items-center justify-between">
              <span>PRODUCTEN ({goederen.length})</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addGoed}
                className="h-6 text-xs"
              >
                + Toevoegen
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goederen.map((item, index) => (
              <div key={index} className="space-y-2 text-sm">
                {index > 0 && <Separator />}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Product {index + 1}</span>
                  {goederen.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeGoed(index)}
                      className="h-6 text-xs text-red-500 hover:text-red-700"
                    >
                      Verwijder
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Omschrijving</Label>
                    <Input
                      value={item.omschrijving || ''}
                      onChange={(e) => handleGoedChange(index, 'omschrijving', e.target.value)}
                      placeholder="Product omschrijving"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Aantal</Label>
                    <Input
                      type="number"
                      value={item.aantal ?? ''}
                      onChange={(e) => handleGoedChange(index, 'aantal', e.target.value ? Number(e.target.value) : null)}
                      placeholder="0"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Gewicht (kg)</Label>
                  <Input
                    type="number"
                    value={item.gewicht_kg ?? ''}
                    onChange={(e) => handleGoedChange(index, 'gewicht_kg', e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* LOSSEN */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-700 text-base border-l-4 border-blue-700 pl-3">
              LOSSEN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Contactpersoon / Ontvanger</Label>
              <Input
                value={formData.los_contactpersoon}
                onChange={(e) => handleInputChange('los_contactpersoon', e.target.value)}
                placeholder="Naam contactpersoon"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Adres</Label>
              <Input
                value={formData.los_straat}
                onChange={(e) => handleInputChange('los_straat', e.target.value)}
                placeholder="Straatnaam + huisnummer"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Postcode</Label>
                <Input
                  value={formData.los_postcode}
                  onChange={(e) => handleInputChange('los_postcode', e.target.value)}
                  placeholder="1234 AB"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Plaats</Label>
                <Input
                  value={formData.los_plaats}
                  onChange={(e) => handleInputChange('los_plaats', e.target.value)}
                  placeholder="Plaatsnaam"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Land</Label>
              <Input
                value={formData.los_land}
                onChange={(e) => handleInputChange('los_land', e.target.value)}
                placeholder="Frankrijk"
                className="h-8 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROUTE KAART */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-700 text-sm border-l-4 border-blue-700 pl-3">
            ROUTE
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-32">
            <AddressMap
              laadLat={order.laad_lat}
              laadLng={order.laad_lng}
              laadAdres={order.laad_adres_volledig}
              losLat={order.los_lat}
              losLng={order.los_lng}
              losAdres={order.los_adres_volledig}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Laden
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Lossen
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

