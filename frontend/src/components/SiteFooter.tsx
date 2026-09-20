import { ArrowUpRight, Facebook, Handshake, Instagram, Leaf, Mail, MessageCircle, Phone, Twitter, Youtube } from 'lucide-react';
import { siteContent } from '../siteContent';

const socialPages = [
  { name: 'Instagram', icon: Instagram, url: siteContent.socials.instagram },
  { name: 'Facebook', icon: Facebook, url: siteContent.socials.facebook },
  { name: 'X / Twitter', icon: Twitter, url: siteContent.socials.twitter },
  { name: 'YouTube', icon: Youtube, url: siteContent.socials.youtube },
];

export default function SiteFooter({ admin = false }: { admin?: boolean }) {
  const support = admin ? '#admin/support' : '#support';
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-intro">
        <a href="#catalog" className="brand"><span className="brand-icon"><Leaf size={25} aria-hidden="true" /></span><span>Edible Shop<small>FROM HARVEST TO HOME</small></span></a>
        <p>Good food. Independent businesses.<br />A pantry with a story.</p>
        <p className="footer-description">Everyday essentials, connected to the people who grow, make, and bring them to your table.</p>
        <div className="footer-socials" aria-label="Edible Shop social media">
          {socialPages.map(({ name, icon: Icon, url }) => url
            ? <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={'Edible Shop on ' + name + ' (opens in a new tab)'}><Icon size={19} aria-hidden="true" /></a>
            : <span key={name} aria-label={name + ' — coming soon'} title={name + ' — coming soon'}><Icon size={19} aria-hidden="true" /></span>)}
        </div>
        {!socialPages.some(page => page.url) && <small className="footer-social-note">Our social pages are coming soon.</small>}
      </div>
      <nav className="footer-links" aria-label="Explore the shop">
        <h2>Explore</h2>
        <a href="#catalog">Home</a><a href="#pantry">The pantry</a>
        <a href="#pantry?collection=featured">Featured products</a>
        <a href="#pantry?collection=best-sellers&sort=best-sellers">Best sellers</a>
        <a href="#pantry?collection=deals&sort=discount">Promos & flash sales</a>
      </nav>
      <nav className="footer-links" aria-label="Account and help">
        <h2>Your Edible Shop</h2>
        <a href="#account">My profile</a><a href="#orders">My orders</a><a href="#saved">Saved products</a>
        <a href="#account/store">Sell with us</a><a href={support}>Support tickets</a>
      </nav>
      <section className="footer-contact" aria-labelledby="footer-contact-title">
        <h2 id="footer-contact-title">Contact us</h2>
        <p>Need a hand with an order, your store, or something else?</p>
        <a className="footer-contact-link" href={support + '/new'}><MessageCircle size={18} aria-hidden="true" /><span>Talk to our team<small>Open a support ticket</small></span><ArrowUpRight size={16} aria-hidden="true" /></a>
        {siteContent.email && <a className="footer-contact-detail" href={'mailto:' + siteContent.email}><Mail size={16} aria-hidden="true" />{siteContent.email}</a>}
        {siteContent.phone && <a className="footer-contact-detail" href={'tel:' + siteContent.phone.replace(/[^+\d]/g, '')}><Phone size={16} aria-hidden="true" />{siteContent.phone}</a>}
      </section>
    </div>
    <section className="footer-partners" aria-labelledby="footer-partners-title">
      <div><p className="footer-eyebrow">GROWING TOGETHER</p><h2 id="footer-partners-title">Partners & sponsors</h2><p>Help independent food businesses reach more tables.</p></div>
      {siteContent.partners.length > 0 && <div className="footer-partner-list">{siteContent.partners.map(partner => <a key={partner.name} href={partner.url} target="_blank" rel="noopener noreferrer">{partner.name}<ArrowUpRight size={14} aria-hidden="true" /></a>)}</div>}
      <a className="footer-partner-cta" href={support + '/new'}><Handshake size={21} aria-hidden="true" />Become a partner<ArrowUpRight size={17} aria-hidden="true" /></a>
    </section>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Edible Shop. All rights reserved.</span><span>From harvest to home, with care.</span></div>
  </footer>;
}
