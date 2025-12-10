import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceData, TemplateStyle, CompanyDetails } from './types';
import { extractInvoiceData, fileToGenerativePart } from './services/geminiService';

declare const html2pdf: any; // Declare global html2pdf variable

const DEFAULT_COMPANY: CompanyDetails = {
  name: "JP NET",
  address: "59/22B, VP Kovil street, pichnoor, Gudiyattam, Vellore, TamilNadu, 632602",
  email: "jpstore.th@gmail.com",
  phone: "9566377557",
  gstin: "33BJIPA0930P1ZC",
  pan: "",
  logoUrl: null,
  signatureUrl: null,
  sealUrl: null,
  upiId: "ajithproteck@icici",
  logoPosition: 'left'
};

const INITIAL_DATA: InvoiceData = {
  company: DEFAULT_COMPANY,
  client: {
    name: "Client Name",
    companyName: "Client Company",
    address: "Client Address",
    gstin: "",
    email: "",
    phone: ""
  },
  details: {
    documentTitle: "TAX INVOICE",
    number: "INV-001",
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: "Net 30 Days",
    notes: "",
    terms: "1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Interest @ 24% will be charged if payment is not made within due date.\n4. Subject to 'Gudiyattam' Jurisdiction."
  },
  items: [
    { id: '1', description: 'IT Service / Product', hsn: '9983', quantity: 1, price: 0, gstRate: 18 },
  ]
};

