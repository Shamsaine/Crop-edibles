import { useState, type FormEvent } from 'react';
import { mutate, useAction } from '../api';
import { CATEGORIES, type Product } from '../types';
import ImageUpload from './ImageUpload';
import { Feedback } from './UI';

function ProductFields({ product, prefix = '' }: { product?: Product | null; prefix?: string }) {
  const name = (value: string) => prefix + value;
  return <>
    <label>Product name<input name={name('name')} required maxLength={180} defaultValue={product?.name} /></label>
    <label>Category<select name={name('category')} defaultValue={product?.category || 'Snacks'}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
    <label>Origin<input name={name('origin')} required maxLength={160} defaultValue={product?.origin} placeholder="State or region" /></label>
    <label>Pack size / unit<input name={name('unit')} required maxLength={80} defaultValue={product?.unit} placeholder="500 g bag" /></label>
    <label>Price (NGN)<input name={name('price')} type="number" step="0.01" min="0.01" max="1000000" required defaultValue={product ? product.basePriceMinor / 100 : ''} /></label>
    <label>Stock available<input name={name('stock')} type="number" min="0" max="1000000" step="1" required defaultValue={product?.stock ?? 0} /></label>
    <label className="full-width">Product description<textarea name={name('description')} rows={3} maxLength={5000} defaultValue={product?.description} /></label>
    <label className="full-width">Tags (up to 10, separated by commas)<input name={name('tags')} defaultValue={product?.tags.join(', ') || ''} maxLength={500} /></label>
    <label className="check-label full-width"><input type="checkbox" name={name('active')} defaultChecked={product?.sellerActive ?? true} />Publish in marketplace</label>
  </>;
}
function productBody(form: FormData, images: string[], prefix = '') {
  const get = (key: string) => String(form.get(prefix + key) || '');
  return { name: get('name'), category: get('category'), description: get('description'), origin: get('origin'), unit: get('unit'), images, priceMinor: Math.round(Number(get('price')) * 100), stock: Number(get('stock')), tags: get('tags').split(',').map(tag => tag.trim()).filter(Boolean), active: form.has(prefix + 'active') };
}
export default function ProductEditor({ product, onChange, onClose }: { product: Product | null; onChange: () => void; onClose: () => void }) {
  const action = useAction();
  const [images, setImages] = useState(product?.images || (product?.image ? [product.image] : []));
  const [uploading, setUploading] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (uploading) return;
    const body = productBody(new FormData(event.currentTarget), images);
    const payload: Record<string, unknown> = { ...body };
    if (product) { if (body.stock === product.stock) delete payload.stock; else payload.expectedStock = product.stock; }
    void action.run(async () => { await mutate('/seller/products' + (product ? '/' + product.id : ''), product ? 'PATCH' : 'POST', payload); onChange(); onClose(); });
  };
  return <section className="panel"><div className="section-title"><h2>{product ? 'Edit product' : 'Add a product'}</h2><button type="button" className="text-button" disabled={action.busy || uploading} onClick={onClose}>Close</button></div>
    <Feedback error={action.error} />
    <form onSubmit={submit}><fieldset disabled={action.busy}><div className="form-grid"><ProductFields product={product} /><div className="full-width"><ImageUpload value={images} onChange={setImages} onBusyChange={setUploading} /></div>
      <button className="button primary" disabled={uploading}>{action.busy ? 'Saving…' : uploading ? 'Uploading photos…' : 'Save product'}</button>
    </div></fieldset></form>
  </section>;
}
export function BatchProductEditor({ onChange, onClose }: { onChange: () => void; onClose: () => void }) {
  const action = useAction();
  const [rows, setRows] = useState([{ id: crypto.randomUUID(), images: [] as string[], uploading: false }]);
  const uploading = rows.some(row => row.uploading);
  const update = (id: string, changes: Partial<typeof rows[number]>) => setRows(current => current.map(row => row.id === id ? { ...row, ...changes } : row));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (uploading) return;
    const form = new FormData(event.currentTarget);
    void action.run(async () => { await mutate('/seller/products/batch', 'POST', { products: rows.map(row => productBody(form, row.images, row.id + '.')) }); onChange(); onClose(); }, 'Products saved.');
  };
  return <section className="panel"><div className="section-title"><h2>Add multiple products</h2><button type="button" className="text-button" disabled={action.busy || uploading} onClick={onClose}>Close</button></div>
    <p className="muted">Add details and photos for up to 20 products. All products are saved together after validation.</p><Feedback error={action.error} />
    <form onSubmit={submit}><fieldset disabled={action.busy}>
      {rows.map((row, index) => <section className="batch-product" key={row.id}><div className="section-title"><h3>Product {index + 1}</h3>{rows.length > 1 && <button className="text-button danger" type="button" disabled={uploading} onClick={() => setRows(current => current.filter(item => item.id !== row.id))}>Remove product</button>}</div>
        <div className="form-grid"><ProductFields prefix={row.id + '.'} /><div className="full-width"><ImageUpload value={row.images} onChange={images => update(row.id, { images })} onBusyChange={uploading => update(row.id, { uploading })} /></div></div>
      </section>)}
      <div className="action-row"><button className="button primary" disabled={uploading}>{action.busy ? 'Saving products…' : `Save ${rows.length} product${rows.length === 1 ? '' : 's'}`}</button>
        <button className="button secondary" type="button" disabled={uploading || rows.length >= 20} onClick={() => setRows(current => [...current, { id: crypto.randomUUID(), images: [], uploading: false }])}>Add another product</button></div>
    </fieldset></form>
  </section>;
}
