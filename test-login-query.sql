-- Test the login query for john@example.com
select 
  "humans"."id", 
  "humans"."first_name", 
  "humans"."last_name", 
  "humans"."dob", 
  "humans"."gender", 
  "humans"."phone", 
  "humans"."created_at", 
  "humans"."updated_at", 
  "customers"."id", 
  "customers"."human_id", 
  "customers"."username", 
  "customers"."password_hash", 
  "customers"."loyalty_points", 
  "customers"."created_at", 
  "customers"."updated_at", 
  "email_history"."email" 
from "email_history" 
inner join "humans" on "email_history"."human_id" = "humans"."id" 
left join "customers" on "humans"."id" = "customers"."human_id" 
where ("email_history"."email" = 'john@example.com' and "email_history"."effective_to" is null) 
limit 1;
