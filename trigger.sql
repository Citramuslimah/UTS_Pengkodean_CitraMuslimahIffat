CREATE OR REPLACE FUNCTION public.trg_update_stock_and_journal()

RETURNS TRIGGER

LANGUAGE plpgsql

AS $$

BEGIN

    IF NEW.qty <= 0 THEN

        RAISE EXCEPTION 'Qty harus lebih besar dari 0.';

    END IF;



    IF NEW.trx_type = 'PURCHASE' THEN



        UPDATE public.inventory_items

        SET stock_qty = stock_qty + NEW.qty

        WHERE item_id = NEW.item_id;



    ELSIF NEW.trx_type = 'SALE' THEN



        UPDATE public.inventory_items

        SET stock_qty = stock_qty - NEW.qty

        WHERE item_id = NEW.item_id

          AND stock_qty >= NEW.qty;



        IF NOT FOUND THEN

            RAISE EXCEPTION

                'Stok item % tidak mencukupi atau item tidak ditemukan.',

                NEW.item_id;

        END IF;



    ELSIF NEW.trx_type = 'ADJUSTMENT' THEN



        UPDATE public.inventory_items

        SET stock_qty = stock_qty + NEW.qty

        WHERE item_id = NEW.item_id;



    ELSE

        RAISE EXCEPTION 'Jenis transaksi tidak valid.';

    END IF;



    IF NOT FOUND THEN

        RAISE EXCEPTION

            'Barang dengan item_id % tidak ditemukan.',

            NEW.item_id;

    END IF;



    RETURN NEW;

END;

$$;



DROP TRIGGER IF EXISTS trg_inventory_transaction_insert

ON public.inventory_transactions;



CREATE TRIGGER trg_inventory_transaction_insert

AFTER INSERT ON public.inventory_transactions

FOR EACH ROW

EXECUTE FUNCTION public.trg_update_stock_and_journal();



