FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Directory.Build.props", "."]
COPY ["Directory.Packages.props", "."]
COPY ["global.json", "."]
COPY ["ContextLayer.slnx", "."]
COPY ["src/ContextLayer.Domain/ContextLayer.Domain.csproj", "src/ContextLayer.Domain/"]
COPY ["src/ContextLayer.Application/ContextLayer.Application.csproj", "src/ContextLayer.Application/"]
COPY ["src/ContextLayer.Infrastructure/ContextLayer.Infrastructure.csproj", "src/ContextLayer.Infrastructure/"]
COPY ["src/ContextLayer.Api/ContextLayer.Api.csproj", "src/ContextLayer.Api/"]

RUN dotnet restore "src/ContextLayer.Api/ContextLayer.Api.csproj"

COPY . .
RUN dotnet publish "src/ContextLayer.Api/ContextLayer.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && mkdir -p /var/lib/ucl/data-protection-keys \
    && chown -R $APP_UID:$APP_UID /var/lib/ucl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_EnableDiagnostics=0
ENV Platform__Mode=SaaS
ENV Database__Provider=Postgres
ENV Bootstrap__ApplyMigrationsOnStartup=false
ENV Bootstrap__SeedDemoData=false
ENV Platform__EnableGraphQl=true
ENV Platform__EnableRest=true
ENV Platform__EnableOpenApi=true
EXPOSE 8080

COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail http://127.0.0.1:8080/health/ready || exit 1

USER $APP_UID

ENTRYPOINT ["dotnet", "ContextLayer.Api.dll"]
