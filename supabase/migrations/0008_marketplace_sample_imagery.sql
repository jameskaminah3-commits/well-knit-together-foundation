-- Sample catalogue imagery. Replace these references with rights-cleared maker uploads before launch.
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists image_credit text;

update public.products
set image_url = 'https://copperbeechbythesea.com/cdn/shop/files/2P6A0891s_1024x1024.jpg?v=1727116726',
    image_credit = 'Sample reference image · Copper Beech by the Sea'
where slug = 'woven-warmth-basket';

update public.products
set image_url = 'https://www.mayanhands.org/cdn/shop/products/TTR-MORG_2048x.jpg?v=1621629222',
    image_credit = 'Sample reference image · Mayan Hands'
where slug = 'indigo-table-runner';

update public.products
set image_url = 'https://i.etsystatic.com/32713828/r/il/953eb9/4569892430/il_600x600.4569892430_4c0a.jpg',
    image_credit = 'Sample reference image · Etsy listing'
where slug = 'seed-bead-statement-necklace';
