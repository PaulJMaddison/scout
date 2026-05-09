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

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ContextLayer.Api.dll"]
