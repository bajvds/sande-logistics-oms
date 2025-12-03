// types.ts

// Sub-interfaces voor de geneste objecten
// We gebruiken 'string | null' omdat de AI "NULL" teruggeeft als data ontbreekt.
// Voor getallen gebruiken we 'number | null'.

export interface LocatieDetails {
    straat: string | null;
    postcode: string | null;
    plaats: string | null;
    land: string | null;
    contactpersoon: string | null;
  }
  
  export interface TransportDetails {
    datum_laden: string | null; // Verwacht formaat: YYYY-MM-DD
    tijd_van: string | null; // Verwacht formaat: HH:MM
    tijd_tot: string | null; // Verwacht formaat: HH:MM
    transport_type: string | null; // Bijv. 'Next day' of 'Same day'
  }
  
  export interface GoedItem {
    omschrijving: string | null;
    aantal: number | null;
    gewicht_kg: number | null;
  }
  
  // HOOFD INTERFACE 1: De structuur van de JSONB kolom 'order_data'
  // Dit is exact de structuur die de OpenAI node in n8n genereert.
  export interface AIOrderData {
    laad_locatie: LocatieDetails;
    los_locatie: LocatieDetails;
    transport_details: TransportDetails;
    goederen: GoedItem[];
  }
  
  // HOOFD INTERFACE 2: De volledige database rij in Supabase
  // Dit is hoe een hele order eruitziet als je hem ophaalt uit de 'orders' tabel.
  export interface DatabaseOrderTableRow {
    id: number; // int8 in Supabase
    created_at: string; // timestampz
    status: string; // text (bijv. 'Review', 'Nieuw', 'In Behandeling', 'Verwerkt')
    klant_email: string | null;
    email_onderwerp: string | null;
    email_message_id: string | null; // Uniek email ID voor deduplicatie (n8n)
    email_body: string | null; // De volledige email tekst (optioneel)
    pdf_url: string | null; // De link naar de PDF in Supabase Storage
    order_data: AIOrderData | Partial<AIOrderData> | null; // De JSONB kolom - kan leeg/partial zijn
  }
