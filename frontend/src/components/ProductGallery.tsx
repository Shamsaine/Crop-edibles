import { useState } from 'react';
import { ProductImage } from './UI';

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const index = selected < images.length ? selected : 0;
  return <div className="product-gallery">
    <div className="detail-photo"><ProductImage src={images[index] || ''} name={`${name}${images.length > 1 ? `, photo ${index + 1}` : ''}`} /></div>
    {images.length > 1 && <div className="gallery-thumbnails" role="group" aria-label="Product photos">{images.map((url, i) => <button type="button" key={url+i} aria-label={`View photo ${i + 1} of ${name}`} aria-pressed={index === i} onClick={() => setSelected(i)}><img src={url} alt="" loading="lazy" /></button>)}</div>}
  </div>;
}
