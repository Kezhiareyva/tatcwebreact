ALTER TABLE batches ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 0.00;

CREATE TABLE program_form_fields (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  program_id bigint(20) NOT NULL,
  label varchar(255) NOT NULL,
  field_type varchar(50) NOT NULL DEFAULT 'TEXT', -- TEXT, TEXTAREA, SELECT, RADIO, CHECKBOX, FILE
  options_json text DEFAULT NULL,
  is_required boolean DEFAULT false,
  allowed_extensions varchar(255) DEFAULT NULL,
  order_index int DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_program_form_fields_program FOREIGN KEY (program_id) REFERENCES programs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE participant_registrations (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  participant_id bigint(20) NOT NULL,
  batch_id bigint(20) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'PENDING_PAYMENT', -- PENDING_PAYMENT, UNDER_REVIEW, REVISION_NEEDED, ACCEPTED, REJECTED, CANCELLED
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_proof_url varchar(255) DEFAULT NULL,
  payment_deadline datetime DEFAULT NULL,
  submitted_at datetime NOT NULL DEFAULT current_timestamp(),
  reviewed_at datetime DEFAULT NULL,
  reviewed_by bigint(20) DEFAULT NULL,
  notes text DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  CONSTRAINT fk_participant_registrations_participant FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_registrations_batch FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_registrations_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE participant_form_answers (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  registration_id bigint(20) NOT NULL,
  field_id bigint(20) NOT NULL,
  answer_text text DEFAULT NULL,
  file_url varchar(255) DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_participant_form_answers_registration FOREIGN KEY (registration_id) REFERENCES participant_registrations (id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_form_answers_field FOREIGN KEY (field_id) REFERENCES program_form_fields (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
