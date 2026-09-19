ALTER TABLE disputes ALTER COLUMN order_item_id DROP NOT NULL;
ALTER TABLE disputes DROP CONSTRAINT disputes_order_item_id_key;
ALTER TABLE disputes ALTER COLUMN buyer_id DROP NOT NULL;
ALTER TABLE disputes ADD COLUMN opened_by uuid REFERENCES users(id);
UPDATE disputes SET opened_by=buyer_id;
ALTER TABLE disputes ALTER COLUMN opened_by SET NOT NULL;
ALTER TABLE disputes ADD COLUMN ticket_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 1001);
ALTER TABLE disputes ADD CONSTRAINT disputes_ticket_number_key UNIQUE(ticket_number);
ALTER TABLE disputes ADD COLUMN subject text NOT NULL DEFAULT '';
UPDATE disputes d SET subject=d.reason || ': ' || i.product_name FROM order_items i WHERE i.id=d.order_item_id;
ALTER TABLE disputes ADD COLUMN category text NOT NULL DEFAULT 'Order' CHECK(category IN ('Order','Payment','Account','Store','Product','Other'));
ALTER TABLE disputes ADD COLUMN priority text NOT NULL DEFAULT 'Normal' CHECK(priority IN ('Low','Normal','High'));
ALTER TABLE disputes DROP CONSTRAINT disputes_status_check;
ALTER TABLE disputes ADD CONSTRAINT disputes_status_check CHECK(status IN ('Open','Closed','Resolved'));
ALTER TABLE disputes ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
UPDATE disputes d SET updated_at=GREATEST(d.created_at,d.resolved_at,(SELECT max(m.created_at) FROM dispute_messages m WHERE m.dispute_id=d.id));
ALTER TABLE disputes ADD COLUMN closed_by uuid REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN closed_at timestamptz;
CREATE TABLE ticket_events (
 id uuid PRIMARY KEY, ticket_id uuid NOT NULL REFERENCES disputes(id), actor_id uuid REFERENCES users(id),
 action text NOT NULL CHECK(action IN ('Opened','Reopened','Closed','Resolved')),
 note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
-- Deterministic IDs avoid requiring a UUID extension during migration.
INSERT INTO ticket_events(id,ticket_id,actor_id,action,created_at)
 SELECT md5(id::text || ':opened')::uuid,id,opened_by,'Opened',created_at FROM disputes;
INSERT INTO ticket_events(id,ticket_id,actor_id,action,note,created_at)
 SELECT md5(id::text || ':resolved')::uuid,id,resolved_by,'Resolved',COALESCE(resolution,''),COALESCE(resolved_at,created_at) FROM disputes WHERE status='Resolved';
CREATE INDEX ticket_events_thread_idx ON ticket_events(ticket_id,created_at);
CREATE INDEX disputes_opener_idx ON disputes(opened_by,updated_at DESC);
CREATE INDEX disputes_listing_idx ON disputes(status,category,updated_at DESC);
CREATE INDEX disputes_order_item_idx ON disputes(order_item_id);
