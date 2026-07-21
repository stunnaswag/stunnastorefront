import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';
import { motion } from 'framer-motion';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { registerRequest, resolveRequest } = useLoading();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const formatShippingAddress = (shippingAddress) => {
    if (!shippingAddress) return 'N/A';
    if (typeof shippingAddress === 'string') return shippingAddress;

    return [shippingAddress.street, shippingAddress.city, shippingAddress.state, shippingAddress.country]
      .filter(Boolean)
      .join(', ');
  };

  useEffect(() => {
    registerRequest();

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Order not found.');
        }
        
        setOrder(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        resolveRequest();
      }
    };

    fetchOrder();
  }, [id, registerRequest, resolveRequest]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-20 md:mt-24 bg-stunna-bg text-stunna-text font-sans">
        <h1 className="text-3xl font-black text-red-500 uppercase tracking-tighter mb-4">ERROR</h1>
        <p className="text-[10px] uppercase tracking-widest text-stunna-text/70">{error}</p>
        <Link to="/" className="mt-8 border-[1px] border-stunna-text py-4 px-8 text-[10px] tracking-widest uppercase hover:bg-stunna-text hover:text-stunna-bg transition-colors">
          RETURN TO HOME
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto mt-20 md:mt-24 bg-stunna-bg text-stunna-text font-sans"
    >
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 border-b-[1px] border-stunna-text pb-6 w-full">
        ORDER STATUS
      </h1>
      
      <div className="w-full flex justify-between items-center text-[10px] uppercase tracking-widest mb-4 border-[1px] border-stunna-text/20 p-4">
        <span className="text-stunna-text/50">ORDER ID:</span>
        <strong className="text-stunna-text">{order.id}</strong>
      </div>

      <div className="w-full grid gap-4 md:grid-cols-2 text-left text-[10px] uppercase tracking-widest mb-6">
        <div className="border-[1px] border-stunna-text/20 p-4">
          <p className="text-stunna-text/50 mb-2">CUSTOMER</p>
          <p className="text-stunna-text">{order.customer_name || 'N/A'}</p>
          <p className="text-stunna-text/70 mt-1">{order.customer_email || 'N/A'}</p>
          <p className="text-stunna-text/70 mt-1">{order.customer_phone || 'N/A'}</p>
        </div>
        <div className="border-[1px] border-stunna-text/20 p-4">
          <p className="text-stunna-text/50 mb-2">SHIPPING ADDRESS</p>
          <p className="text-stunna-text">{formatShippingAddress(order.shipping_address)}</p>
        </div>
      </div>

      <div className="w-full border-[1px] border-stunna-text/20 p-4 text-left text-[10px] uppercase tracking-widest mb-6">
        <p className="text-stunna-text/50 mb-2">SHIPMENT STATUS</p>
        <p className="text-stunna-text font-medium">{order.fulfillment_status || 'pending'}</p>
        <p className="text-stunna-text/70 mt-2">{order.tracking_number ? `TRACKING: ${order.tracking_number}` : 'TRACKING NUMBER WILL APPEAR HERE ONCE YOUR ORDER HAS BEEN DISPATCHED.'}</p>
      </div>

      {order.fulfillment_status === 'cancelled' ? (
        <div className="bg-red-500/10 border-[1px] border-red-500/30 p-8 w-full mt-4">
          <p className="text-sm md:text-base font-bold text-red-500 uppercase tracking-widest leading-relaxed">
            THIS ORDER HAS BEEN CANCELLED. PLEASE CONTACT SUPPORT IF YOU NEED ASSISTANCE.
          </p>
        </div>
      ) : order.payment_status === 'manual_pending' ? (
        <div className="bg-yellow-500/10 border-[1px] border-yellow-500/30 p-8 w-full mt-4">
          <p className="text-sm md:text-base font-bold text-yellow-500 uppercase tracking-widest leading-relaxed">
            ORDER RECEIVED. YOUR PAYMENT IS PENDING MANUAL VERIFICATION. CHECK BACK LATER FOR UPDATES.
          </p>
        </div>
      ) : order.payment_status === 'pending' ? (
        <div className="bg-orange-500/10 border-[1px] border-orange-500/30 p-8 w-full mt-4">
          <p className="text-sm md:text-base font-bold text-orange-500 uppercase tracking-widest leading-relaxed">
            PAYMENT PENDING. PLEASE COMPLETE YOUR PAYMENT TO FINALIZE THE ORDER.
          </p>
        </div>
      ) : order.payment_status === 'success' ? (
        <div className="bg-green-500/10 border-[1px] border-green-500/30 p-8 w-full mt-4">
          <p className="text-sm md:text-base font-bold text-green-500 uppercase tracking-widest leading-relaxed">
            PAYMENT SUCCESSFUL. YOUR ORDER IS CONFIRMED.
          </p>
        </div>
      ) : null}

      <Link to="/" className="mt-12 border-[1px] border-stunna-text py-4 px-12 text-[10px] tracking-widest uppercase hover:bg-stunna-text hover:text-stunna-bg transition-colors inline-block">
        CONTINUE SHOPPING
      </Link>
    </motion.div>
  );
}
