CREATE TABLE IF NOT EXISTS public.inventory_items (

    item_id VARCHAR(10) PRIMARY KEY,

    item_name VARCHAR(100),

    stock_qty INT NOT NULL DEFAULT 0,

    unit_cost NUMERIC(15, 2) NOT NULL

);



CREATE TABLE IF NOT EXISTS public.inventory_transactions (

    trx_id SERIAL PRIMARY KEY,

    item_id VARCHAR(10)

        REFERENCES public.inventory_items(item_id),

    trx_type VARCHAR(10)

        CHECK (

            trx_type IN ('PURCHASE', 'SALE', 'ADJUSTMENT')

        ),

    qty INT NOT NULL,

    trx_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

