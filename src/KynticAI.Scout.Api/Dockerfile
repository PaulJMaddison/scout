FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Directory.Build.props", "."]
COPY ["Directory.Packages.props", "."]
COPY ["global.json", "."]
COPY ["KynticAI.Scout.slnx", "."]
COPY ["src/KynticAI.Scout.Domain/KynticAI.Scout.Domain.csproj", "src/KynticAI.Scout.Domain/"]
COPY ["src/KynticAI.Scout.Application/KynticAI.Scout.Application.csproj", "src/KynticAI.Scout.Application/"]
COPY ["src/KynticAI.Scout.Infrastructure/KynticAI.Scout.Infrastructure.csproj", "src/KynticAI.Scout.Infrastructure/"]
COPY ["src/KynticAI.Scout.Api/KynticAI.Scout.Api.csproj", "src/KynticAI.Scout.Api/"]

RUN dotnet restore "src/KynticAI.Scout.Api/KynticAI.Scout.Api.csproj"

COPY . .
RUN dotnet publish "src/KynticAI.Scout.Api/KynticAI.Scout.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && mkdir -p /var/lib/scout/data-protection-keys \
    && chown -R $APP_UID:$APP_UID /var/lib/scout \
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
ENV Platform__EnableOpenApi=false
EXPOSE 8080

COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail http://127.0.0.1:8080/health/ready || exit 1

USER $APP_UID

ENTRYPOINT ["dotnet", "KynticAI.Scout.Api.dll"]
