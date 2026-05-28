# Scout Contract Parity

Local parity checker for public KynticAI Scout API, SDK, and connector manifest contracts.

```bash
npm run build
npm run test
npm start -- --repo-root ../../..
```

The checker reads public REST/application contract records, GraphQL query/mutation method signatures, the .NET SDK models, the TypeScript SDK types, and connector manifest validator constants. It reports missing fields, likely renamed fields, enum mismatches, and manifest features that the public connector validator does not support.
