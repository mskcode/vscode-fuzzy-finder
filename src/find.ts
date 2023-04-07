import * as cp from "child_process";

export const findInWorkspace = (
  input: string,
  onProcessExit: (
    result: FindResult | null,
    error: cp.ExecException | null
  ) => void
) => {
  const searchCommandBinary = "/usr/bin/rg";
  const searchCommandArguments = "--context=3 --json";
  const searchCommandSearchPattern = input;
  const searchCommandSearchPath = resolveWorkspacePath();
  const searchCommand = `${searchCommandBinary} ${searchCommandArguments} ${searchCommandSearchPattern} ${searchCommandSearchPath}`;

  const onExecCompletion = (
    error: cp.ExecException | null,
    stdout: string,
    stderr: string
  ) => {
    if (error) {
      const errorMessage = JSON.stringify(error);
      console.error(`ERROR: ${errorMessage}`);
      onProcessExit(null, error);
    } else {
      console.log("Processing search results");
      //console.log(`stdout: ${stdout} || stderr: ${stderr}`);

      const result = parseRgOutput(stdout);
      onProcessExit(result, null);
    }
  };

  console.log(`Executing command: ${searchCommand}`);
  const childProcess = cp.exec(searchCommand, onExecCompletion);
  //console.log(`Process exited with code ${childProcess.exitCode}`);
};

const resolveWorkspacePath = (): string => {
  return "/home/samuli/dev/mskcode/vscode-fuzzy-finder";
  /* const paths = vscode.workspace.workspaceFolders?.map(
    (folder) => folder.uri.path
  );
  if (!paths) {
    throw Error("Could not resolve workspace path");
  }
  return paths[0]; */
};

export type FindResultLine = {
  type: "context" | "match";
  lineNumber: number;
  content: string;
};

export type FindResultFile = {
  filePath: string;
  lines: FindResultLine[];
};

export type FindResult = {
  [filePath: string]: FindResultFile;
};

const parseRgOutput = (rgOutput: string): FindResult => {
  // ripgrep outputs the json lines in a natural order where matches within a
  // single file are subsequent
  const jsonLines = rgOutput.split("\n");
  const arr: any[] = [];
  for (let jsonLine of jsonLines) {
    if (jsonLine.trim().length > 0) {
      arr.push(JSON.parse(jsonLine));
    }
  }

  const result: FindResult = {};
  for (let obj of arr) {
    // notice that the summary type doesn't have this populated
    const filePath = obj.type !== "summary" ? obj.data.path.text : "";

    switch (obj.type) {
      case "begin":
        if (!result.hasOwnProperty(filePath)) {
          result[filePath] = {
            filePath: filePath,
            lines: [],
          };
        }
        break;
      case "end":
        // do nothing for now
        break;
      case "context":
        result[filePath].lines.push(mapContextTypeLine(obj));
        break;
      case "match":
        result[filePath].lines.push(mapMatchTypeLine(obj));
        break;
      case "summary":
        // do nothing for now
        break;
      default:
        console.error(`Unknown ripgrep data type '${obj.type}'`);
        break;
    }
  }

  return result;
};

/*
{
    "type": "context",
    "data": {
        "path": {
            "text": "package.json"
        },
        "lines": {
            "text": "    \"vscode:prepublish\": \"npm run compile\",\n"
        },
        "line_number": 24,
        "absolute_offset": 441,
        "submatches": []
    }
}
*/
const mapContextTypeLine = (obj: any): FindResultLine => {
  return {
    type: obj.type,
    lineNumber: obj.data.lines["line_number"] as number,
    content: obj.data.lines.text,
  };
};

/*
{
    "type": "match",
    "data": {
        "path": {
            "text": "package.json"
        },
        "lines": {
            "text": "    \"pretest\": \"npm run compile && npm run lint\",\n"
        },
        "line_number": 27,
        "absolute_offset": 546,
        "submatches": [
            {
                "match": {
                    "text": "test"
                },
                "start": 8,
                "end": 12
            }
        ]
    }
}
*/
const mapMatchTypeLine = (obj: any): FindResultLine => {
  return {
    type: obj.type,
    lineNumber: obj.data.lines["line_number"] as number,
    content: obj.data.lines.text,
  };
};

/*
{
    "type": "end",
    "data": {
        "path": {
            "text": "src/test/suite/index.ts"
        },
        "binary_offset": null,
        "stats": {
            "elapsed": {
                "secs": 0,
                "nanos": 104546,
                "human": "0.000105s"
            },
            "searches": 1,
            "searches_with_match": 1,
            "bytes_searched": 753,
            "bytes_printed": 5167,
            "matched_lines": 7,
            "matches": 8
        }
    }
}
*/
const mapEndTypeLine = (obj: any): any => {
  return {};
};

/*
{
    "data": {
        "elapsed_total": {
            "human": "0.011444s",
            "nanos": 11444195,
            "secs": 0
        },
        "stats": {
            "bytes_printed": 21004,
            "bytes_searched": 90138,
            "elapsed": {
                "human": "0.000684s",
                "nanos": 684456,
                "secs": 0
            },
            "matched_lines": 26,
            "matches": 35,
            "searches": 6,
            "searches_with_match": 6
        }
    },
    "type": "summary"
}
*/
const mapSummaryTypeLine = (obj: any): any => {
  return {};
};
