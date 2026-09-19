import { useState, type FormEvent } from 'react';
import GoogleSignIn from './GoogleSignIn';
import { mutate, useAction, useResource } from '../api';
import { CATEGORIES, type Address, type User, type VendorApplication } from '../types';
import { Empty, Feedback, Loading, SectionTitle } from './UI';

export function Addresses({ revision, onChange }: { revision: number; onChange: () => void }) {
  const resource = useResource<{ addresses: Address[] }>('/addresses', revision);
  const [editing, setEditing] = useState<Address | null>(null);
  const action = useAction(onChange);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(form), isDefault: form.has('isDefault') };
    void action.run(async () => { await mutate('/addresses' + (editing ? '/' + editing.id : ''), editing ? 'PATCH' : 'POST', body); setEditing(null); }, 'Address saved.');
  };
  return <section className="panel"><h2>Delivery addresses</h2><Feedback error={resource.error || action.error} success={action.success} />{resource.loading ? <Loading /> : <div className="address-grid">{resource.data?.addresses.map(address => <article className="address-card" key={address.id}><strong>{address.label} {address.isDefault && <span className="badge">Default</span>}</strong><p>{address.recipientName}<br />{address.line1}{address.line2 && ', ' + address.line2}<br />{address.city}, {address.state}<br />{address.phone}</p><div className="action-row"><button className="text-button" disabled={action.busy} onClick={() => setEditing(address)}>Edit</button><button className="text-button danger" disabled={action.busy} onClick={() => void action.run(() => mutate('/addresses/' + address.id, 'DELETE'), 'Address removed.')}>Remove</button></div></article>)}{!resource.data?.addresses.length && <Empty>Add an address to place your first order.</Empty>}</div>}
    <details open={Boolean(editing)} key={(editing?.id || 'new') + revision}><summary>{editing ? 'Edit address' : 'Add a delivery address'}</summary><form className="form-grid" onSubmit={submit}>
      <label>Address label<input name="label" required defaultValue={editing?.label || ''} placeholder="Home" maxLength={80} /></label>
      <label>Recipient name<input name="recipientName" required defaultValue={editing?.recipientName || ''} autoComplete="name" maxLength={120} /></label>
      <label>Phone number<input name="phone" type="tel" required defaultValue={editing?.phone || ''} autoComplete="tel" maxLength={30} minLength={7} /></label>
      <label>Street address<input name="line1" required defaultValue={editing?.line1 || ''} autoComplete="address-line1" maxLength={250} /></label>
      <label>Apartment / landmark (optional)<input name="line2" defaultValue={editing?.line2 || ''} autoComplete="address-line2" maxLength={250} /></label>
      <label>City<input name="city" required defaultValue={editing?.city || ''} autoComplete="address-level2" maxLength={100} /></label>
      <label>State<input name="state" required defaultValue={editing?.state || ''} autoComplete="address-level1" maxLength={100} /></label>
      <label>Postal code (optional)<input name="postalCode" defaultValue={editing?.postalCode || ''} autoComplete="postal-code" maxLength={20} /></label>
      <label className="check-label"><input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault || false} />Default address</label>
      <div className="action-row"><button className="button primary" disabled={action.busy}>{action.busy ? 'Saving…' : 'Save address'}</button>{editing && <button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancel edit</button>}</div>
    </form></details>
  </section>;
}
export function SellerApplication({ revision, onChange }: { revision: number; onChange: () => void }) {
  const resource = useResource<{ application: VendorApplication | null }>('/seller/application', revision);
  const action = useAction(onChange);
  const application = resource.data?.application;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    void action.run(() => mutate('/seller/application', 'POST', body), 'Application submitted for administrator review.');
  };
  return <section className="panel"><h2>Sell on Edible Shop</h2><p className="muted">Tell us about your business. An administrator reviews each application before a store can publish products.</p><Feedback error={resource.error || action.error} success={action.success} />{resource.loading ? <Loading /> : <>{application && <div className="notice"><strong>{application.businessName} · {application.status}</strong>{application.adminNotes && <p>{application.adminNotes}</p>}{application.status === 'Pending' && <p>Your application is being reviewed. Refresh your account to see updates.</p>}{application.status === 'Approved' && <p><a href="#seller" className="text-button">Open your store</a></p>}</div>}{(!application || application.status === 'Rejected') && <form className="form-grid" onSubmit={submit}><label>Business name<input name="businessName" required maxLength={150} defaultValue={application?.businessName} /></label><label>Legal entity name<input name="legalEntityName" required maxLength={200} defaultValue={application?.legalEntityName} /></label><label>Registration number<input name="registrationNumber" required maxLength={80} defaultValue={application?.registrationNumber} /></label><label>Product category<select name="category" required defaultValue={application?.category || CATEGORIES[0]}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label><label>Business location<input name="location" required maxLength={200} defaultValue={application?.location} /></label><label>Business phone<input name="phone" type="tel" required minLength={7} maxLength={30} defaultValue={application?.phone || application?.contactPerson?.phone} /></label><label className="full-width">About your business<textarea name="description" maxLength={2000} defaultValue={application?.description} rows={3} /></label><button className="button primary" disabled={action.busy}>{action.busy ? 'Submitting…' : 'Submit application'}</button></form>}</>}</section>;
}
export default function Account({ user, revision, onChange }: { user: User; revision: number; onChange: () => void }) {
  const action = useAction(onChange);
  const passwordAction = useAction();
  const googleAction = useAction(onChange);
  const connectGoogle = (credential: string) => void googleAction.run(() => mutate('/account/google', 'POST', {credential}), 'Google connected. You can now sign in with Google.');
  const profile = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void action.run(() => mutate('/account', 'PATCH', Object.fromEntries(new FormData(event.currentTarget))), 'Profile updated.'); };
  const password = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const element = event.currentTarget; const body = Object.fromEntries(new FormData(element));
    void passwordAction.run(async () => { await mutate('/account/password', 'POST', body); element.reset(); }, 'Password updated.');
  };
  return <><SectionTitle title="Your account" eyebrow={user.email} />{user.accountType === 'seller' && user.role === 'buyer' && <section className="notice"><strong>Complete your seller registration</strong><p>Fill in the business application below. An administrator will review it before you can add products.</p></section>}<div className="two-columns"><section className="panel"><h2>Personal details</h2><Feedback error={action.error} success={action.success} /><form className="form-stack" onSubmit={profile} key={user.name + user.phone}><label>Full name<input name="name" required minLength={2} maxLength={120} defaultValue={user.name} autoComplete="name" /></label><label>Phone number<input name="phone" type="tel" maxLength={30} defaultValue={user.phone || ''} autoComplete="tel" /></label><button className="button primary" disabled={action.busy}>Save profile</button></form></section><section className="panel"><h2>Sign-in methods</h2><Feedback error={googleAction.error} success={googleAction.success} />{user.googleLinked ? <p className="notice">Google is connected to this account.</p> : <><p className="muted">Connect the Google account matching {user.email} to sign in with Google next time.</p><GoogleSignIn onCredential={connectGoogle} busy={googleAction.busy} /></>}{user.hasPassword ? <><h3>Change password</h3><Feedback error={passwordAction.error} success={passwordAction.success} /><form className="form-stack" onSubmit={password}><label>Current password<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} /></label><label>New password<input type="password" name="password" autoComplete="new-password" required minLength={10} maxLength={128} /></label><small className="muted">Use at least 10 characters.</small><button className="button secondary" disabled={passwordAction.busy}>Update password</button></form></> : <p className="muted">You sign in with Google. Your name and phone number can be updated here; manage your Google password with Google.</p>}</section></div><Addresses revision={revision} onChange={onChange} />{user.role !== 'admin' && <SellerApplication revision={revision} onChange={onChange} />}</>;
}



