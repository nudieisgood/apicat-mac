FROM nginx:1.21.1
COPY deploy/default.conf /etc/nginx/conf.d/default.conf
COPY public/email-redirect /app/email-redirect