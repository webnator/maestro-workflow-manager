FROM node:8

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

# Expose port
EXPOSE 9000

# Start the server
ENV WFMANAGER_NODE_ENV development
ENV WFMANAGER_MONGO_URL mongodb://wf-mongo:27017/workflows
ENV WFMANAGER_QUEUE_HOST wf-rabbit
ENV WFMANAGER_QUEUE_PORT 5672
ENV WFMANAGER_QUEUE_USER guest
ENV WFMANAGER_QUEUE_PW guest

CMD [ "npm", "start" ]
