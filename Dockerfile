FROM node:alpine

COPY . /tool
WORKDIR /tool

RUN npm install && \
    npm run build

RUN rm -rf .git/

ENTRYPOINT ["npm", "start", "--"]
CMD []

