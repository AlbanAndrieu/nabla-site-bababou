# syntax=docker/dockerfile:1
# Serves the static site from public/ (no PHP runtime).
FROM nginx:1.27-alpine

LABEL name="nabla-site-bababou" vendor="nabla" version="0.0.5"

COPY public/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
