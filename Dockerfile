# syntax=docker/dockerfile:experimental
FROM node:16 as base

RUN mkdir -p /srv/app
WORKDIR /srv/app
ENV PATH "$PATH:/srv/app/bin:/srv/app/node_modules/.bin"
EXPOSE 8080

# Set up build env
FROM base AS build
ADD ./ /srv/app

# Clean
RUN rm -Rf \
    node_modules

# Install dependencies
RUN --mount=type=cache,target=/home/node/.npm \
    npm install

# Build
RUN gulp clean && \
    gulp --production && \
    mkdir -p /srv/app/bin && \
    ln -s /srv/app/dist/main.js /srv/app/bin/server && \
    chmod +x /srv/app/bin/server

# Remove dev files
RUN rm -Rf \
    gulpfile.js \
    local.env \
    node_modules

# Install runtime JS dependencies
RUN --mount=type=cache,target=/home/node/.npm \
    npm install --production

# Extract built product and create final image
FROM base
COPY --from=build /srv/app /srv/app
USER node
CMD ["server"]
