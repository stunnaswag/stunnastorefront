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
            Stunna Swag Season is a contemporary streetwear brand founded in January 2026 through the combined vision and creative efforts of Udeh Onyekachukwu Jeremiah and Eze Micheal Tochukwu.

Built on the belief that fashion is more than clothing, Stunna Swag Season represents confidence, individuality, and fearless self-expression. Every collection is designed for people who refuse to blend into the crowd—those who embrace their identity, move with purpose, and wear their ambition with pride.

Inspired by modern street culture, music, art, and youth expression, the brand combines bold aesthetics with meaningful storytelling. Each design is carefully developed to create more than just apparel; it becomes a statement that reflects the mindset of the person wearing it. From clean everyday essentials to standout graphic pieces, every product embodies the spirit of originality and authenticity.

At Stunna Swag Season, quality and creativity go hand in hand. We believe exceptional fashion should not only look good but also inspire confidence and leave a lasting impression. Every release is approached with attention to detail, premium craftsmanship, and a commitment to creating timeless pieces that resonate with a growing global community.

Our mission is to build a culture where people feel empowered to express themselves without limits. We celebrate those who dare to be different, challenge conventions, and pursue greatness on their own terms.

As the brand continues to grow, Stunna Swag Season remains committed to innovation, originality, and building a lasting legacy in the streetwear industry. What began as a shared dream between two creators is evolving into a movement that inspires a new generation to embrace who they are and wear that confidence proudly.
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
