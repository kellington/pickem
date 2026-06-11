

It should be easy to remove a user - or clean up.

--SELECT * FROM users;

--delete from users 
 -- where id = '60743061';

select * from app_users;



delete 

  from app_users where replit_user_id = '60743061';

select * ;

  delete 
    from league_members
  where app_user_id = 'c0ecdcec-1637-4612-8d23-628dac297b6e'
;

select * ;
delete  from player_profiles
where league_member_id = 'ced414a9-4535-4720-9ecb-c143a57cb7b7'
  --where app_user_id = 'c0ecdcec-1637-4612-8d23-628dac297b6e'
;

select * from season_members;

delete  from season_members
where league_member_id = 'ced414a9-4535-4720-9ecb-c143a57cb7b7'

;
select * ;

delete from picks
  where season_member_id = 
'7b7657de-5eed-4cb9-8dba-a103309e26e2'
;