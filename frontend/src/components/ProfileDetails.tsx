import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import type { User } from '../types';
import { mutate, useAction } from '../api';
import { Feedback } from './UI';
import ImageUpload from './ImageUpload';

export default function ProfileDetails({ user, onChange }: { user: User; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [images, setImages] = useState(user.profileImage ? [user.profileImage] : []);
  const [uploading, setUploading] = useState(false);
  const action = useAction(onChange);
  const startEdit = () => { setImages(user.profileImage ? [user.profileImage] : []); setEditing(true); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (uploading) return;
    const body = { ...Object.fromEntries(new FormData(event.currentTarget)), profileImage: images[0] || '' };
    void action.run(async () => { await mutate('/account', 'PATCH', body); setEditing(false); }, 'Profile updated.');
  };
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <section className="panel profile-card">
    <div className="profile-card-heading">
      {user.profileImage ? <img className="profile-avatar profile-photo" src={user.profileImage} alt={`${user.name}'s profile picture`} /> : <div className="profile-avatar" aria-hidden="true">{initials}</div>}
      <div className="grow"><p className="eyebrow">PERSONAL PROFILE</p><h2>{user.name}</h2><p className="muted break-word">{user.email}</p><span className="badge">{user.role === 'admin' ? 'Administrator' : user.role === 'seller' ? 'Buyer & seller' : 'Buyer'}</span></div>
      {!editing && <button className="button secondary" disabled={action.busy} onClick={startEdit}><Pencil size={15} />Edit profile</button>}
    </div>
    <Feedback error={action.error} success={action.success} />
    {editing ? <form className="profile-edit-form" onSubmit={submit}><fieldset disabled={action.busy}>
      <ImageUpload purpose="profile" value={images} onChange={setImages} onBusyChange={setUploading} />
      <h3>Personal information</h3><p className="muted small">Biodata is optional and is not shown in product listings. Profile location is separate from your checkout delivery addresses.</p>
      <div className="form-grid">
        <label>Full name<input name="name" required minLength={2} maxLength={120} autoComplete="name" defaultValue={user.name} /></label>
        <label>Phone number<input name="phone" type="tel" maxLength={30} autoComplete="tel" defaultValue={user.phone} /></label>
        <label>Date of birth (optional)<input name="dateOfBirth" type="date" max={new Date().toISOString().slice(0,10)} autoComplete="bday" defaultValue={user.dateOfBirth || ''} /></label>
        <label>Gender (optional)<input name="gender" maxLength={60} defaultValue={user.gender || ''} /></label>
        <label>Nationality (optional)<input name="nationality" maxLength={100} defaultValue={user.nationality || ''} /></label>
        <label>Occupation (optional)<input name="occupation" maxLength={120} defaultValue={user.occupation || ''} /></label>
        <label>City<input name="city" maxLength={100} autoComplete="address-level2" defaultValue={user.city} /></label>
        <label>State<input name="state" maxLength={100} autoComplete="address-level1" defaultValue={user.state} /></label>
        <label className="full-width">About you<textarea name="bio" rows={4} maxLength={1000} defaultValue={user.bio} /></label>
        <p className="muted small full-width">Your sign-in email is {user.email}. Manage sign-in methods under Security.</p>
        <div className="action-row full-width"><button className="button primary" disabled={uploading}>{action.busy ? 'Saving…' : uploading ? 'Uploading photo…' : 'Save profile'}</button><button className="button secondary" type="button" disabled={uploading} onClick={() => setEditing(false)}>Cancel</button></div>
      </div>
    </fieldset></form> : <dl className="profile-info">
      {[
        ['Full name',user.name], ['Email',user.email], ['Phone',user.phone],
        ['Date of birth',user.dateOfBirth ? new Date(user.dateOfBirth + 'T12:00:00').toLocaleDateString('en-NG',{dateStyle:'long'}) : ''],
        ['Gender',user.gender], ['Nationality',user.nationality], ['Occupation',user.occupation],
        ['Location',[user.city,user.state].filter(Boolean).join(', ')], ['About you',user.bio],
      ].map(([label,value]) => <div key={label} className={label === 'About you' ? 'full-width' : ''}><dt>{label}</dt><dd className="preserve-lines">{value || 'Not added yet'}</dd></div>)}
    </dl>}
  </section>;
}
