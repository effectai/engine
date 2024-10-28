FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run packages:build
RUN pnpm deploy --filter=@effectai/task-relay --prod /prod/relay

FROM base AS relay
COPY --from=build /prod/relay /prod/relay
WORKDIR /prod/relay
EXPOSE 8000
CMD [ "pnpm", "start" ]