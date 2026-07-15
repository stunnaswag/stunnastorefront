import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLoading } from '../context/LoadingContext';

export default function Policies() {
  const { registerRequest, resolveRequest } = useLoading();

  useEffect(() => {
    registerRequest();
    resolveRequest();
  }, [registerRequest, resolveRequest]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="pt-40 pb-24 px-6 md:px-12 max-w-[800px] mx-auto min-h-screen"
    >
      <div className="flex flex-col gap-24">
        
        {/* About */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-stunna-text/40">ABOUT STUNNA</h2>
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-stunna-text/80 leading-loose">
            Stunna was founded on the principle of absolute reduction. We strip away the unnecessary to reveal the essential geometry of modern streetwear. Every garment is a structural exercise in avant-garde minimalism, built for those who understand that silence is the loudest statement.
          </p>
        </section>

        {/* Shipping */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-stunna-text/40">SHIPPING</h2>
          <div className="flex flex-col gap-4 text-[10px] md:text-xs uppercase tracking-widest text-stunna-text/80 leading-loose">
            <p>All orders are processed within 2-3 business days. You will receive a confirmation email with tracking information once your structural piece has been dispatched.</p>
            <p>Domestic: 3-5 Business Days.</p>
            <p>International: 7-14 Business Days depending on customs clearance.</p>
            <p>We are not responsible for any duties, taxes, or delays imposed by destination countries.</p>
          </div>
        </section>

        {/* Returns */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-stunna-text/40">RETURNS</h2>
          <div className="flex flex-col gap-4 text-[10px] md:text-xs uppercase tracking-widest text-stunna-text/80 leading-loose">
            <p>Given the limited nature of our collections, all sales are final. We do not accept returns or exchanges for wrong sizing. Please consult our sizing charts carefully before committing to a purchase.</p>
            <p>If an item arrives damaged or defective, please contact us within 48 hours of delivery with photographic evidence, and our team will facilitate a replacement.</p>
          </div>
        </section>

        {/* Contact */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-stunna-text/40">CONTACT</h2>
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-stunna-text/80 leading-loose">
            For editorial inquiries, wholesale, or client support, reach out to us at:
            <br /><br />
            <a href="mailto:STUDIO@STUNNA.COM" className="text-stunna-text hover:text-stunna-accent transition-colors underline underline-offset-4 decoration-stunna-text/20">STUDIO@STUNNA.COM</a>
          </p>
        </section>

      </div>
    </motion.div>
  );
}
