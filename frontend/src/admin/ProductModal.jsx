import React, { useState, useEffect, useRef } from 'react';
import VariantManager from './VariantManager';

export default function ProductModal({ product: initialProduct, adminKey, onClose, onSuccess, onRefresh }) {
  const [product, setProduct] = useState(initialProduct);
  const isEditing = !!product;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [imageUrls, setImageUrls] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    collection: '',
    stock: '',
    is_active: true
  });

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    if (product) {
      const defaultVariant = (product.variants || []).find((variant) =>
        String(variant?.size || '').trim().toUpperCase() === 'ONE SIZE'
      );

      const defaultStock = Number(defaultVariant?.stock ?? 0);

      setFormData({
        name: product.name || '',
        description: product.description || '',
        base_price: product.base_price || '',
        collection: product.collection || '',
        stock: defaultVariant ? String(defaultStock) : '',
        is_active: product.is_active ?? true
      });
      setImageUrls(product.image_urls || []);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please select an image file');
      return;
    }

    setUploading(true);
    
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      const res = await fetch('/api/admin/upload-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` },
        body: uploadData
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload media');
      
      setImageUrls(prev => [...prev, json.url]);
    } catch (err) {
      window.alert(`UPLOAD ERROR: ${err.message}`);
    } finally {
      setUploading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isEditing ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` },
        body: JSON.stringify({
          ...formData,
          base_price: parseFloat(formData.base_price) || 0,
          stock: formData.stock === '' ? 0 : parseInt(formData.stock, 10),
          image_urls: imageUrls
        })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Failed to save product');
      
      if (!isEditing) {
        const savedProduct = json.data;
        setProduct(savedProduct);
        window.alert("Product saved. You can now add stock and variants.");
        onSuccess(savedProduct);
      } else {
        onSuccess(product);
        onClose();
      }
    } catch (err) {
      window.alert(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#2C1414]/90 flex items-center justify-center p-4 backdrop-blur-sm font-sans">
      <div className="bg-[#2C1414] border-[1px] border-[#EAEAEA]/20 w-full max-w-3xl max-h-[90dvh] overflow-y-auto flex flex-col shadow-2xl">
        
        <div className="sticky top-0 bg-[#2C1414] border-b-[1px] border-[#EAEAEA]/20 p-6 flex justify-between items-center z-10">
          <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]">
            {isEditing ? `EDITING: ${product.name}` : 'NEW ARCHIVE REGISTRATION'}
          </h2>
          <button onClick={onClose} className="text-[#EAEAEA]/50 hover:text-[#EAEAEA] transition-colors text-xl leading-none">&times;</button>
        </div>

        <div className="p-8 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">PRODUCT NAME</label>
              <input required name="name" value={formData.name} onChange={handleChange} className="bg-transparent border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA]" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">DESCRIPTION</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="bg-transparent border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA] resize-none" />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">BASE PRICE (₦)</label>
                <input required type="number" min="0" name="base_price" value={formData.base_price} onChange={handleChange} className="bg-transparent border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA]" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">COLLECTION</label>
                <input name="collection" value={formData.collection} onChange={handleChange} className="bg-transparent border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA]" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">AVAILABLE STOCK</label>
              <input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} className="bg-transparent border-[1px] border-[#EAEAEA]/20 p-3 text-[10px] tracking-widest uppercase text-[#EAEAEA] focus:outline-none focus:border-[#EAEAEA]" placeholder="0" />
              <p className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">This saves stock to the default inventory variant for the product.</p>
            </div>

            {/* PRODUCT MEDIA SECTION */}
            <div className="flex flex-col gap-4 mt-2">
              <label className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">PRODUCT MEDIA</label>
              <div className="flex flex-wrap gap-4 items-center">
                
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-32 border-[1px] border-[#EAEAEA]/20 group overflow-hidden">
                    <img src={url} alt="Product media preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-[#2C1414]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-[10px] text-red-400 font-medium tracking-widest uppercase">REMOVE</span>
                    </button>
                  </div>
                ))}

                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`w-24 h-32 border-[1px] border-dashed border-[#EAEAEA]/40 flex flex-col items-center justify-center text-center p-2 transition-colors
                    ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#EAEAEA]/5'}
                  `}
                >
                  <span className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/60">
                    {uploading ? 'UPLOADING...' : '+ UPLOAD IMAGE'}
                  </span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

              </div>
            </div>

            {!isEditing && (
              <label className="flex items-center gap-4 cursor-pointer mt-4">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="accent-[#EAEAEA]" />
                <span className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/70">SET ACTIVE IMMEDIATELY</span>
              </label>
            )}

            <button type="submit" disabled={loading} className="mt-4 border-[1px] border-[#EAEAEA] py-4 text-[10px] tracking-widest uppercase hover:bg-[#EAEAEA] hover:text-[#2C1414] transition-colors font-medium disabled:opacity-50">
              {loading ? 'EXECUTING...' : (isEditing ? 'COMMIT CHANGES' : 'INITIALIZE PRODUCT')}
            </button>
          </form>

          {isEditing ? (
            <VariantManager 
              productId={product.id} 
              variants={product.variants || []} 
              adminKey={adminKey} 
              onVariantUpdate={() => {
                if (onRefresh) onRefresh();
              }} 
            />
          ) : (
            <div className="mt-8 border-2 border-dashed border-stunna-text/30 p-8 text-center text-stunna-text/50 text-xs font-bold uppercase tracking-widest">
              ⚠️ SAVE THIS PRODUCT FIRST TO UNLOCK STOCK & VARIANT MANAGEMENT.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
