import React from 'react';
import { InvoiceData, TemplateStyle } from '../types';

interface Props {
  data: InvoiceData;
  template: TemplateStyle;
}

// Amount to words converter for Indian Numbering System
const numberToWords = (n: number): string => {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (n === 0) return 'Zero';

  const convertLessThanOneThousand = (num: number): string => {
    let current = '';
    if (num >= 100) {
      current += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 10 && num < 20) {
      current += teens[num - 10] + ' ';
    } else {
      if (num >= 20) {
        current += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      if (num > 0) {
        current += units[num] + ' ';
      }
    }
    return current;
  };

  let result = '';
  // Integer part only
  n = Math.floor(n);

  if (n >= 10000000) {
    result += convertLessThanOneThousand(Math.floor(n / 10000000)) + 'Crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    result += convertLessThanOneThousand(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    result += convertLessThanOneThousand(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  result += convertLessThanOneThousand(n);
  
  return result.trim() + ' Only';
};

export const InvoicePreview: React.FC<Props> = ({ data, template }) => {
  const { company, client, details, items } = data;

  // Calculation Helpers
  const calculateItemTotal = (qty: number, price: number) => qty * price;
  
  // Group taxes by rate for detailed breakdown if needed
  const taxBreakdown = items.reduce((acc, item) => {
    const itemTotal = calculateItemTotal(item.quantity, item.price);
    const taxAmount = (itemTotal * item.gstRate) / 100;
    acc.totalTax += taxAmount;
    return acc;
  }, { totalTax: 0 });

  const subTotal = items.reduce((acc, item) => acc + calculateItemTotal(item.quantity, item.price), 0);
  const totalAmount = subTotal + taxBreakdown.totalTax;
  const amountInWords = numberToWords(totalAmount);

  // Generate QR Code URL if UPI ID exists
  // Using QuickChart for reliable CORS support and uptime
  const upiLink = `upi://pay?pa=${company.upiId}&pn=${encodeURIComponent(company.name)}${totalAmount > 0 ? `&am=${totalAmount.toFixed(2)}` : ''}&cu=INR`;
  const qrCodeUrl = company.upiId 
    ? `https://quickchart.io/qr?text=${encodeURIComponent(upiLink)}&size=150&margin=0`
    : null;


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  // Helper for Logo positioning logic
  const getHeaderLayout = () => {
     if (company.logoPosition === 'center') return 'flex-col items-center text-center';
     if (company.logoPosition === 'right') return 'flex-row-reverse text-right';
     return 'flex-row justify-between items-start';
  };

  // Common QR Code component
  const PaymentQRCode = ({ className }: { className?: string }) => (
    company.upiId && qrCodeUrl ? (
      <div className={`flex flex-col items-center justify-center p-2 border border-slate-200 rounded bg-white ${className}`}>
        <img src={qrCodeUrl} alt="Payment QR" className="w-20 h-20 mb-1" crossOrigin="anonymous" />
        <p className="text-[9px] text-slate-500">Scan to Pay</p>
        <p className="text-[9px] font-mono font-bold">{company.upiId}</p>
      </div>
    ) : null
  );

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 5mm; size: auto; }
          body, html { width: 100%; height: 100%; margin: 0; padding: 0; overflow: visible !important; }
          #root { display: block; overflow: visible; height: auto; }
          .no-print { display: none !important; }
          .print-visible { display: block !important; }
          .page-break-inside-avoid { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          /* Reset tailwind heights for print */
          .h-screen { height: auto !important; }
          .overflow-auto { overflow: visible !important; }
          .overflow-y-auto { overflow: visible !important; }
        }
      `}</style>

    {/* WRAPPER to ensure full height/width in template */}
    <div id="invoice-content" className="w-full h-full relative bg-white print:w-full print:h-auto print:absolute print:top-0 print:left-0">

      {/* --- TEMPLATE 1: MODERN --- */}
      {template === TemplateStyle.MODERN && (
        <div className="w-full min-h-full bg-white p-8 relative font-sans text-slate-800 print:p-0">
          <div className={`flex mb-8 ${getHeaderLayout()}`}>
            <div className="flex flex-col">
              {company.logoUrl && (
                 <img src={company.logoUrl} alt="Logo" className={`h-20 w-auto object-contain mb-1 ${company.logoPosition === 'center' ? 'mx-auto' : ''}`} />
              )}
              {/* BRAND NAME UNDER LOGO */}
              <h1 className={`text-2xl font-bold text-slate-900 ${company.logoPosition === 'center' ? 'text-center' : ''}`}>{company.name}</h1>
            </div>
            <div className={company.logoPosition === 'center' ? 'mt-4' : (company.logoPosition === 'right' ? 'text-left' : 'text-right')}>
               <h2 className="text-sm text-slate-500 mb-1">{company.address}</h2>
               <h2 className="text-sm text-slate-500 mb-1">{company.email}</h2>
               <h2 className="text-sm text-slate-500">{company.phone}</h2>
            </div>
          </div>

          <div className="bg-[#1e293b] text-white p-6 rounded-l-full rounded-r-lg flex justify-between items-center mb-8 relative overflow-hidden print:rounded-none">
             <div className="relative z-10">
                 <h1 className="text-4xl font-bold uppercase tracking-wide">{details.documentTitle}</h1>
             </div>
             <div className="absolute right-0 top-0 h-full w-1/3 bg-[#fbbf24] transform skew-x-12 translate-x-10 print:hidden"></div>
          </div>

          <div className="flex justify-between mb-8">
              <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Bill From:</h3>
                  <p className="font-bold text-lg">{company.name}</p>
                  <p className="text-sm text-slate-600 w-48">{company.address}</p>
                  <p className="text-sm text-slate-600">GST: {company.gstin}</p>
              </div>
              <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Bill To:</h3>
                  <p className="font-bold text-lg">{client.companyName || client.name}</p>
                  <p className="text-sm text-slate-600 w-48">{client.address}</p>
                  <p className="text-sm text-slate-600">GST: {client.gstin}</p>
              </div>
              <div className="text-right">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">{details.documentTitle} Details:</h3>
                  <p className="text-sm"><span className="font-bold">NO:</span> {details.number}</p>
                  <p className="text-sm"><span className="font-bold">Date:</span> {formatDate(details.date)}</p>
                  <p className="text-sm"><span className="font-bold">Due:</span> {formatDate(details.dueDate)}</p>
                  {details.paymentTerms && <p className="text-sm mt-1"><span className="font-bold">Terms:</span> {details.paymentTerms}</p>}
              </div>
          </div>

          <table className="w-full mb-8">
              <thead>
                  <tr className="bg-[#fbbf24] text-slate-900 print:bg-yellow-400">
                      <th className="py-3 px-4 text-left text-sm font-bold uppercase">Description</th>
                      <th className="py-3 px-4 text-center text-sm font-bold uppercase">HSN</th>
                      <th className="py-3 px-4 text-center text-sm font-bold uppercase">Qty</th>
                      <th className="py-3 px-4 text-right text-sm font-bold uppercase">Price</th>
                      <th className="py-3 px-4 text-right text-sm font-bold uppercase">Total</th>
                  </tr>
              </thead>
              <tbody>
                  {items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-200">
                          <td className="py-4 px-4 text-sm">{item.description}</td>
                          <td className="py-4 px-4 text-center text-sm text-slate-500">{item.hsn}</td>
                          <td className="py-4 px-4 text-center text-sm">{item.quantity}</td>
                          <td className="py-4 px-4 text-right text-sm">{formatCurrency(item.price)}</td>
                          <td className="py-4 px-4 text-right text-sm font-medium">{formatCurrency(calculateItemTotal(item.quantity, item.price))}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          <div className="flex justify-between items-start mb-12 print:mb-4">
              <div className="w-1/2">
                  <p className="text-sm text-slate-500 font-bold mb-1">Amount in Words:</p>
                  <p className="text-sm italic bg-slate-50 p-2 rounded border border-slate-100 print:bg-transparent print:border-none">{amountInWords}</p>
              </div>
              <div className="w-1/2 md:w-1/3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-bold">{formatCurrency(subTotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">Total GST</span>
                      <span className="font-bold">{formatCurrency(taxBreakdown.totalTax)}</span>
                  </div>
                  <div className="flex justify-between py-4 text-xl font-bold text-[#1e293b]">
                      <span>Total</span>
                      <span>{formatCurrency(totalAmount)}</span>
                  </div>
              </div>
          </div>

          <div className="flex justify-between items-end mt-auto pb-4 page-break-inside-avoid">
               <div className="w-2/3 text-xs text-slate-500 pr-4">
                   <div className="mb-4">
                       <PaymentQRCode />
                   </div>
                   <h4 className="font-bold uppercase text-slate-800 mb-1">Terms & Conditions</h4>
                   <p className="whitespace-pre-line">{details.terms}</p>
               </div>
               <div className="flex flex-col items-center w-1/3">
                    <div className="flex gap-4 mb-2 items-end justify-center w-full h-24">
                       {company.sealUrl && <img src={company.sealUrl} alt="Seal" className="h-20 w-20 object-contain opacity-80" />}
                       {company.signatureUrl && <img src={company.signatureUrl} alt="Signature" className="h-16 w-32 object-contain" />}
                    </div>
                    {(company.signatureUrl || company.sealUrl) && <p className="text-xs font-bold uppercase border-t border-slate-300 pt-1 w-full text-center">Authorized Signatory</p>}
               </div>
          </div>
        </div>
      )}

      {/* --- TEMPLATE 2: OFFICIAL GST --- */}
      {template === TemplateStyle.OFFICIAL_GST && (
        <div className="w-full min-h-full bg-white p-6 font-mono text-xs border border-black leading-tight text-black relative print:p-0 print:border-none">
           <h1 className="text-center font-bold text-lg mb-1 underline uppercase">{details.documentTitle}</h1>
           <div className="border border-black flex">
              <div className="w-1/2 border-r border-black p-2">
                  <div className="flex flex-col items-start mb-2">
                    {company.logoUrl && <img src={company.logoUrl} className="h-12 object-contain mb-1" />}
                    <h2 className="font-bold text-lg">{company.name}</h2>
                  </div>
                  <p>{company.address}</p>
                  <p>GSTIN/UIN: {company.gstin}</p>
                  <p>Email: {company.email}</p>
              </div>
              <div className="w-1/2 p-2">
                  <div className="flex justify-between mb-1">
                      <span>No:</span>
                      <span className="font-bold">{details.number}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                      <span>Date:</span>
                      <span className="font-bold">{formatDate(details.date)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                      <span>Payment Terms:</span>
                      <span className="font-bold">{details.paymentTerms}</span>
                  </div>
              </div>
           </div>

           <div className="border-x border-b border-black p-2">
               <p className="font-bold underline mb-1">Consignee / Billed To:</p>
               <h3 className="font-bold">{client.companyName || client.name}</h3>
               <p>{client.address}</p>
               <p>GSTIN/UIN: {client.gstin}</p>
           </div>

           <table className="w-full border-x border-b border-black">
              <thead>
                  <tr className="border-b border-black bg-gray-100 print:bg-gray-100">
                      <th className="border-r border-black px-1 py-2 w-10">Sl.</th>
                      <th className="border-r border-black px-1 py-2 text-left">Description of Goods</th>
                      <th className="border-r border-black px-1 py-2 w-20">HSN/SAC</th>
                      <th className="border-r border-black px-1 py-2 w-16">Qty</th>
                      <th className="border-r border-black px-1 py-2 w-20">Rate</th>
                      <th className="border-r border-black px-1 py-2 w-16">GST %</th>
                      <th className="px-1 py-2 w-24 text-right">Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {items.map((item, idx) => (
                      <tr key={item.id} className="border-b border-black last:border-b-0 h-10">
                           <td className="border-r border-black px-1 py-1 text-center align-top">{idx + 1}</td>
                           <td className="border-r border-black px-1 py-1 align-top">{item.description}</td>
                           <td className="border-r border-black px-1 py-1 text-center align-top">{item.hsn}</td>
                           <td className="border-r border-black px-1 py-1 text-center align-top">{item.quantity}</td>
                           <td className="border-r border-black px-1 py-1 text-right align-top">{item.price.toFixed(2)}</td>
                           <td className="border-r border-black px-1 py-1 text-center align-top">{item.gstRate}%</td>
                           <td className="px-1 py-1 text-right align-top">{calculateItemTotal(item.quantity, item.price).toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
           </table>

           <div className="border-x border-b border-black flex page-break-inside-avoid">
               <div className="w-2/3 border-r border-black p-2 flex flex-col justify-between">
                   <div>
                      <p className="mb-2">Amount (in words): <span className="font-bold italic">{amountInWords}</span></p>
                      <div className="mt-2">
                          <p className="font-bold underline">Bank Details</p>
                          <p>UPI ID: {company.upiId || 'N/A'}</p>
                      </div>
                   </div>
                   
                   <div className="mt-4 flex gap-4">
                       <PaymentQRCode />
                       <div className="text-[10px] flex-1">
                           <p className="font-bold">Terms & Conditions:</p>
                           <p className="whitespace-pre-wrap">{details.terms}</p>
                       </div>
                   </div>
               </div>
               <div className="w-1/3">
                   <div className="flex justify-between px-2 py-1 border-b border-black">
                       <span>Taxable Value</span>
                       <span>{subTotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between px-2 py-1 border-b border-black">
                       <span>Total GST</span>
                       <span>{taxBreakdown.totalTax.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between px-2 py-2 font-bold text-sm bg-gray-200 print:bg-gray-200">
                       <span>Total Amount</span>
                       <span>{totalAmount.toFixed(2)}</span>
                   </div>
                    <div className="p-2 h-auto min-h-[100px] flex flex-col justify-end items-center text-center relative">
                       <div className="flex gap-2 items-center mb-2 justify-center h-16 w-full">
                            {company.sealUrl && <img src={company.sealUrl} className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-16 opacity-70" alt="Seal" />}
                            {company.signatureUrl && <img src={company.signatureUrl} className="h-12 object-contain relative z-10" alt="Sign" />}
                       </div>
                       <p className="font-bold">For {company.name}</p>
                       <p className="text-[10px]">Authorized Signatory</p>
                   </div>
               </div>
           </div>
        </div>
      )}

      {/* --- TEMPLATE 3: MINIMAL --- */}
      {template === TemplateStyle.MINIMAL && (
          <div className="w-full min-h-full bg-white p-12 font-sans text-gray-700 print:p-0">
              <div className={`flex items-baseline border-b pb-8 mb-8 ${company.logoPosition === 'center' ? 'flex-col items-center' : (company.logoPosition === 'right' ? 'flex-row-reverse justify-between' : 'justify-between')}`}>
                  <h1 className="text-2xl font-light tracking-wide uppercase text-gray-400">{details.documentTitle}</h1>
                  <div className="flex flex-col items-end">
                    {company.logoUrl && <img src={company.logoUrl} className="h-12 w-auto mt-2 mb-1" alt="Logo"/>}
                    <h2 className="font-bold text-black">{company.name}</h2>
                  </div>
              </div>

              <div className="flex gap-16 mb-12">
                  <div className="flex-1">
                      <h3 className="font-medium text-black mb-4">Invoiced To</h3>
                      <p className="font-light">{client.companyName || client.name}</p>
                      <p className="font-light text-sm">{client.address}</p>
                      <p className="font-light text-sm mt-2">GST: {client.gstin}</p>
                  </div>
                  <div className="flex-1">
                      <h3 className="font-medium text-black mb-4">Pay To</h3>
                      <p className="font-light">{company.name}</p>
                      <p className="font-light text-sm">{company.address}</p>
                      <p className="font-light text-sm mt-2">GST: {company.gstin}</p>
                  </div>
                  <div className="flex-1 text-right">
                      <p className="mb-2"><span className="text-gray-400">No.</span> {details.number}</p>
                      <p className="mb-2"><span className="text-gray-400">Date</span> {formatDate(details.date)}</p>
                      {details.paymentTerms && <p className="mb-2 text-sm"><span className="text-gray-400">Terms</span> {details.paymentTerms}</p>}
                  </div>
              </div>

              <table className="w-full mb-12">
                  <thead>
                      <tr className="text-left text-sm text-gray-400 border-b">
                          <th className="pb-4 font-normal">Item</th>
                          <th className="pb-4 font-normal text-center">Qty</th>
                          <th className="pb-4 font-normal text-right">Price</th>
                          <th className="pb-4 font-normal text-right">Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      {items.map(item => (
                          <tr key={item.id} className="border-b last:border-b-0">
                              <td className="py-4">
                                  <p className="text-black font-medium">{item.description}</p>
                                  <p className="text-xs text-gray-400">HSN: {item.hsn}</p>
                              </td>
                              <td className="py-4 text-center">{item.quantity}</td>
                              <td className="py-4 text-right">{formatCurrency(item.price)}</td>
                              <td className="py-4 text-right">{formatCurrency(calculateItemTotal(item.quantity, item.price))}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>

              <div className="flex justify-end mb-12">
                  <table className="w-1/3">
                      <tbody>
                          <tr>
                              <td className="py-2 text-right text-sm text-gray-500">Subtotal</td>
                              <td className="py-2 text-right font-medium">{formatCurrency(subTotal)}</td>
                          </tr>
                          <tr>
                              <td className="py-2 text-right text-sm text-gray-500">Tax</td>
                              <td className="py-2 text-right font-medium">{formatCurrency(taxBreakdown.totalTax)}</td>
                          </tr>
                          <tr className="border-t">
                              <td className="py-4 text-right text-lg text-black">Total</td>
                              <td className="py-4 text-right text-lg font-bold">{formatCurrency(totalAmount)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              <div className="text-right mb-12 text-sm text-gray-500">
                  <p>{amountInWords}</p>
              </div>

               <div className="flex justify-between items-end border-t pt-8 page-break-inside-avoid">
                  <div className="text-xs text-gray-400">
                      <div className="mb-4">
                        <PaymentQRCode />
                      </div>
                      <p className="font-bold text-gray-600">Terms</p>
                      <p>{details.terms}</p>
                  </div>
                  <div className="flex items-center gap-4">
                      
                      <div className="text-right flex flex-col items-end">
                        <div className="h-20 flex items-end justify-end relative w-40 mb-2">
                             {company.sealUrl && <img src={company.sealUrl} className="absolute right-10 bottom-0 h-20 opacity-60" alt="Seal"/>}
                             {company.signatureUrl && <img src={company.signatureUrl} className="h-16 w-auto relative z-10" alt="Sign"/>}
                        </div>
                        <p className="text-xs font-bold uppercase">Authorized Signatory</p>
                      </div>
                  </div>
               </div>
          </div>
      )}

      {/* --- TEMPLATE 4: BOLD --- */}
      {template === TemplateStyle.BOLD && (
          <div className="w-full min-h-full bg-white p-10 font-sans text-black print:p-0">
              <div className="bg-black text-white p-8 mb-8 print:bg-black print:text-white">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h1 className="text-6xl font-black tracking-tighter uppercase">{details.documentTitle}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold">#{details.number}</p>
                        <p className="opacity-70">{formatDate(details.date)}</p>
                    </div>
                  </div>
              </div>

              <div className="flex justify-between mb-16 px-4">
                  <div>
                      <p className="text-sm font-bold uppercase tracking-wider mb-2 border-b-2 border-black inline-block">From</p>
                      {company.logoUrl && <img src={company.logoUrl} className="h-16 object-contain mb-2 block" alt="Logo" />}
                      <h2 className="text-2xl font-bold">{company.name}</h2>
                      <p>{company.address}</p>
                      <p className="text-sm mt-1">GST: {company.gstin}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-sm font-bold uppercase tracking-wider mb-2 border-b-2 border-black inline-block">To</p>
                      <h2 className="text-2xl font-bold">{client.companyName || client.name}</h2>
                      <p>{client.address}</p>
                      <p className="text-sm mt-1">GST: {client.gstin}</p>
                  </div>
              </div>

              <div className="px-4">
                <table className="w-full mb-8">
                    <thead className="border-b-4 border-black">
                        <tr>
                            <th className="text-left py-2 font-black text-xl uppercase">Item</th>
                            <th className="text-center py-2 font-black text-xl uppercase">Qty</th>
                            <th className="text-right py-2 font-black text-xl uppercase">Rate</th>
                            <th className="text-right py-2 font-black text-xl uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b border-gray-200">
                                <td className="py-4 text-lg font-medium">{item.description}</td>
                                <td className="py-4 text-center text-lg">{item.quantity}</td>
                                <td className="py-4 text-right text-lg">{formatCurrency(item.price)}</td>
                                <td className="py-4 text-right text-lg font-bold">{formatCurrency(calculateItemTotal(item.quantity, item.price))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>

              <div className="flex justify-between px-4 items-end page-break-inside-avoid">
                  <div className="w-1/3">
                      <p className="font-bold mb-2">Total In Words</p>
                      <p className="italic mb-6">{amountInWords}</p>
                      {details.paymentTerms && <p className="text-sm mb-4 font-bold">Terms: {details.paymentTerms}</p>}
                      <PaymentQRCode />
                      
                      <div className="mt-8 flex items-center gap-2">
                           {company.sealUrl && <img src={company.sealUrl} className="h-16 opacity-70" alt="Seal" />}
                           {company.signatureUrl && <img src={company.signatureUrl} className="h-12" alt="Sign" />}
                      </div>
                  </div>
                  <div className="w-1/2 bg-gray-100 p-6 rounded-lg print:bg-gray-100">
                      <div className="flex justify-between mb-2 text-lg">
                          <span>Subtotal</span>
                          <span>{formatCurrency(subTotal)}</span>
                      </div>
                      <div className="flex justify-between mb-4 text-lg">
                          <span>GST</span>
                          <span>{formatCurrency(taxBreakdown.totalTax)}</span>
                      </div>
                      <div className="flex justify-between pt-4 border-t-2 border-black text-2xl font-black">
                          <span>TOTAL</span>
                          <span>{formatCurrency(totalAmount)}</span>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TEMPLATE 5: CORPORATE --- */}
      {template === TemplateStyle.CORPORATE && (
          <div className="w-full min-h-full bg-white flex flex-row print:flex-row print:w-full">
              <div className={`w-1/3 bg-[#2d3748] text-white p-8 flex flex-col justify-between print:bg-[#2d3748] print:text-white ${company.logoPosition === 'center' ? 'items-center text-center' : (company.logoPosition === 'right' ? 'items-end text-right' : 'items-start text-left')}`}>
                  <div className="w-full">
                      {company.logoUrl && <img src={company.logoUrl} className="w-32 mb-4 bg-white p-2 rounded inline-block" alt="Logo"/>}
                      <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">{company.name}</h2>
                      
                      <h1 className="text-xl font-light mb-8 uppercase text-gray-300">{details.documentTitle}</h1>
                      
                      <div className="mb-8">
                          <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">From</h3>
                          <p className="font-semibold">{company.name}</p>
                          <p className="text-sm text-gray-300">{company.address}</p>
                          <p className="text-sm text-gray-300 mt-2">GSTIN: {company.gstin}</p>
                      </div>

                      <div>
                          <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">To</h3>
                          <p className="font-semibold">{client.companyName || client.name}</p>
                          <p className="text-sm text-gray-300">{client.address}</p>
                          <p className="text-sm text-gray-300 mt-2">GSTIN: {client.gstin}</p>
                      </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-auto w-full">
                      <p>{company.email}</p>
                      <p>{company.phone}</p>
                      <div className="mt-4 bg-white p-2 w-fit rounded text-black inline-block">
                          <PaymentQRCode />
                      </div>
                  </div>
              </div>

              <div className="w-2/3 p-8 flex flex-col">
                  <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
                       <div>
                           <p className="text-xs uppercase text-gray-500">Date</p>
                           <p className="font-semibold">{formatDate(details.date)}</p>
                       </div>
                       <div className="text-right">
                           <p className="text-xs uppercase text-gray-500">Invoice No</p>
                           <p className="text-xl font-bold text-[#2d3748]">{details.number}</p>
                       </div>
                  </div>

                  <div className="flex-grow">
                      <table className="w-full">
                          <thead className="bg-gray-50 print:bg-gray-100">
                              <tr>
                                  <th className="text-left py-2 px-2 text-xs uppercase text-gray-500">Description</th>
                                  <th className="text-center py-2 px-2 text-xs uppercase text-gray-500">Qty</th>
                                  <th className="text-right py-2 px-2 text-xs uppercase text-gray-500">Price</th>
                                  <th className="text-right py-2 px-2 text-xs uppercase text-gray-500">Total</th>
                              </tr>
                          </thead>
                          <tbody>
                              {items.map(item => (
                                  <tr key={item.id} className="border-b border-gray-100">
                                      <td className="py-3 px-2">
                                          <p className="font-medium text-gray-800">{item.description}</p>
                                      </td>
                                      <td className="py-3 px-2 text-center text-gray-600">{item.quantity}</td>
                                      <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(item.price)}</td>
                                      <td className="py-3 px-2 text-right font-medium text-gray-800">{formatCurrency(calculateItemTotal(item.quantity, item.price))}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="mt-8 page-break-inside-avoid">
                      <div className="flex justify-end gap-12 border-t pt-4">
                          <div className="text-right">
                              <p className="text-gray-500 mb-1">Subtotal</p>
                              <p className="text-gray-500 mb-2">Total Tax</p>
                              <p className="text-xl font-bold text-[#2d3748]">Grand Total</p>
                          </div>
                          <div className="text-right">
                              <p className="font-medium mb-1">{formatCurrency(subTotal)}</p>
                              <p className="font-medium mb-2">{formatCurrency(taxBreakdown.totalTax)}</p>
                              <p className="text-xl font-bold text-[#2d3748]">{formatCurrency(totalAmount)}</p>
                          </div>
                      </div>
                      <div className="mt-4 text-right text-sm text-gray-500 italic">
                          {amountInWords}
                      </div>
                      {details.paymentTerms && <div className="mt-4 text-right text-xs text-gray-500">
                          <span className="font-bold">Payment Terms:</span> {details.paymentTerms}
                      </div>}
                      
                      <div className="mt-8 flex justify-end gap-4 items-end">
                           {company.sealUrl && <img src={company.sealUrl} className="h-16 w-16 opacity-70 object-contain" alt="Seal" />}
                           {company.signatureUrl && <div className="flex flex-col items-center">
                                <img src={company.signatureUrl} className="h-12 object-contain" alt="Sign" />
                                <span className="text-[10px] border-t border-gray-300 mt-1">Authorized Signatory</span>
                           </div>}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
    </>
  );
};