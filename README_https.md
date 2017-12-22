# How to enable https
## Domain name
Head to https://www.duckdns.org/ to get a domain name.
Because of [certbot](https://certbot.eff.org/#ubuntuxenial-other) not support ec2 directly for the safety reason. [Here](https://community.letsencrypt.org/t/policy-forbids-issuing-for-name-on-amazon-ec2-domain/12692/4) is the specific explanation.

## Generate certificate
### Install certbot
```
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot
```
### Get certificate
```
sudo certbot certonly --standalone --preferred-challenges http-01 --email <your email> -d <your domain name>
```

## Copy certificate and change owner.
```
sudo cp /etc/letsencrypt/live/<your domain name>/fullchain.pem /home/ubuntu/keys/fullchain.pem
sudo cp /etc/letsencrypt/live/<your domain name>/privkey.pem /home/ubuntu/keys/privkey.pem
sudo chown ubuntu:ubuntu /home/ubuntu/keys/fullchain.pem
sudo chown ubuntu:ubuntu /home/ubuntu/keys/privkey.pem
```

## Redirect traffic
```
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8443
```

## Enable https
Enable the related https and http code in `iot-server/app.js`.

### Reference
1. https://certbot.eff.org/#ubuntuxenial-other
2. https://community.home-assistant.io/t/guide-how-to-set-up-duckdns-ssl-and-chrome-push-notifications/9722
3. https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
4. https://stackoverflow.com/questions/11744975/enabling-https-on-express-js
