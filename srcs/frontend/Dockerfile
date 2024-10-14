FROM nginx:1.27.2

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY ./srcs /usr/share/nginx/html

EXPOSE 80

WORKDIR /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]