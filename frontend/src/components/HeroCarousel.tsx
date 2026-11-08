import { useEffect, useState } from 'react';
import banner from '../assets/images/cashew_sorghum_banner_1784056800512.jpg';
const slides=[banner,'/hero-delivery.png','/hero-pantry.png','/hero-family.png'];
export default function HeroCarousel() {
  const [active,setActive]=useState(0);
  useEffect(()=>{const timer=window.setInterval(()=>setActive(value=>(value+1)%slides.length),6500);return()=>window.clearInterval(timer);},[]);
  return <><div className="hero-slides" aria-hidden="true">{slides.map((src,index)=><img key={src} src={src} alt="" className={active===index?'active':''}/>)}</div><div className="hero-carousel-controls">{slides.map((_,index)=><button key={index} type="button" className={active===index?'active':''} aria-label={`Show hero image ${index+1}`} aria-pressed={active===index} onClick={()=>setActive(index)}><span/></button>)}</div></>;
}
