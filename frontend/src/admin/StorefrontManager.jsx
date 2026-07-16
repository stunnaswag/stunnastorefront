import React, { useState, useEffect, useRef } from 'react';

export default function StorefrontManager({ adminKey, onAuthError }) {
  const [heroImage, setHeroImage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // New states for Catalog Slideshow
  const [catalogImages, setCatalogImages] = useState([]);
  const [isUploadingCatalog, setIsUploadingCatalog] = useState(false);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);
  const catalogFileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/hero_image').then(res => res.json()),
      fetch('/api/settings/catalog_hero_images').then(res => res.json())
    ])
      .then(([heroData, catalogData]) => {
        if (heroData.value) {
          setHeroImage(heroData.value);
          setPreviewUrl(heroData.value);
        }
        if (catalogData.value) {
          try {
            setCatalogImages(JSON.parse(catalogData.value));
          } catch (e) {
            console.error('Failed to parse catalog images', e);
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch settings', err);
        setError('Failed to load settings');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCatalogUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsUploadingCatalog(true);
    
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
      
      setCatalogImages(prev => [...prev, json.url]);
    } catch (err) {
      setError(`CATALOG UPLOAD ERROR: ${err.message}`);
    } finally {
      setIsUploadingCatalog(false);
      if (catalogFileInputRef.current) catalogFileInputRef.current.value = '';
    }
  };

  const removeCatalogImage = (idx) => {
    setCatalogImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCatalog = async () => {
    setIsSavingCatalog(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/catalog_hero_images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}`
        },
        body: JSON.stringify({ value: JSON.stringify(catalogImages) })
      });
      if (!res.ok) throw new Error('Failed to save catalog slideshow');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingCatalog(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload first.');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/admin/settings/hero/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}`
        },
        // Fetch automatically sets the correct multipart boundary content type when body is FormData
        body: formData
      });

      if (res.status === 401 || res.status === 403) {
        if (onAuthError) onAuthError();
        throw new Error('Authentication failed');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update hero image');
      
      setHeroImage(data.url);
      setSuccess(true);
      setSelectedFile(null); // Clear selected file after successful upload
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-[#EAEAEA]">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl p-8 text-[#EAEAEA]">
      <h2 className="text-2xl font-light mb-8 uppercase tracking-widest border-b border-[#EAEAEA]/20 pb-4">
        Storefront Manager
      </h2>

      <div className="bg-[#2C1414] border border-[#EAEAEA]/20 p-8">
        <h3 className="text-[10px] uppercase tracking-widest font-medium mb-6 opacity-60">Hero Image Configuration</h3>
        
        {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 text-green-400 text-sm">Successfully uploaded and updated hero image!</div>}

        <div className="mb-8">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-96 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group
              ${isDragging ? 'border-[#A31616] bg-[#EAEAEA]/10' : 'border-[#EAEAEA]/50 hover:bg-[#EAEAEA]/5'}
            `}
          >
            {previewUrl ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${previewUrl})` }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest font-medium text-white px-6 py-3 border border-white/30 backdrop-blur-sm">
                    CLICK TO CHANGE IMAGE
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <p className="text-[10px] uppercase tracking-widest font-medium opacity-80">
                  DRAG & DROP IMAGE OR CLICK TO BROWSE
                </p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleUpdate}
          disabled={saving || !selectedFile}
          className="bg-[#EAEAEA] text-[#2C1414] px-8 py-3 text-[10px] uppercase tracking-widest font-medium hover:bg-[#A31616] hover:text-[#EAEAEA] transition-colors disabled:opacity-30 disabled:hover:bg-[#EAEAEA] disabled:hover:text-[#2C1414] disabled:cursor-not-allowed"
        >
          {saving ? 'UPLOADING...' : 'UPDATE HERO IMAGE'}
        </button>
      </div>

      <div className="bg-[#2C1414] border border-[#EAEAEA]/20 p-8 mt-8">
        <h3 className="text-[10px] uppercase tracking-widest font-medium mb-6 opacity-60">Catalog Slideshow</h3>
        
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {catalogImages.map((url, idx) => (
              <div key={idx} className="relative w-24 h-32 border-[1px] border-[#EAEAEA]/20 group overflow-hidden">
                <img src={url} alt={`Catalog Slide ${idx + 1}`} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeCatalogImage(idx)}
                  className="absolute inset-0 bg-[#2C1414]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-[10px] text-red-400 font-medium tracking-widest uppercase">REMOVE</span>
                </button>
              </div>
            ))}
            
            <div 
              onClick={() => !isUploadingCatalog && catalogFileInputRef.current?.click()}
              className={`w-24 h-32 border-[1px] border-dashed border-[#EAEAEA]/40 flex flex-col items-center justify-center text-center p-2 transition-colors
                ${isUploadingCatalog ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#EAEAEA]/5'}
              `}
            >
              <span className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/60">
                {isUploadingCatalog ? 'UPLOADING...' : '+ UPLOAD IMAGE'}
              </span>
            </div>
            <input 
              type="file" 
              ref={catalogFileInputRef} 
              onChange={handleCatalogUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        <button 
          onClick={handleSaveCatalog}
          disabled={isSavingCatalog}
          className="bg-[#EAEAEA] text-[#2C1414] px-8 py-3 text-[10px] uppercase tracking-widest font-medium hover:bg-[#A31616] hover:text-[#EAEAEA] transition-colors disabled:opacity-30 disabled:hover:bg-[#EAEAEA] disabled:hover:text-[#2C1414] disabled:cursor-not-allowed"
        >
          {isSavingCatalog ? 'SAVING...' : 'SAVE SLIDESHOW'}
        </button>
      </div>
    </div>
  );
}
