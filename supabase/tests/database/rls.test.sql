-- US-8.1 / US-8.2 / domain rule 8: who can read and write what.
begin;
select plan(10);

-- 小美 places an order so there is something to protect.
set local role authenticated;
set local request.jwt.claim.sub = '22222222-0000-4000-8000-000000000001';
select lives_ok(
  $$ select public.place_order('[{"slug":"fo-tiao-qiang","qty":1}]', 'delivery', null, false, 'card',
     '{"recipient":"陳小美","city":"新北市","district":"新莊區","line":"中正路 1 號"}') $$,
  'a member can place an order');

-- Anonymous visitors
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
select is((select count(*)::int from public.products), 4, 'anon sees only the 4 active products');
select is((select count(*)::int from public.orders), 0, 'anon cannot read orders');
select is((select count(*)::int from public.members), 0, 'anon cannot read members');
select is((select count(*)::int from public.inventory_lots), 0, 'anon cannot read lot details');
select throws_ok(
  $$ select public.place_order('[{"slug":"fo-tiao-qiang","qty":1}]', 'pickup', null, false, 'card', null) $$,
  '42501', null, 'anon cannot call place_order');

-- Another member (the store clerk acting as a shopper) cannot see 小美's order or profile
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-0000-4000-8000-000000000002';
select is((select count(*)::int from public.orders where member_id = '22222222-0000-4000-8000-000000000001'
           and fulfillment = 'delivery'), 0, 'staff cannot read a delivery order of another member');
select is((select count(*)::int from public.members where id = '22222222-0000-4000-8000-000000000001'), 0,
          'staff cannot read another member''s phone');

-- A member cannot raise their own points or role
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '22222222-0000-4000-8000-000000000001';
select throws_ok($$ update public.members set points = 99999 $$, '42501', null, 'members cannot edit points');
update public.inventory_lots set qty = 999;
reset role;
select is((select qty from public.inventory_lots where id = 'lot-1'), 10, 'members cannot edit stock');

select * from finish();
rollback;
