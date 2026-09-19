import { useState, type FormEvent } from 'react';
import { Heart, Plus, ArrowRight } from 'lucide-react';
import { CATEGORIES, type Product, type Review } from '../types';
import { date, money, useResource } from '../api';
import { Empty, Feedback, Loading, ProductImage, SectionTitle } from './UI';
import banner from '../assets/images/cashew_sorghum_banner_1784056800512.jpg';

interface ShopActions { savedIds: string[]; busy: boolean; onAdd: (product: Product, quantity?: number) => void; onSave: (product: Product) => void }
export function ProductGrid({ products, ...actions }: ShopActions & { products: Product[] }) {
  if (!products.length) return <Empty>No products to show yet. Approved sellers can publish their first products from their store.</Empty>;
  return <div className="product-grid">{products.map(product => <article className="product-card" key={product.id}>
    <a className="product-photo" href={'#product/' + product.id}><ProductImage src={product.image} name={product.name} /></a>
    <button className={'save-button ' + (actions.savedIds.includes(product.id) ? 'saved' : '')} aria-label={(actions.savedIds.includes(product.id) ? 'Unsave ' : 'Save ') + product.name} aria-pressed={actions.savedIds.includes(product.id)} disabled={actions.busy} onClick={() => actions.onSave(product)}><Heart size={19} /></button>
    <div className="product-copy"><p className="eyebrow">{product.category} {product.origin && ' · ' + product.origin}</p><a href={'#product/' + product.id}><h3>{product.name}</h3></a><p className="muted small">{product.vendorName}</p>{product.reviewsCount > 0 && <p className="small">★ {Number(product.rating).toFixed(1)} · {product.reviewsCount} reviews</p>}<div className="product-bottom"><div><strong>{money(product.priceMinor)}</strong><small className="muted"> / {product.unit}</small></div><button className="add-button" disabled={actions.busy || !product.active || product.stock < 1} aria-label={'Add ' + product.name + ' to basket'} onClick={() => actions.onAdd(product)}><Plus size={18} /></button></div>{product.stock < 1 && <small className="muted">Out of stock</small>}</div>
  </article>)}</div>;
}
export default function Catalog({ revision, ...actions }: ShopActions & { revision: number }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const products = useResource<{ products: Product[] }>('/products?' + new URLSearchParams({ ...(query ? { search: query } : {}), ...(category ? { category } : {}) }), revision);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setQuery(search.trim()); };
  return <><div className="hero"><div className="hero-copy"><p className="eyebrow">THE EDIBLE SHOP MARKETPLACE</p><h1>A little closer<br />to the harvest.</h1><p>Discover grains, spices, oils, and everyday treats from independent food businesses.</p><a className="button cream" href="#catalog-products" onClick={event => { event.preventDefault(); document.getElementById("catalog-products")?.scrollIntoView({ behavior: "smooth" }); }}>Explore the pantry <ArrowRight size={17} /></a></div><img src={banner} alt="Cashews and sorghum" /></div><section id="catalog-products"><SectionTitle eyebrow="GOOD FOOD, THOUGHTFULLY SOURCED" title="The pantry" /><div className="catalog-controls"><div className="category-tabs" aria-label="Product categories">{['', ...CATEGORIES].map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''} aria-pressed={category === item}>{item || 'All products'}</button>)}</div><form className="search-form" onSubmit={submit}><input aria-label="Search products" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the pantry…" /><button className="button secondary">Search</button></form></div><Feedback error={products.error} />{products.loading ? <Loading /> : products.data && <ProductGrid products={products.data.products} {...actions} />}</section></>;
}
export function ProductDetail({ id, revision, ...actions }: ShopActions & { id: string; revision: number }) {
  const product = useResource<{ product: Product }>('/products/' + id, revision);
  const reviews = useResource<{ reviews: Review[] }>('/products/' + id + '/reviews', revision);
  const [quantity, setQuantity] = useState(1);
  if (product.loading) return <Loading />;
  if (!product.data) return <Feedback error={product.error || 'Product unavailable.'} />;
  const item = product.data.product;
  return <><a href="#catalog" className="text-button">← Back to the pantry</a><div className="product-detail"><div className="detail-photo"><ProductImage src={item.image} name={item.name} /></div><div><p className="eyebrow">{item.category} · {item.origin}</p><h1>{item.name}</h1><p className="muted">Sold by {item.vendorName}</p><p className="detail-price">{money(item.priceMinor)} <small>/ {item.unit}</small></p><p className="preserve-lines">{item.description || 'The seller has not added a description yet.'}</p><div className="tag-list">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div><p className="small">{item.stock > 0 ? item.stock + ' available' : 'Out of stock'}</p><div className="action-row"><label>Quantity<input className="quantity" aria-label="Quantity" type="number" min={1} max={Math.min(item.stock, 99)} value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label><button className="button primary" disabled={actions.busy || !item.active || quantity < 1 || !Number.isInteger(quantity) || quantity > Math.min(item.stock, 99)} onClick={() => actions.onAdd(item, quantity)}>Add to basket</button><button className="button secondary" disabled={actions.busy} onClick={() => actions.onSave(item)}>{actions.savedIds.includes(item.id) ? 'Unsave' : 'Save for later'}</button></div></div></div><section className="panel"><h2>Customer reviews</h2><Feedback error={reviews.error} />{reviews.loading ? <Loading /> : !reviews.data?.reviews.length ? <p className="muted">No reviews yet. Buyers can review this product after delivery.</p> : reviews.data.reviews.map(review => <article className="review" key={review.id}><strong>{review.name}</strong><p>{'★'.repeat(review.rating)} <span className="muted small">{date(review.createdAt)}</span></p><p>{review.comment}</p></article>)}</section></>;
}



