export interface LineItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  price: number;
  gstRate: number; // Percentage
}

export interface CompanyDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  gstin: string;
  pan: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  sealUrl: string | null;
  upiId?: string;
}

export interface ClientDetails {
  name: string;
  companyName: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
}

export interface InvoiceDetails {
  documentTitle: string; // e.g., "TAX INVOICE", "QUOTATION"
  number: string;
  date: string;
  dueDate: string;
  notes: string;
  terms: string;
}

export interface InvoiceData {
  company: CompanyDetails;
  client: ClientDetails;
  details: InvoiceDetails;
  items: LineItem[];
}

export enum TemplateStyle {
  MODERN = 1,     // Blue/Yellow accents (Ref Image 1)
  OFFICIAL_GST = 2, // Grid/Table heavy (Ref Image 2)
  MINIMAL = 3,    // Clean whitespace
  BOLD = 4,       // Large typography
  CORPORATE = 5   // Sidebar layout
}