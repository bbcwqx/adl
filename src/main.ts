import { ensureDirSync } from "jsr:@std/fs@1/ensure-dir";
import { AdlErrors } from "./errors.ts";

import readmeContents from "./templates/readme_template.md" with {
  type: "text",
};
import adrContents from "./templates/adr_template.md" with { type: "text" };
import templateReadmeContents from "./templates/readme_templates_folder.md" with {
  type: "text",
};
import denoJson from "../deno.json" with { type: "json" };

const COMMAND = {
  create: "create",
  init: "init",
  regen: "regen",
} as const;

const OPTION = {
  help: "--help",
  version: "--version",
} as const;

function readFileIfExists(path: string): string | null {
  try {
    return Deno.readTextFileSync(path);
  } catch {
    return null;
  }
}

function rebuildReadme(): void {
  const templateContents =
    readFileIfExists("./adr/templates/template_readme.md") || readmeContents;

  const date = new Date().toUTCString();
  const output = templateContents.replace("{{timestamp}}", date);
  const files = getAllFilesInADRDir();
  const formattedFiles = files
    .sort()
    .map((str) => ` - [${str}](./${str})\n`)
    .join("")
    .trimEnd();

  const withContents = output.replace("{{contents}}", formattedFiles);
  Deno.writeTextFileSync("./adr/README.md", withContents);
}

function getAllFilesInADRDir(): string[] {
  return Array.from(Deno.readDirSync("./adr"))
    .filter((entry) => entry.isFile)
    .map((entry) => entry.name)
    .filter((name) => name !== "README.md");
}

function generateADR(n: number, name: string): void {
  const paddedNums = n.toString().padStart(5, "0");
  const heading = `${paddedNums} - ${name}`;

  const templateContents =
    readFileIfExists("./adr/templates/template_adr.md") || adrContents;
  const contents = templateContents.replace("{{name}}", heading);

  const safeName = name.replace(/[\/\\:*?"<>|]/g, "").replace(/\s+/g, "-");

  const fileName = `./adr/${paddedNums}-${safeName}.md`;
  Deno.writeTextFileSync(fileName, contents);
}

function establishCoreFiles(): void {
  ensureDirSync("./adr/assets");
  ensureDirSync("./adr/templates");

  if (!Array.from(Deno.readDirSync("./adr/assets")).length) {
    Deno.createSync("./adr/assets/.gitkeep");
  }

  Deno.writeTextFileSync("./adr/templates/README.md", templateReadmeContents);
}

function isManaged(): boolean {
  try {
    const stat = Deno.statSync("./adr");
    if (!stat.isDirectory) {
      throw new AdlErrors.AdrIsFile();
    }
    return true;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    return false;
  }
}

function assertIsManaged(): void {
  let managed = false;
  try {
    managed = isManaged();
  } catch (err) {
    if (!(err instanceof AdlErrors.AdrIsFile)) {
      throw err;
    }
  }
  if (!managed) {
    console.error(
      `%cerror%c: Not managed by adl. Run 'adl ${COMMAND.init}' first.`,
      "color: red;",
      "color: white;",
    );
    Deno.exit(1);
  }
}

function initialize(): void {
  let overwrite = false;
  try {
    if (isManaged()) {
      overwrite = true;
    }
  } catch (err) {
    if (!(err instanceof AdlErrors.AdrIsFile)) {
      throw err;
    }
    overwrite = true;
  }
  if (overwrite) {
    const proceed = confirm("File(s) found. Overwrite?");
    if (!proceed) {
      console.log("Aborting...");
      Deno.exit(0);
    }
    Deno.removeSync("./adr", { recursive: true });
  }
  establishCoreFiles();
  rebuildReadme();
}

function main(args: string[]): void {
  const cmd = args[0];

  switch (cmd) {
    case COMMAND.init: {
      initialize();
      break;
    }
    case COMMAND.create: {
      if (args.length < 2) {
        console.error(
          "%cerror%c: No name supplied for the ADR\n",
          "color: red;",
          "color: white;",
        );
        console.log("Usage: adl create <name>");
        Deno.exit(1);
      }

      assertIsManaged();

      const name = args.slice(1).join(" ");
      const fileList = getAllFilesInADRDir();

      generateADR(fileList.length, name);
      rebuildReadme();
      break;
    }
    case COMMAND.regen: {
      assertIsManaged();
      rebuildReadme();
      break;
    }
    case OPTION.help: {
      printHelpText();
      break;
    }
    case OPTION.version: {
      console.log(`${denoJson.name} ${denoJson.version}`);
      break;
    }
    default: {
      if (cmd) {
        console.error(
          `%cerror%c: unexpected argument: '${cmd}' found\n`,
          "color: red;",
          "color: white;",
        );
      }
      printHelpText();
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  main(Deno.args);
}

function printHelpText(): void {
  console.log(
    "adl: %cManage Architecture Design Records",
    "color: green;",
  );
  console.log();
  console.log("%cUsage: %cadl [COMMAND]", "color: gray;", "color: green;");
  console.log();
  console.log("%cCommands:", "color: yellow;");
  console.log(
    `  %c${COMMAND.create}%c\tCreate a new ADR`,
    "color: green;",
    "color: white;",
  );
  console.log("\t\t %cadl create Migrate to Deno again", "color: gray;");
  console.log(
    `  %c${COMMAND.init}%c\t\tInitialize the ADR directory`,
    "color: green;",
    "color: white;",
  );
  console.log(
    `  %c${COMMAND.regen}%c\t\tRegenerate the ADR README.md`,
    "color: green;",
    "color: white;",
  );
  console.log();
  console.log("%cOptions:", "color: yellow;");
  console.log(
    `  %c${OPTION.help}%c\tShow this help text`,
    "color: green;",
    "color: white;",
  );
  console.log(
    `  %c${OPTION.version}%c\tShow version info`,
    "color: green;",
    "color: white;",
  );
}
