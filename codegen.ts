import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.json',
  documents: ['src/graphql/operations/**/*.graphql'],
  generates: {
    './src/graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        strictScalars: true,
        scalars: {
          Float: 'number',
          Int: 'number',
          ID: 'string',
          JSON: 'string',
        },
        avoidOptionals: false,
        enumsAsTypes: true,
        skipTypename: true,
        documentMode: 'documentNode',
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
