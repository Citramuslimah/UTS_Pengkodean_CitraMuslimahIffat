BEGIN;



SELECT stock_qty

FROM public.inventory_items

WHERE item_id = 'BRG001'

FOR UPDATE;



INSERT INTO public.inventory_transactions

    (item_id, trx_type, qty)

VALUES

    ('BRG001', 'SALE', 1);



COMMIT;



