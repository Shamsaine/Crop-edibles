import { useEffect, useState } from 'react';
import { uploadImage } from '../api';

export async function uploadBusinessPhotos(files: File[]) {
  const images: string[] = [];
  for (const file of files) images.push((await uploadImage(file, 'store')).url);
  return images;
}
export default function BusinessPhotos({files,onChange,disabled=false}:{files:File[];onChange:(files:File[])=>void;disabled?:boolean}) {
  const [error,setError]=useState('');
  const [previews,setPreviews]=useState<string[]>([]);
  useEffect(()=>{const urls=files.map(file=>URL.createObjectURL(file));setPreviews(urls);return()=>urls.forEach(url=>URL.revokeObjectURL(url));},[files]);
  return <div className="image-upload full-width"><label>Store pictures<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled} onChange={event=>{
    const selected=Array.from(event.target.files||[]);event.target.value='';
    if(files.length+selected.length>6){setError('Choose up to 6 store pictures.');return;}
    if(selected.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>5*1024*1024)){setError('Choose JPEG, PNG or WebP pictures up to 5 MB each.');return;}
    setError('');onChange([...files,...selected]);
  }}/></label><p className="muted small">Show your store, products or workspace. Up to 6 pictures, 5 MB each, sent with your application for review.</p>{error&&<p role="alert" className="notice error">{error}</p>}<div className="upload-previews">{previews.map((url,index)=><div key={url}><img src={url} alt={'Store picture '+(index+1)}/><button type="button" className="text-button danger" disabled={disabled} onClick={()=>onChange(files.filter((_,i)=>i!==index))}>Remove</button></div>)}</div></div>;
}
