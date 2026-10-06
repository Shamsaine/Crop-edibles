import { useId, useState } from 'react';
import { uploadImage } from '../api';

export default function ImageUpload({ value, onChange, purpose = 'product', disabled = false, onBusyChange }: {
  value: string[]; onChange: (images: string[]) => void; purpose?: 'product' | 'profile'; disabled?: boolean; onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [link, setLink] = useState('');
  const helpId = useId();
  const max = purpose === 'profile' ? 1 : 6;
  const select = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    const selected = Array.from(files);
    if (selected.length + (max === 1 ? 0 : value.length) > max) { setError(`Choose up to ${max} image${max === 1 ? '' : 's'} in total.`); return; }
    setBusy(true); onBusyChange?.(true); setError('');
    let images = max === 1 ? [] : [...value];
    try {
      for (const [index, file] of selected.entries()) {
        setProgress(`Uploading ${index + 1} of ${selected.length}: ${file.name}`);
        const result = await uploadImage(file, purpose);
        images = [...images, result.url]; onChange(images);
      }
    } catch (error) { setError(error instanceof Error ? error.message : 'Image upload failed. Please try again.'); }
    finally { setBusy(false); onBusyChange?.(false); setProgress(''); }
  };
  return <div className="image-upload">
    <label>{purpose === 'profile' ? 'Profile picture' : 'Product photos'}
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple={max > 1} disabled={disabled || busy || (max > 1 && value.length >= max)} aria-describedby={helpId} onChange={event => { void select(event.target.files); event.target.value = ''; }} />
    </label>
    <p id={helpId} className="muted small">JPEG, PNG or WebP, up to 5 MB each. {max > 1 ? 'Up to 6 photos; the first is the cover.' : 'Choose a new photo to replace your current one.'}</p>
    {busy && <p className="notice" role="status">{progress}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {purpose === 'product' && <details><summary>Use an existing image link</summary><label>HTTPS image URL<input type="url" value={link} maxLength={2000} disabled={disabled || busy || value.length >= max} onChange={event => setLink(event.target.value)} /></label><button className="button secondary" type="button" disabled={disabled || busy || !link || value.length >= max} onClick={() => {
      try { if (new URL(link).protocol !== 'https:') throw new Error(); onChange([...value, link]); setLink(''); setError(''); }
      catch { setError('Enter a valid HTTPS image URL.'); }
    }}>Add image link</button></details>}
    <div className="upload-previews">{value.map((url, index) => <div key={url + index}>
      <img src={url} alt={purpose === 'profile' ? 'Profile picture preview' : `Product photo ${index + 1}`} />
      <div className="action-row">
        {max > 1 && index === 0 && <span className="badge">Cover</span>}
        {max > 1 && index > 0 && <button type="button" className="text-button" disabled={disabled || busy} onClick={() => onChange([url, ...value.filter((_, i) => i !== index)])}>Make cover</button>}
        <button type="button" className="text-button danger" disabled={disabled || busy} onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove</button>
      </div>
    </div>)}</div>
  </div>;
}
