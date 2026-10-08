import { useEffect, useState } from 'react';
import banner from '../assets/images/cashew_sorghum_banner_1784056800512.jpg';
const slides=[banner,'/hero-delivery.png','/hero-pantry.png','/hero-family.png'];
export default function HeroCarousel() {
  const [active,setActive]=useState(0);const [paused,setPaused]=useState(false);
  useEffect(()=>{if(paused||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=window.setInterval(()=>setActive(value=>(value+1)%slides.length),6500);return()=>window.clearInterval(timer);},[paused]);
  return <><div className="hero-slides" aria-hidden="true">{slides.map((src,index)=><img key={src} src={src} alt="" className={active===index?'active':''}/>)}</div><div className="hero-carousel-controls"><button type="button" onClick={()=>setPaused(!paused)} aria-label={paused?'Play hero slideshow':'Pause hero slideshow'}>{paused?'Play':'Pause'}</button>{slides.map((_,index)=><button key={index} type="button" className={active===index?'active':''} aria-label={`Show hero image ${index+1}`} aria-pressed={active===index} onClick={()=>setActive(index)}><span/></button>)}</div></>;
}
