## EC2
ssh -i ./tunneler.pem -4 -L 3306:pennstagram.cowpvmapb2qr.us-east-1.rds.amazonaws.com:3306 ubuntu@ec2-100-25-213-166.compute-1.amazonaws.com
mysql --host=pennstagram.cowpvmapb2qr.us-east-1.rds.amazonaws.com --user=admin --password=rds-password

## Backend
nodemon server.js

## Frontend
npm run dev