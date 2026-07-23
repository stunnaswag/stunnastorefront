import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal';

function SimpleLineChart({ data, color = '#EAEAEA' }) {
  if (!data || data.length === 0) {
    return <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">NO DATA</div>;
  }

  const width = 320;
  const height = 160;
  const padding = 24;
  const maxValue = Math.max(...data.map((point) => point.value || 0), 1);
  const minValue = 0;

  const points = data.map((point, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 min-w-[280px]">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(234,234,234,0.15)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(234,234,234,0.15)" strokeWidth="1" />
        <polyline fill="none" stroke={color} strokeWidth="2" points={points.join(' ')} />
        {data.map((point, index) => {
          const x = padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);
          const y = height - padding - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * (height - padding * 2);
          return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="3.5" fill={color} />;
        })}
      </svg>
    </div>
  );
}

function SimpleBarChart({ data, color = '#EAEAEA' }) {
  if (!data || data.length === 0) {
    return <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">NO DATA</div>;
  }

  const maxValue = Math.max(...data.map((item) => item.value || 0), 1);

  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[9px] tracking-widest text-[#EAEAEA] font-medium">{item.value}</span>
          <div className="w-full flex items-end justify-center rounded-t-sm" style={{ height: '120px' }}>
            <div className="w-full rounded-t-sm" style={{ height: `${Math.max((item.value / maxValue) * 100, 4)}%`, backgroundColor: color }} />
          </div>
          <span className="text-[9px] uppercase tracking-widest text-[#EAEAEA]/50 text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleAreaChart({ series }) {
  if (!series || series.length === 0 || !series[0].data || series[0].data.length === 0) {
    return <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">NO DATA</div>;
  }

  const width = 320;
  const height = 160;
  const padding = 24;
  
  const maxValue = Math.max(...series.flatMap(s => s.data.map(d => d.value || 0)), 1);
  const minValue = 0;
  const dataLength = series[0].data.length;

  return (
    <div className="w-full overflow-x-auto relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 min-w-[280px]">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(234,234,234,0.15)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(234,234,234,0.15)" strokeWidth="1" />
        
        {series.map((s, sIdx) => {
          const color = s.color || '#EAEAEA';
          const points = s.data.map((point, index) => {
            const x = padding + (index / Math.max(dataLength - 1, 1)) * (width - padding * 2);
            const y = height - padding - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * (height - padding * 2);
            return `${x},${y}`;
          });
          const lastX = padding + (dataLength > 1 ? width - padding * 2 : 0);
          const areaPoints = `${padding},${height - padding} ${points.join(' ')} ${lastX},${height - padding}`;

          return (
            <g key={sIdx}>
              <defs>
                <linearGradient id={`gradient-${sIdx}-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill={`url(#gradient-${sIdx}-${color.replace('#','')})`} />
              <polyline fill="none" stroke={color} strokeWidth="2" points={points.join(' ')} />
              {s.data.map((point, index) => {
                const x = padding + (index / Math.max(dataLength - 1, 1)) * (width - padding * 2);
                const y = height - padding - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * (height - padding * 2);
                return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="2.5" fill={color} />;
              })}
            </g>
          );
        })}
      </svg>
      <div className="absolute top-0 right-0 flex gap-4">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
            <span className="text-[8px] uppercase tracking-widest text-[#EAEAEA]">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleDonutChart({ data, colors }) {
  if (!data || data.length === 0) return <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40">NO DATA</div>;
  
  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="flex items-center justify-center w-full h-40 gap-8">
      <svg viewBox="0 0 100 100" className="h-full">
        {data.map((item, i) => {
          const percent = item.value / total;
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += percent * circumference;
          return (
            <circle
              key={item.label}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth="20"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-[10px] tracking-widest uppercase text-[#EAEAEA]">{item.label} ({Math.round((item.value/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardHome({ adminKey, onAuthError }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState(null);
  const [clickGraphDays, setClickGraphDays] = useState(2);

  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminError, setAdminError] = useState(null);

  const handleLowStockClick = async () => {
    if ((summary?.lowStockAlerts || 0) === 0) return;
    setDrilldownOpen(true);
    setLoadingDrilldown(true);
    try {
      const res = await fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` } });
      const json = await res.json();
      if (json.success) {
        const filtered = json.data.filter(p => {
          const totalStock = p.variants ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;
          return totalStock < 5;
        });
        setLowStockProducts(filtered);
      }
    } catch(e) {
      console.error(e);
      setAdminError('Failed to load drilldown data: ' + e.message);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` };

    fetch('/api/admin/summary', { headers })
      .then(res => {
        if (res.status === 401) throw new Error('401');
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(json => {
        if (json.success) setSummary(json.data);
        else throw new Error(json.error || 'Failed to load summary');
      })
      .catch(err => {
        if (err.message === '401') onAuthError();
        else setError(err.message);
      })
      .finally(() => setLoading(false));

    fetch('/api/admin/analytics', { headers })
      .then(res => {
        if (res.status === 401) throw new Error('401');
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(json => {
        if (json.success) setAnalytics(json.data);
        else throw new Error(json.error || 'Failed to load analytics');
      })
      .catch(err => {
        if (err.message === '401') onAuthError();
        else console.error('Failed to load analytics', err);
      })
      .finally(() => setLoadingAnalytics(false));
  }, [adminKey, onAuthError]);

  if (loading) return <div className="text-[10px] tracking-widest uppercase animate-pulse text-[#EAEAEA]/50 mt-8">SYNCING ANALYTICS...</div>;
  if (error) return <div className="text-[10px] tracking-widest uppercase text-red-500 mt-8">{error}</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl">
      <h2 className="text-[10px] tracking-widest uppercase font-medium text-[#EAEAEA]/40 border-b-[1px] border-[#EAEAEA]/10 pb-4">SYSTEM OVERVIEW</h2>
      
      {adminError && (
        <div className="border-[1px] border-red-500/50 p-4 bg-red-500/5 text-red-500 text-[10px] tracking-widest uppercase flex justify-between items-center">
          <span>ERROR: {adminError}</span>
          <button onClick={() => setAdminError(null)} className="hover:opacity-70">DISMISS</button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        <div className="border-[1px] border-[#EAEAEA]/20 p-8 flex flex-col items-center justify-center gap-4 bg-[#2C1414]">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50 text-center">TOTAL PRODUCTS</h3>
          <p className="text-4xl text-[#EAEAEA] font-medium">{summary?.totalProducts || 0}</p>
        </div>

        <div className="border-[1px] border-[#EAEAEA]/20 p-8 flex flex-col items-center justify-center gap-4 bg-[#2C1414]">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50 text-center">ACTIVE CATALOG</h3>
          <p className="text-4xl text-green-500/80 font-medium">{summary?.activeProducts || 0}</p>
        </div>

        <div className="border-[1px] border-[#EAEAEA] p-8 flex flex-col items-center justify-center gap-4 bg-[#EAEAEA]/5 shadow-[0_0_15px_rgba(234,234,234,0.1)]">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA] font-medium text-center">OPEN ORDERS</h3>
          <p className="text-4xl text-[#EAEAEA] font-medium">{summary?.openOrders || 0}</p>
        </div>

        <div 
          onClick={handleLowStockClick}
          className={`border-[1px] ${summary?.lowStockAlerts > 0 ? 'border-red-500 cursor-pointer hover:bg-red-500/10 transition-colors' : 'border-[#EAEAEA]/20'} p-8 flex flex-col items-center justify-center gap-4 bg-[#2C1414]`}
        >
          <h3 className={`text-[10px] tracking-widest uppercase text-center ${summary?.lowStockAlerts > 0 ? 'text-red-500' : 'text-[#EAEAEA]/50'}`}>LOW STOCK ALERTS</h3>
          <p className={`text-4xl font-medium ${summary?.lowStockAlerts > 0 ? 'text-red-500' : 'text-[#EAEAEA]'}`}>{summary?.lowStockAlerts || 0}</p>
        </div>

        <div className="border-[1px] border-[#EAEAEA]/20 p-8 flex flex-col items-center justify-center gap-4 bg-[#2C1414]">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50 text-center">PENDING PAYMENTS</h3>
          <p className="text-4xl text-yellow-500/80 font-medium">{summary?.pendingPayments || 0}</p>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">SALES TREND</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">30D</span>
          </div>
          {loadingAnalytics ? (
            <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40 animate-pulse">LOADING ANALYTICS...</div>
          ) : (
            <SimpleLineChart data={(analytics?.ordersByDay || []).map((item) => ({ label: item.label, value: item.revenue || 0 }))} color="#F9D423" />
          )}
        </div>

        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">PAYMENT MIX</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">STATUS</span>
          </div>
          {loadingAnalytics ? (
            <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40 animate-pulse">LOADING ANALYTICS...</div>
          ) : (
            <SimpleDonutChart 
              data={(analytics?.paymentMix || []).map((item) => ({ label: item.label, value: item.value || 0 }))} 
              colors={['#5BE6AF', '#F9D423', '#F08A5D', '#EAEAEA']} 
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">CLICKS</h3>
          <p className="mt-4 text-4xl font-medium text-[#EAEAEA]">{analytics?.websiteTotals?.uniqueVisitors || 0}</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">LAST 30 DAYS</p>
        </div>
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">WEBSITE VIEWS</h3>
          <p className="mt-4 text-4xl font-medium text-[#EAEAEA]">{analytics?.websiteTotals?.pageViews || 0}</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">LAST 30 DAYS</p>
        </div>
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">CONVERSION RATE</h3>
          <p className="mt-4 text-4xl font-medium text-green-500/80">{analytics?.websiteTotals?.conversionRate || '0'}%</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">LAST 30 DAYS</p>
        </div>
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6">
          <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">WEBSITE CLICKS</h3>
          <p className="mt-4 text-4xl font-medium text-[#EAEAEA]">{analytics?.websiteTotals?.clicks || 0}</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">LAST 30 DAYS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">TRAFFIC OVERVIEW</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setClickGraphDays(2)}
                className={`text-[10px] uppercase tracking-widest transition-colors ${clickGraphDays === 2 ? 'text-blue-400 font-medium' : 'text-[#EAEAEA]/30 hover:text-[#EAEAEA]/60'}`}
              >2D</button>
              <button 
                onClick={() => setClickGraphDays(30)}
                className={`text-[10px] uppercase tracking-widest transition-colors ${clickGraphDays === 30 ? 'text-blue-400 font-medium' : 'text-[#EAEAEA]/30 hover:text-[#EAEAEA]/60'}`}
              >30D</button>
            </div>
          </div>
          {loadingAnalytics ? (
            <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40 animate-pulse">LOADING ANALYTICS...</div>
          ) : (
            <SimpleAreaChart 
              series={[
                {
                  name: 'VIEWS',
                  color: '#F08A5D',
                  data: (analytics?.websiteByDay || []).slice(-clickGraphDays).map(item => ({ label: item.label, value: item.views || 0 }))
                },
                {
                  name: 'CLICKS',
                  color: '#00D8FF',
                  data: (analytics?.websiteByDay || []).slice(-clickGraphDays).map(item => ({ label: item.label, value: item.clicks || 0 }))
                }
              ]} 
            />
          )}
        </div>
        
        <div className="border-[1px] border-[#EAEAEA]/20 bg-[#2C1414] p-6 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50">VIEWS BY DAY</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#EAEAEA]/30">7D</span>
          </div>
          {loadingAnalytics ? (
            <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/40 animate-pulse">LOADING ANALYTICS...</div>
          ) : (
            <SimpleBarChart data={(analytics?.websiteByDay || []).slice(-7).map((item) => ({ label: item.label, value: item.views || 0 }))} color="#5BE6AF" />
          )}
        </div>
      </div>

      {drilldownOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#2C1414] border-[1px] border-[#EAEAEA]/20 w-full max-w-2xl max-h-[80vh] flex flex-col relative">
            <div className="p-6 border-b-[1px] border-[#EAEAEA]/10 flex justify-between items-center">
              <h2 className="text-[10px] tracking-widest uppercase font-medium text-red-500">LOW STOCK DRILLDOWN</h2>
              <button onClick={() => setDrilldownOpen(false)} className="text-[#EAEAEA]/50 hover:text-[#EAEAEA] text-[10px] tracking-widest uppercase">CLOSE</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDrilldown ? (
                <div className="text-[10px] tracking-widest uppercase animate-pulse text-[#EAEAEA]/50 text-center py-12">FETCHING ALERTS...</div>
              ) : lowStockProducts.length === 0 ? (
                <div className="text-[10px] tracking-widest uppercase text-[#EAEAEA]/50 text-center py-12">NO LOW STOCK ITEMS FOUND.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {lowStockProducts.map(p => {
                    const totalStock = p.variants ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;
                    return (
                      <div key={p.id} className="flex justify-between items-center border-[1px] border-[#EAEAEA]/10 p-4 bg-[#EAEAEA]/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] tracking-widest uppercase text-[#EAEAEA] font-medium">{p.name}</span>
                          <span className="text-[10px] tracking-widest uppercase text-red-400">STOCK: {totalStock}</span>
                        </div>
                        <button 
                          onClick={() => { setSelectedProduct(p); setModalOpen(true); setTimeout(() => { document.getElementById('variant-manager')?.scrollIntoView({behavior: 'smooth'}) }, 300); }}
                          className="bg-orange-500/10 text-orange-400 px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-orange-500 hover:text-[#2C1414] transition-colors font-medium"
                        >
                          EDIT STOCK
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductModal 
          product={selectedProduct ? lowStockProducts.find(p => p.id === selectedProduct.id) || selectedProduct : null} 
          adminKey={adminKey} 
          onClose={() => setModalOpen(false)} 
          onSuccess={() => { 
            setModalOpen(false); 
            handleLowStockClick(); // Refresh drilldown
            // Re-fetch summary in background
            fetch('/api/admin/summary', { headers: { 'Authorization': `Bearer ${localStorage.getItem('stunna_admin_token')}` } })
              .then(res => res.json())
              .then(json => { if (json.success) setSummary(json.data); else setAdminError(json.error || 'Failed to update summary'); })
              .catch(err => setAdminError('Background sync failed: ' + err.message));
          }} 
          onRefresh={handleLowStockClick}
        />
      )}
    </div>
  );
}
