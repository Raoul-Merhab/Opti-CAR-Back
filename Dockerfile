FROM node:20-alpine

WORKDIR /app


COPY package*.json ./

RUN npm install

RUN npm install @prisma/client

COPY . .


RUN npx prisma generate


EXPOSE 5424

CMD ["npm", "run", "dev"]