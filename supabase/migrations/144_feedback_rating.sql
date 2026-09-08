-- Feedback (atsauksmes) has a 0-5 star rating and no required title.

alter table public.site_user_feedback
  add column if not exists rating smallint;

update public.site_user_feedback
set rating = 0
where kind = 'feedback' and rating is null;

alter table public.site_user_feedback
  drop constraint if exists site_user_feedback_title_len;

alter table public.site_user_feedback
  add constraint site_user_feedback_title_len check (
    (
      kind = 'feedback'
      and char_length(btrim(title)) between 0 and 200
    )
    or (
      kind <> 'feedback'
      and char_length(btrim(title)) between 1 and 200
    )
  );

alter table public.site_user_feedback
  drop constraint if exists site_user_feedback_rating_range;

alter table public.site_user_feedback
  add constraint site_user_feedback_rating_range check (
    rating is null or (rating >= 0 and rating <= 5)
  );

alter table public.site_user_feedback
  drop constraint if exists site_user_feedback_rating_kind;

alter table public.site_user_feedback
  add constraint site_user_feedback_rating_kind check (
    (kind = 'feedback' and rating is not null)
    or (kind <> 'feedback' and rating is null)
  );
