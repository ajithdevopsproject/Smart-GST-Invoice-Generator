import React, { useState } from 'react';
import { InvoiceData, LineItem, TemplateStyle } from '../types';
import { Plus, Trash2, Upload, Loader2, Sparkles, Printer, Copy, Share2, Mail, MessageCircle, Download, Save, AlignLeft, AlignCenter, AlignRight, X, FilePlus } from 'lucide-react';

interface Props {
  data: InvoiceData;
  setData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  selectedTemplate: TemplateStyle;
  setTemplate: (t: TemplateStyle) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAnalyzing: boolean;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onSaveSettings: () => void;
  onWhatsAppShare: () => void;
  onEmailShare: () => void;
  onSaveAndNew: () => void;
}

export const InvoiceForm: React.FC<Props> = ({ 
  data, setData, selectedTemplate, setTemplate, onImageUpload, isAnalyzing, onPrint, onDownloadPDF, onSaveSettings, onWhatsAppShare, onEmailShare, onSaveAndNew
}) => {
  
  const handleCompanyChange = (field: string, value: string | null) => {
    setData(prev => ({ ...prev, company: { ...prev.company, [field]: value } }));
  };

  const handleClientChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, client: { ...prev.client, [field]: value } }));
  };

  const handleDetailsChange = (field: string, value: string) => {
    setData(prev => ({ ...prev, details: { ...prev.details, [field]: value } }));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Math.random().toString(), description: '', hsn: '', quantity: 1, price: 0, gstRate: 18 }
      ]
    }));
  };

  const duplicateItem = (index: number) => {
    const itemToCopy = data.items[index];
    const newItem = { ...itemToCopy, id: Math.random().toString() };
    const newItems = [...data.items];
    newItems.splice(index + 1, 0, newItem);
    setData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'signatureUrl' | 'sealUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
          alert("Image is too large. Please upload an image smaller than 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleCompanyChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'logoUrl' | 'signatureUrl' | 'sealUrl') => {
      handleCompanyChange(field, null);
  }

  return (
    <div className="h-full p-6 bg-slate-50 border-r border-slate-200 relative">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-800">Edit Details</h2>
        <div className="flex gap-2">
            <button 
                onClick={onSaveSettings} 
                className="px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md text-sm font-medium border border-indigo-200 flex items-center gap-2 transition-colors"
                title="Save current details (including Logo, Sig, Seal) as defaults for future use"
            >
               <Save className="w-4 h-4" /> Save Defaults
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span className="hidden sm:inline">Auto-Fill</span>
                <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" disabled={isAnalyzing} />
            </label>
        </div>
      </div>

       {/* Print / Download / Share */}
       <div className="grid grid-cols-2 gap-2 mb-6">
          <button onClick={onSaveAndNew} className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                <FilePlus className="w-4 h-4" /> Save & New Invoice
          </button>
          <button onClick={onPrint} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm">
                <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={onDownloadPDF} className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Save PDF
          </button>
          <button onClick={onWhatsAppShare} className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm">
              <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={onEmailShare} className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <Mail className="w-4 h-4" /> Email
          </button>
      </div>
      
      <p className="text-xs text-slate-400 text-center mb-6">
         <strong>Mobile:</strong> Attaches PDF automatically.<br/>
         <strong>Desktop:</strong> Downloads PDF, then you attach it.
      </p>

      <div className="space-y-8">
        
        {/* Document Settings */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Document Type</label>
                    <select 
                        value={data.details.documentTitle} 
                        onChange={(e) => handleDetailsChange('documentTitle', e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="TAX INVOICE">Tax Invoice</option>
                        <option value="QUOTATION">Quotation</option>
                        <option value="ESTIMATE">Estimate</option>
                        <option value="PROFORMA INVOICE">Proforma Invoice</option>
                        <option value="BILL OF SUPPLY">Bill of Supply</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Invoice / Ref No.</label>
                    <input type="text" value={data.details.number} onChange={e => handleDetailsChange('number', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                     <input type="date" value={data.details.date} onChange={e => handleDetailsChange('date', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                 <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                     <input type="date" value={data.details.dueDate} onChange={e => handleDetailsChange('dueDate', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
             </div>
        </section>

        {/* Template Selection */}
        <section>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Select Template</h3>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((id) => (
              <button
                key={id}
                onClick={() => setTemplate(id)}
                className={`h-10 rounded-md border text-xs font-medium transition-all ${
                  selectedTemplate === id 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Style {id}
              </button>
            ))}
          </div>
        </section>

        {/* Company Details */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            Company Details (Bill From)
          </h3>
          <div className="grid gap-3">
             <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                    <input type="text" value={data.company.name} onChange={e => handleCompanyChange('name', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">GSTIN</label>
                     <input type="text" value={data.company.gstin} onChange={e => handleCompanyChange('gstin', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">UPI ID (For QR)</label>
                     <input type="text" value={data.company.upiId || ''} onChange={e => handleCompanyChange('upiId', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="example@upi" />
                </div>
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                <textarea rows={2} value={data.company.address} onChange={e => handleCompanyChange('address', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
             </div>
             <div className="grid grid-cols-2 gap-3">
                 <input type="email" placeholder="Email" value={data.company.email} onChange={e => handleCompanyChange('email', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                 <input type="text" placeholder="Phone" value={data.company.phone} onChange={e => handleCompanyChange('phone', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
             </div>
             
             {/* Uploads & Logo Position */}
             <div className="mt-4 space-y-4 border-t pt-4">
                
                {/* Logo Upload */}
                <div className="flex gap-4 items-start">
                    <div className="flex-grow">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Company Logo</label>
                         {!data.company.logoUrl ? (
                            <label className="flex flex-col items-center justify-center p-4 border border-dashed rounded cursor-pointer hover:bg-slate-50 transition-colors bg-white">
                                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                <span className="text-[10px] text-slate-500">Upload Logo</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                            </label>
                         ) : (
                             <div className="relative border rounded p-2 bg-white flex justify-center">
                                 <img src={data.company.logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                                 <button onClick={() => removeImage('logoUrl')} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow hover:bg-red-200"><X className="w-3 h-3" /></button>
                             </div>
                         )}
                    </div>
                    <div className="w-24 shrink-0">
                         <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
                         <div className="flex bg-slate-100 rounded p-1 gap-1">
                            <button 
                                onClick={() => handleCompanyChange('logoPosition', 'left')} 
                                className={`flex-1 flex justify-center py-1 rounded text-xs ${data.company.logoPosition === 'left' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                <AlignLeft className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={() => handleCompanyChange('logoPosition', 'center')} 
                                className={`flex-1 flex justify-center py-1 rounded text-xs ${data.company.logoPosition === 'center' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                <AlignCenter className="w-3 h-3" />
                            </button>
                            <button 
                                onClick={() => handleCompanyChange('logoPosition', 'right')} 
                                className={`flex-1 flex justify-center py-1 rounded text-xs ${data.company.logoPosition === 'right' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                            >
                                <AlignRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     {/* Signature Upload */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Authorized Signature</label>
                        {!data.company.signatureUrl ? (
                            <label className="flex flex-col items-center justify-center p-4 border border-dashed rounded cursor-pointer hover:bg-slate-50 transition-colors bg-white h-24">
                                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                <span className="text-[10px] text-slate-500">Upload Signature</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signatureUrl')} />
                            </label>
                        ) : (
                            <div className="relative border rounded p-2 bg-white flex justify-center h-24 items-center">
                                <img src={data.company.signatureUrl} alt="Signature Preview" className="h-full object-contain" />
                                <button onClick={() => removeImage('signatureUrl')} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow hover:bg-red-200"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>

                    {/* Seal Upload */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Company Seal</label>
                        {!data.company.sealUrl ? (
                            <label className="flex flex-col items-center justify-center p-4 border border-dashed rounded cursor-pointer hover:bg-slate-50 transition-colors bg-white h-24">
                                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                                <span className="text-[10px] text-slate-500">Upload Seal</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'sealUrl')} />
                            </label>
                        ) : (
                            <div className="relative border rounded p-2 bg-white flex justify-center h-24 items-center">
                                <img src={data.company.sealUrl} alt="Seal Preview" className="h-full object-contain" />
                                <button onClick={() => removeImage('sealUrl')} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow hover:bg-red-200"><X className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </div>
        </section>

        {/* Client Details */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Client Details (Bill To)</h3>
          <div className="grid gap-3">
             <input type="text" placeholder="Client / Company Name" value={data.client.companyName} onChange={e => handleClientChange('companyName', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
             <input type="text" placeholder="GSTIN" value={data.client.gstin} onChange={e => handleClientChange('gstin', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
             <textarea rows={2} placeholder="Address" value={data.client.address} onChange={e => handleClientChange('address', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
             <input type="email" placeholder="Email (for sharing)" value={data.client.email} onChange={e => handleClientChange('email', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </section>

        {/* Additional Info */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
             <div className="mb-3">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Payment Terms</label>
                 <textarea rows={2} value={data.details.paymentTerms} onChange={e => handleDetailsChange('paymentTerms', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Net 30 Days" />
             </div>
             <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Terms & Conditions</label>
                 <textarea rows={4} value={data.details.terms} onChange={e => handleDetailsChange('terms', e.target.value)} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
             </div>
        </section>

        {/* Line Items */}
        <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-800 mb-4">Items</h3>
           <div className="space-y-3">
              {data.items.map((item, index) => (
                  <div key={item.id} className="flex gap-2 items-start bg-slate-50 p-3 rounded border border-slate-100 group hover:border-indigo-100 transition-colors">
                      <div className="flex-grow grid grid-cols-12 gap-2">
                          <div className="col-span-12 mb-1 md:mb-0 md:col-span-5">
                             <input 
                                className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                placeholder="Description" 
                                value={item.description} 
                                onChange={(e) => updateItem(index, 'description', e.target.value)} 
                             />
                          </div>
                          <div className="col-span-6 md:col-span-2">
                             <input 
                                className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                placeholder="HSN" 
                                value={item.hsn} 
                                onChange={(e) => updateItem(index, 'hsn', e.target.value)} 
                             />
                          </div>
                          <div className="col-span-6 md:col-span-2">
                             <input 
                                className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                type="number" 
                                placeholder="Qty" 
                                value={item.quantity} 
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} 
                             />
                          </div>
                          <div className="col-span-6 md:col-span-3">
                             <input 
                                className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                type="number" 
                                placeholder="Price" 
                                value={item.price} 
                                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} 
                             />
                          </div>
                          <div className="col-span-6 md:col-span-12 flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">GST%</span>
                              <input 
                                className="w-20 p-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                type="number" 
                                value={item.gstRate} 
                                onChange={(e) => updateItem(index, 'gstRate', parseFloat(e.target.value) || 0)} 
                              />
                          </div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <button onClick={() => removeItem(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                         </button>
                         <button onClick={() => duplicateItem(index)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Duplicate">
                            <Copy className="w-4 h-4" />
                         </button>
                      </div>
                  </div>
              ))}
              <button onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-slate-300 text-slate-500 rounded hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 flex justify-center items-center gap-2 text-sm font-medium transition-all">
                  <Plus className="w-4 h-4" /> Add Item
              </button>
           </div>
        </section>

      </div>
    </div>
  );
};