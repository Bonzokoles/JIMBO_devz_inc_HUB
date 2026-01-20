FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Set env vars for build
ARG VITE_OPENROUTER_API_KEY
ARG VITE_BACKEND_API_URL
ARG VITE_AGENT_ZERO_API_URL
ENV VITE_OPENROUTER_API_KEY=$VITE_OPENROUTER_API_KEY
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_AGENT_ZERO_API_URL=$VITE_AGENT_ZERO_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
