CREATE TABLE IF NOT EXISTS rooms (
	id               BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	room_number      VARCHAR(10)   NOT NULL UNIQUE,
	room_type        VARCHAR(50)   NOT NULL,
	price_per_night  NUMERIC(10,2) NOT NULL,
	description      TEXT,
	is_available     BOOLEAN       NOT NULL DEFAULT TRUE,
	is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
	created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guests (
	id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	first_name  VARCHAR(100)  NOT NULL,
	last_name   VARCHAR(100)  NOT NULL,
	email       VARCHAR(255)  NOT NULL UNIQUE,
	phone       VARCHAR(30),
	is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
	created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
	id             BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	guest_id       BIGINT        NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
	room_id        BIGINT        NOT NULL REFERENCES rooms(id)  ON DELETE RESTRICT,
	check_in_date  DATE          NOT NULL,
	check_out_date DATE          NOT NULL,
	status         VARCHAR(20)   NOT NULL DEFAULT 'pending'
	                 CHECK (status IN ('pending','confirmed','cancelled','completed')),
	total_price    NUMERIC(10,2) NOT NULL,
	weather_data   JSONB,
	created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
	updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
	CONSTRAINT chk_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_room_dates ON bookings(room_id, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id   ON bookings(guest_id);
