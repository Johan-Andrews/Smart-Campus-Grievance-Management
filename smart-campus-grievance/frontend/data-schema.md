| table_schema | table_name            | column_name            | data_type                | is_nullable |
| ------------ | --------------------- | ---------------------- | ------------------------ | ----------- |
| public       | complaint_ai_analysis | id                     | uuid                     | NO          |
| public       | complaint_ai_analysis | complaint_id           | uuid                     | NO          |
| public       | complaint_ai_analysis | ai_summary             | text                     | YES         |
| public       | complaint_ai_analysis | sentiment_score        | double precision         | YES         |
| public       | complaint_ai_analysis | abuse_score            | double precision         | YES         |
| public       | complaint_ai_analysis | quality_score          | double precision         | YES         |
| public       | complaint_ai_analysis | explainable_output     | jsonb                    | YES         |
| public       | complaint_ai_analysis | flagged_for_moderation | boolean                  | NO          |
| public       | complaint_ai_analysis | created_at             | timestamp with time zone | NO          |
| public       | complaint_ai_analysis | updated_at             | timestamp with time zone | NO          |
| public       | complaint_logs        | id                     | uuid                     | NO          |
| public       | complaint_logs        | complaint_id           | uuid                     | NO          |
| public       | complaint_logs        | action                 | text                     | NO          |
| public       | complaint_logs        | previous_status        | USER-DEFINED             | YES         |
| public       | complaint_logs        | new_status             | USER-DEFINED             | YES         |
| public       | complaint_logs        | note                   | text                     | YES         |
| public       | complaint_logs        | changed_by_id          | uuid                     | YES         |
| public       | complaint_logs        | timestamp              | timestamp with time zone | NO          |
| public       | complaints            | id                     | uuid                     | NO          |
| public       | complaints            | title                  | text                     | NO          |
| public       | complaints            | description            | text                     | NO          |
| public       | complaints            | category               | USER-DEFINED             | NO          |
| public       | complaints            | department_id          | uuid                     | YES         |
| public       | complaints            | urgency                | USER-DEFINED             | NO          |
| public       | complaints            | location               | text                     | YES         |
| public       | complaints            | priority               | USER-DEFINED             | NO          |
| public       | complaints            | status                 | USER-DEFINED             | NO          |
| public       | complaints            | is_anonymous           | boolean                  | NO          |
| public       | complaints            | is_slabreach           | boolean                  | NO          |
| public       | complaints            | student_id             | uuid                     | NO          |
| public       | complaints            | assigned_to_id         | uuid                     | YES         |
| public       | complaints            | sla_deadline           | timestamp with time zone | YES         |
| public       | complaints            | resolved_at            | timestamp with time zone | YES         |
| public       | complaints            | created_at             | timestamp with time zone | NO          |
| public       | complaints            | updated_at             | timestamp with time zone | NO          |
| public       | departments           | id                     | uuid                     | NO          |
| public       | departments           | name                   | text                     | NO          |
| public       | departments           | code                   | text                     | NO          |
| public       | departments           | created_at             | timestamp with time zone | NO          |
| public       | system_patterns       | id                     | uuid                     | NO          |
| public       | system_patterns       | issue_type             | text                     | NO          |
| public       | system_patterns       | category               | USER-DEFINED             | YES         |
| public       | system_patterns       | location               | text                     | YES         |
| public       | system_patterns       | department_id          | uuid                     | YES         |
| public       | system_patterns       | frequency              | integer                  | NO          |
| public       | system_patterns       | last_detected          | timestamp with time zone | NO          |
| public       | system_patterns       | updated_at             | timestamp with time zone | NO          |
| public       | users                 | id                     | uuid                     | NO          |
| public       | users                 | name                   | text                     | NO          |
| public       | users                 | email                  | text                     | NO          |
| public       | users                 | role                   | USER-DEFINED             | NO          |
| public       | users                 | trust_score            | double precision         | NO          |
| public       | users                 | department_id          | uuid                     | YES         |
| public       | users                 | created_at             | timestamp with time zone | NO          |
| public       | users                 | updated_at             | timestamp with time zone | NO          |
| public       | v_admin_grievances    | id                     | uuid                     | YES         |
| public       | v_admin_grievances    | ref_id                 | text                     | YES         |
| public       | v_admin_grievances    | title                  | text                     | YES         |
| public       | v_admin_grievances    | description            | text                     | YES         |
| public       | v_admin_grievances    | category               | USER-DEFINED             | YES         |
| public       | v_admin_grievances    | category_label         | text                     | YES         |
| public       | v_admin_grievances    | urgency                | USER-DEFINED             | YES         |
| public       | v_admin_grievances    | priority               | USER-DEFINED             | YES         |
| public       | v_admin_grievances    | status                 | USER-DEFINED             | YES         |
| public       | v_admin_grievances    | is_anonymous           | boolean                  | YES         |
| public       | v_admin_grievances    | is_slabreach           | boolean                  | YES         |
| public       | v_admin_grievances    | location               | text                     | YES         |
| public       | v_admin_grievances    | student_display_name   | text                     | YES         |
| public       | v_admin_grievances    | student_real_name      | text                     | YES         |
| public       | v_admin_grievances    | student_email          | text                     | YES         |
| public       | v_admin_grievances    | student_trust_score    | double precision         | YES         |
| public       | v_admin_grievances    | assigned_to_name       | text                     | YES         |
| public       | v_admin_grievances    | created_date           | text                     | YES         |
| public       | v_admin_grievances    | sla_display            | text                     | YES         |
| public       | v_admin_grievances    | resolved_datetime      | text                     | YES         |
| public       | v_admin_grievances    | sla_breach_label       | text                     | YES         |
| public       | v_admin_grievances    | ai_summary             | text                     | YES         |
| public       | v_admin_grievances    | sentiment_score        | double precision         | YES         |
| public       | v_admin_grievances    | abuse_score            | double precision         | YES         |
| public       | v_admin_grievances    | quality_score          | double precision         | YES         |
| public       | v_admin_grievances    | flagged_for_moderation | boolean                  | YES         |
| public       | v_admin_grievances    | sla_deadline           | timestamp with time zone | YES         |
| public       | v_admin_grievances    | resolved_at            | timestamp with time zone | YES         |
| public       | v_admin_grievances    | created_at             | timestamp with time zone | YES         |
| public       | v_admin_grievances    | updated_at             | timestamp with time zone | YES         |
| public       | v_admin_metrics       | open_count             | bigint                   | YES         |
| public       | v_admin_metrics       | in_progress_count      | bigint                   | YES         |
| public       | v_admin_metrics       | resolved_count         | bigint                   | YES         |
| public       | v_admin_metrics       | rejected_count         | bigint                   | YES         |
| public       | v_admin_metrics       | sla_breach_count       | bigint                   | YES         |
| public       | v_admin_metrics       | total_count            | bigint                   | YES         |
| public       | v_complaint_timeline  | id                     | uuid                     | YES         |
| public       | v_complaint_timeline  | complaint_id           | uuid                     | YES         |
| public       | v_complaint_timeline  | action                 | text                     | YES         |
| public       | v_complaint_timeline  | previous_status        | USER-DEFINED             | YES         |
| public       | v_complaint_timeline  | new_status             | USER-DEFINED             | YES         |
| public       | v_complaint_timeline  | note                   | text                     | YES         |
| public       | v_complaint_timeline  | timestamp              | timestamp with time zone | YES         |
| public       | v_complaint_timeline  | timestamp_display      | text                     | YES         |
| public       | v_complaint_timeline  | actor_name             | text                     | YES         |