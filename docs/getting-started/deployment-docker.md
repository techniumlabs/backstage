---
id: deployment-docker
title: Docker
description: Documentation on how to deploy Backstage as a Docker image
---

This section describes how to build a Backstage App into a deployable Docker
image. It is split into three sections, first covering the host build approach,
which is recommended due its speed and more efficient and often simpler caching.
The second section covers a full multi-stage Docker build, and the last section
covers how to split frontend content into a separate image.

Something that goes for all of these docker deployment strategies is that they
are stateless, so for a production deployment you will want to set up and
connect to an external PostgreSQL instance where the backend plugins can store
their state, rather than using SQLite.

### Host Build

This section describes how to build a Docker image from a Backstage repo with
most of the build happening outside of Docker. This is almost always the faster
approach, as the build steps tend to execute faster, and it's possible to have
more efficient caching of dependencies on the host, where a single change won't
bust the entire cache.

The required steps in the host build are to install dependencies with
`yarn install`, generate type definitions using `yarn tsc`, and build all
packages with `yarn build`.

> NOTE: Using `yarn build` to build packages and bundle the backend assumes that
> you have migrated to using `backstage-cli backend:bundle` as your build script
> in the backend package.

In a CI workflow it might look something like this:

```bash
yarn install --frozen-lockfile

# tsc outputs type definitions to dist-types/ in the repo root, which are then consumed by the build
yarn tsc

# Build all packages and in the end bundle them all up into the packages/backend/dist folder.
yarn build
```

Once the host build is complete, we are ready to build our image. We use the
following `Dockerfile`, which is also included when creating a new app with
`@backstage/create-app`:

```Dockerfile
# This dockerfile builds an image for the backend package.
# It should be executed with the root of the repo as docker context.
#
# Before building this image, be sure to have run the following commands in the repo root:
#
# yarn install
# yarn tsc
# yarn build
#
# Once the commands have been run, you can build the image using `yarn build-image`

FROM node:14-buster-slim

WORKDIR /app

# Copy repo skeleton first, to avoid unnecessary docker cache invalidation.
# The skeleton contains the package.json of each package in the monorepo,
# and along with yarn.lock and the root package.json, that's enough to run yarn install.
ADD yarn.lock package.json packages/backend/dist/skeleton.tar.gz ./

RUN yarn install --frozen-lockfile --production --network-timeout 300000 && rm -rf "$(yarn cache dir)"

# Then copy the rest of the backend bundle, along with any other files we might want.
ADD packages/backend/dist/bundle.tar.gz app-config.yaml ./

CMD ["node", "packages/backend", "--config", "app-config.yaml"]
```

For more details on how the `backend:bundle` command and the `skeleton.tar.gz`
file works, see the
[`backend:bundle` command docs](../cli/commands.md#backendbundle)

The `Dockerfile` is typically placed at `packages/backend/Dockerfile`, but needs
to be executed with the root of the repo as the build context, in order to get
access to the root `yarn.lock` and `package.json`, along with any other files
that might be needed, such as `.npmrc`.

In order to speed up the build we can significantly reduce the build context
size using the following `.dockerignore` in the root of the repo:

```text
.git
node_modules
packages
!packages/backend/dist
plugins
```

With the project build and the `.dockerignore` and `Dockerfile` in place, we are
now ready to build the final image. Assuming we're at the root of the repo, we
execute the build like this:

```bash
docker image build . -f packages/backend/Dockerfile --tag backstage
```

To try out the image locally you can run the following:

```sh
docker run -it -p 7000:7000 backstage
```

You should then start to get logs in your terminal, and then you can open your
browser at `http://localhost:7000`

### Multistage Build

This section describes how to set up a multi-stage Docker build that builds the
entire project within Docker. This is typically slower than a host build, but is
sometimes desired because Docker in Docker is not available in the build
environment, or due to other requirements.

The build is split into three different stages, where the first stage finds all
of the `package.json`s that are relevant for the initial install step enabling
us to cache the initial `yarn install` that installs all dependencies. The
second stage executes the build itself, and is similar to the steps we execute
on the host in the host build. The third and final stage then packages it all
together into the final image, and is similar to the `Dockerfile` of the host
build.

The following `Dockerfile` executes the multi-stage build and should be added to
the repo root:

```Dockerfile
# Stage 1 - Create yarn install skeleton layer
FROM node:14-buster-slim AS packages

WORKDIR /app
COPY package.json yarn.lock ./

COPY packages packages
COPY plugins plugins

RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf

# Stage 2 - Install dependencies and build packages
FROM node:14-buster-slim AS build

WORKDIR /app
COPY --from=packages /app .

RUN yarn install --frozen-lockfile --network-timeout 600000 && rm -rf "$(yarn cache dir)"

COPY . .

RUN yarn tsc
RUN yarn --cwd packages/backend backstage-cli backend:bundle --build-dependencies

# Stage 3 - Build the actual backend image and install production dependencies
FROM node:14-buster-slim

WORKDIR /app

# Copy the install dependencies from the build stage and context
COPY --from=build /app/yarn.lock /app/package.json /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

RUN yarn install --frozen-lockfile --production --network-timeout 600000 && rm -rf "$(yarn cache dir)"

# Copy the built packages from the build stage
COPY --from=build /app/packages/backend/dist/bundle.tar.gz .
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy any other files that we need at runtime
COPY app-config.yaml ./

CMD ["node", "packages/backend", "--config", "app-config.yaml"]
```

Note that a newly created Backstage app will typically not have a `plugins/`
folder, so you will want to comment that line out. This build also does not work
in the main repo, since the `backstage-cli` which is used for the build doesn't
end up being properly installed.

To speed up the build when not running in a fresh clone of the repo you should
set up a `.dockerignore`. This one is different than the host build one, because
we want to have access to the source code of all packages for the build, but can
ignore any existing build output or dependencies:

```text
node_modules
packages/*/dist
packages/*/node_modules
plugins/*/dist
plugins/*/node_modules
```

Once you have added both the `Dockerfile` and `.dockerignore` to the root of
your project, run the following to build the container under a specified tag.

```sh
docker image build -t backstage .
```

To try out the image locally you can run the following:

```sh
docker run -it -p 7000:7000 backstage
```

You should then start to get logs in your terminal, and then you can open your
browser at `http://localhost:7000`

### Separate Frontend

It is sometimes desirable to serve the frontend separately from the backend,
either from a separate image or for example a static file serving provider. The
first step in doing so is to remove the `app-backend` plugin from the backend
package, which is done as follows:

1. Delete `packages/backend/src/plugins/app.ts`
2. Remove the following lines from `packages/backend/src/index.ts`:
   ```tsx
   import app from './plugins/app';
   // ...
     const appEnv = useHotMemoize(module, () => createEnv('app'));
   // ...
       .addRouter('', await app(appEnv));
   ```
3. Remove the `@backstage/plugin-app-backend` and the app package dependency
   (e.g. `app`) from `packages/backend/packages.json`. If you don't remove the
   app package dependency the app will still be built and bundled with the
   backend.

Once the `app-backend` is removed from the backend, you can use your favorite
static file serving method for serving the frontend. An example of how to set up
an NGINX image is available in the
[contrib folder in the main repo](https://github.com/backstage/backstage/blob/master/contrib/docker/frontend-with-nginx/Dockerfile)