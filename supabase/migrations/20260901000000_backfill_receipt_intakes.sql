-- `receipt_intakes` 선점 테이블보다 먼저 확정된 batch도 재시도 시 idempotent하게 처리한다.
-- 이전 RPC는 receipt event를 이미 남겼지만 선점 레코드는 만들지 못했을 수 있다.
insert into public.receipt_intakes (user_id, receipt_id)
select distinct event.user_id, event.receipt_id
from public.inventory_events as event
where event.type = 'intake'
  and event.source = 'receipt'
  and nullif(btrim(event.receipt_id), '') is not null
on conflict (user_id, receipt_id) do nothing;
