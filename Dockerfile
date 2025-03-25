FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run packages:build
RUN pnpm deploy --filter=@effectai/protocol --prod /prod/manager

FROM base AS manager
COPY --from=build /prod/manager /prod/manager
WORKDIR /prod/manager
EXPOSE 34859
CMD [ "pnpm", "manager:start" ]