function App() {
  const [data, setData] = useState<InvoiceData>(INITIAL_DATA);
  const [template, setTemplate] = useState<TemplateStyle>(TemplateStyle.MODERN);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load persistence logic
  useEffect(() => {
    // 1. Load Company Defaults
    const savedCompany = localStorage.getItem('defaultCompanyDetails');
    if (savedCompany) {
        try {
            const parsedCompany = JSON.parse(savedCompany);
            // Merge defaults but don't overwrite if we have a current draft? 
            // Actually, usually we want to start with defaults unless we have a specific draft.
            setData(prev => ({ ...prev, company: parsedCompany }));
        } catch(e) { console.error("Error loading company defaults", e); }
    }

    // 2. Load Last Invoice Number logic
    const savedInvoiceNumber = localStorage.getItem('lastInvoiceNumber');
    if (savedInvoiceNumber) {
        // Basic increment logic: try to parse number and increment
        const numPart = parseInt(savedInvoiceNumber.replace(/\D/g, ''));
        if (!isNaN(numPart)) {
            const prefix = savedInvoiceNumber.replace(/[0-9]/g, '');
            const newNum = numPart + 1;
            const newInvoiceNumber = prefix + newNum.toString().padStart(3, '0');
             setData(prev => ({
                ...prev,
                details: { ...prev.details, number: newInvoiceNumber }
            }));
        }
    }

    // 3. Load Draft State if exists
    const savedDraft = localStorage.getItem('currentInvoiceDraft');
    if (savedDraft) {
        try {
            const parsedDraft = JSON.parse(savedDraft);
            // Merge draft
            setData(prev => ({
                 ...parsedDraft,
                 // Safety check: ensure company name isn't empty if draft was bad
                 company: parsedDraft.company.name ? parsedDraft.company : prev.company
            }));
        } catch(e) { console.error("Error loading draft", e); }
    }
  }, []);

  // Save State to LocalStorage on Change
  useEffect(() => {
    // Save Invoice Number to track increment
    if (data.details.number) {
        localStorage.setItem('lastInvoiceNumber', data.details.number);
    }
    // Save current work as draft
    try {
        localStorage.setItem('currentInvoiceDraft', JSON.stringify(data));
    } catch (e) {
        console.warn("Could not save draft (likely storage full from images)");
    }
  }, [data]);

  const saveCompanyDefaults = () => {
    const confirmSave = window.confirm("Do you want to save the current Company Details, Logo, Signature, and Seal as your default settings? This will overwrite previous defaults.");
    if (!confirmSave) return;

    try {
        localStorage.setItem('defaultCompanyDetails', JSON.stringify(data.company));
        alert("Success! Your company details and images have been saved as defaults.");
    } catch (e) {
        alert("Error: Storage limit exceeded. Please try using smaller images (compress them) for Logo/Signature/Seal.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const base64Data = await fileToGenerativePart(file);
      const extractedData = await extractInvoiceData(base64Data, file.type);
      
      if (extractedData) {
        setData(prev => ({
          ...prev,
          // STRICTLY PRESERVE COMPANY DATA - Do not merge extracted company data
          client: { ...prev.client, ...extractedData.client },
          // Only update items if found, preserve IDs
          items: extractedData.items && extractedData.items.length > 0 
            ? extractedData.items.map(item => ({...item, id: Math.random().toString()})) 
            : prev.items,
          // Preserve Invoice Details except maybe Date if useful, but usually user wants today
          // details: { ...prev.details, ...extractedData.details } 
        }));
      }
    } catch (error) {
      alert("Failed to analyze invoice. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper: Generate Blob for sharing
  const generatePdfBlob = async (): Promise<Blob | null> => {
      const element = document.getElementById('invoice-content');
      if (!element) return null;
      const opt = {
        margin: 0,
        filename: `${data.details.number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      if (typeof html2pdf !== 'undefined') {
          return html2pdf().set(opt).from(element).output('blob');
      }
      return null;
  }

  const handleDownloadPDF = (customFilename?: string) => {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    const filename = customFilename || prompt("Enter filename for PDF:", data.details.number) || data.details.number;

    const opt = {
      margin:       0,
      filename:     `${filename}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save();
    } else {
        alert("PDF generator loading... please try again in a second.");
    }
  };

  // Unified Share Handler
  const handleShare = async (platform: 'whatsapp' | 'email') => {
      const blob = await generatePdfBlob();
      if (!blob) {
          alert("Could not generate PDF. Please try again.");
          return;
      }

      const file = new File([blob], `${data.details.number}.pdf`, { type: 'application/pdf' });
      const shareData = {
          title: data.details.documentTitle,
          text: `Invoice ${data.details.number} from ${data.company.name}`,
          files: [file]
      };

      // 1. Try Native Web Share API (Works on Mobile for Auto-Attach)
      if (navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
              return; // Success
          } catch (err) {
              console.log('Native share cancelled or failed', err);
              // Fallthrough to fallback
          }
      }

      // 2. Desktop Fallback (Download + Open App)
      // Save file locally first
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.details.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Open App with pre-filled text
      setTimeout(() => {
          if (platform === 'whatsapp') {
               const text = `*${data.details.documentTitle}*\nFrom: ${data.company.name}\nTo: ${data.client.companyName || data.client.name}\nInvoice No: ${data.details.number}\n\n*Total Amount: ₹${data.items.reduce((acc, item) => acc + (item.quantity * item.price) + ((item.quantity * item.price * item.gstRate)/100), 0).toFixed(2)}*\n\n(Please attach the downloaded PDF file)`;
               window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          } else {
               const subject = `${data.details.documentTitle} - ${data.details.number} from ${data.company.name}`;
               const body = `Dear Customer,\n\nPlease find attached the ${data.details.documentTitle}.\n\n(Please attach the downloaded file manually)\n\nThank you,\n${data.company.name}`;
               window.location.href = `mailto:${data.client.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          }
          alert(`PDF Downloaded.\n\nPlease drag and drop the downloaded file into ${platform === 'whatsapp' ? 'WhatsApp' : 'your Email'}.`);
      }, 500);
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 text-slate-900 print:h-auto print:overflow-visible print:block">
      {/* Sidebar / Editor - Hidden on Print */}
      <div className="w-full md:w-[450px] lg:w-[500px] h-full flex-shrink-0 z-20 shadow-xl bg-white no-print overflow-y-auto">
        <InvoiceForm 
          data={data} 
          setData={setData} 
          selectedTemplate={template} 
          setTemplate={setTemplate}
          onImageUpload={handleImageUpload}
          isAnalyzing={isAnalyzing}
          onPrint={handlePrint}
          onDownloadPDF={() => handleDownloadPDF()}
          onSaveSettings={saveCompanyDefaults}
          onWhatsAppShare={() => handleShare('whatsapp')}
          onEmailShare={() => handleShare('email')}
        />
      </div>

      {/* Preview Area */}
      <div className="flex-grow h-full overflow-auto bg-slate-500 p-4 md:p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible print:block print:h-auto print:w-full">
         {/* Paper Sheet Simulation */}
         <div id="invoice-preview-container" className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] print:shadow-none print:w-full print:max-w-none print:min-h-0 print:absolute print:top-0 print:left-0">
            <InvoicePreview data={data} template={template} />
         </div>
      </div>
    </div>
  );
}

export default App;