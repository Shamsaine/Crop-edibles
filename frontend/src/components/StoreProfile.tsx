import { useResource } from '../api';
import type { Product, VendorApplication } from '../types';
import { ProductGrid, type ShopActions } from './Catalog';
import { Feedback, Loading } from './UI';
export default function StoreProfile({id,revision,...actions}:ShopActions&{id:string;revision:number}) {
  const resource=useResource<{store:VendorApplication;products:Product[]}>('/stores/'+id,revision);
  if(resource.loading)return <Loading/>;
  if(!resource.data)return <Feedback error={resource.error}/>;
  const {store,products}=resource.data;
  return <><a className="text-button" href="#pantry">← Back to the pantry</a><section className="panel"><p className="eyebrow">INDEPENDENT FOOD BUSINESS</p><h1>{store.businessName}</h1><p className="muted">{store.location} · {store.category}</p><p className="preserve-lines">{store.description}</p>{store.businessRegistrationNumber&&<p><strong>Business registration number:</strong> {store.businessRegistrationNumber}<small className="muted block">Provided by the seller for business legitimacy checks.</small></p>}<div className="store-photos">{store.images.map((url,index)=><img key={url} src={url} alt={`${store.businessName} picture ${index+1}`}/>)}</div></section><h2>Shop this store</h2><ProductGrid products={products} {...actions}/></>;
}
