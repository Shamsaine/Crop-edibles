import { useState, type FormEvent } from 'react';
import { date, money, mutate, useAction, useResource } from '../api';
import type { VendorApplication } from '../types';
import { Empty, Feedback, Loading, SectionTitle } from './UI';
import Orders from './Orders';
import Disputes from './Disputes';
type Metrics = { usersCount: number; sellersCount: number; productsCount: number; ordersCount: number; revenueMinor: number; pendingApplicationsCount: number; openDisputesCount: number };
interface Payment { id: string; orderId: string; reference: string; amountMinor: number; status: string; lastError: string | null; createdAt: string }
function Application({ application, onChange }: { application: VendorApplication; onChange: () => void }) {
  const action = useAction(onChange);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (!(submitter instanceof HTMLButtonElement) || !['Approved', 'Rejected'].includes(submitter.value)) { action.setError('Choose Approve seller or Reject application.'); return; }
    void action.run(() => mutate('/admin/applications/' + application.id, 'PATCH', { status: submitter.value, adminNotes: form.get('adminNotes') }), 'Application reviewed.');
  };
  return <article className="panel"><div className="order-heading"><div><p className="eyebrow">{application.category}</p><h2>{application.businessName}</h2></div><span className="badge">{application.status}</span></div><dl className="details-grid"><div><dt>Legal entity</dt><dd>{application.legalEntityName}</dd></div><div><dt>Registration number</dt><dd>{application.registrationNumber}</dd></div><div><dt>Location</dt><dd>{application.location}</dd></div><div><dt>Contact</dt><dd>{application.contactPerson?.name}<br />{application.contactPerson?.email}<br />{application.phone || application.contactPerson?.phone}</dd></div></dl>{application.description && <p className="preserve-lines">{application.description}</p>}<Feedback error={action.error} success={action.success} />{application.status === 'Pending' ? <form className="form-stack" onSubmit={submit}><label>Review notes<textarea name="adminNotes" rows={3} maxLength={2000} /></label><div className="action-row"><button className="button primary" value="Approved" disabled={action.busy}>Approve seller</button><button className="button secondary danger" value="Rejected" disabled={action.busy}>Reject application</button></div></form> : application.adminNotes && <p className="notice">{application.adminNotes}</p>}</article>;
}
function Payments({ revision, onChange }: { revision: number; onChange: () => void }) {
  const resource = useResource<{ payments: Payment[] }>('/admin/payments', revision);
  const action = useAction(onChange);
  return <><SectionTitle title="Online payments" eyebrow="PAYSTACK" /><p className="muted">Verify pending transactions with the provider. Cases marked Needs Review require manual follow-up; closing a support case does not issue a refund.</p><Feedback error={resource.error || action.error} success={action.success} />{resource.loading ? <Loading /> : !resource.data?.payments.length ? <Empty>No online payment attempts yet.</Empty> : resource.data.payments.map(payment => <article className="panel" key={payment.id}><div className="order-heading"><div><h3>Order {payment.orderId.slice(0,8).toUpperCase()}</h3><p className="muted small">{date(payment.createdAt)}</p></div><span className="badge">{payment.status}</span><strong>{money(payment.amountMinor)}</strong></div><p className="small break-word">Reference: {payment.reference}</p>{payment.lastError && <p className="notice">{payment.lastError}</p>}<button className="button secondary" disabled={action.busy} onClick={() => void action.run(() => mutate('/admin/payments/' + encodeURIComponent(payment.reference) + '/verify', 'POST'), 'Provider status checked.')}>Verify with Paystack</button></article>)}</>;
}
export default function AdminDashboard({ revision, onChange }: { revision: number; onChange: () => void }) {
  const [tab, setTab] = useState('applications');
  const [filter, setFilter] = useState('Pending');
  const metrics = useResource<{ metrics: Metrics }>('/admin/metrics', revision);
  const applications = useResource<{ applications: VendorApplication[] }>('/admin/applications', revision);
  const list = applications.data?.applications.filter(item => !filter || item.status === filter);
  return <><SectionTitle title="Marketplace administration" eyebrow="OPERATIONS" /><Feedback error={metrics.error} />{metrics.data && <div className="metrics">{[['Customers & accounts', metrics.data.metrics.usersCount], ['Approved sellers', metrics.data.metrics.sellersCount], ['Published products', metrics.data.metrics.productsCount], ['Orders', metrics.data.metrics.ordersCount], ['Paid order value', money(metrics.data.metrics.revenueMinor)], ['Pending applications', metrics.data.metrics.pendingApplicationsCount], ['Open support cases', metrics.data.metrics.openDisputesCount]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}<nav className="page-tabs" aria-label="Administration sections">{['applications','orders','payments','support'].map(item => <button key={item} className={tab === item ? 'active' : ''} aria-current={tab === item ? 'page' : undefined} onClick={() => setTab(item)}>{item === 'applications' ? 'Seller applications' : item === 'orders' ? 'Orders' : item === 'payments' ? 'Payments' : 'Support cases'}</button>)}</nav>{tab === 'applications' && <><div className="section-title"><h2>Seller applications</h2><label>Status<select value={filter} onChange={event => setFilter(event.target.value)}>{['Pending','Approved','Rejected',''].map(status => <option value={status} key={status}>{status || 'All applications'}</option>)}</select></label></div><Feedback error={applications.error} />{applications.loading ? <Loading /> : !list?.length ? <Empty>No {filter.toLowerCase()} applications.</Empty> : list.map(application => <Application key={application.id} application={application} onChange={onChange} />)}</>}{tab === 'orders' && <Orders mode="admin" revision={revision} onChange={onChange} />}{tab === 'payments' && <Payments revision={revision} onChange={onChange} />}{tab === 'support' && <Disputes admin revision={revision} onChange={onChange} />}</>;
}


