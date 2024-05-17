import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["node_modules", "data/*", "dist/*"],
    rules: {
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "never",
        },
      ],
    },
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
  },
];
