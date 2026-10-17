import type { PlopTypes } from "@turbo/gen";
import { createRequire } from "node:module";
import { join } from "node:path";

function validateComponentName(input: unknown): true | string {
  return typeof input === "string" &&
    /^[A-Za-z][A-Za-z0-9]*(?:[-_ ][A-Za-z0-9]+)*$/.test(input.trim())
    ? true
    : "Use a component name starting with a letter, with letters, digits, spaces, hyphens or underscores.";
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("react-component", {
    description: "Adds a new react component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the component?",
        validate: validateComponentName,
        filter: (input: string) => input.trim(),
      },
    ],
    actions: (answers) => {
      const validation = validateComponentName(answers?.name);
      if (validation !== true) throw new Error(validation);

      // CLI arguments can bypass prompts, so validate before any file action.
      const name = (answers?.name as string).trim();
      const path = plop.renderString("components/ui/{{kebabCase name}}.tsx", {
        name,
      });
      const filepath = join(plop.getDestBasePath(), path);
      return [
        {
          type: "add",
          path,
          data: { name },
          templateFile: "templates/component.tsx",
          transform: async (template: string) => {
            // Load workspace plugins from their real location, not the bundled config.
            const require = createRequire(
              join(plop.getDestBasePath(), "package.json"),
            );
            const prettier = require("prettier") as typeof import("prettier");
            const source = template.replaceAll(
              "GeneratedComponent",
              plop.renderString("{{pascalCase name}}", { name }),
            );
            return prettier.format(source, {
              ...(await prettier.resolveConfig(filepath)),
              filepath,
            });
          },
        },
      ];
    },
  });
}
